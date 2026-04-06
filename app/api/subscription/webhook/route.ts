import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase";
import Stripe from "stripe";

// Safe conversion: Stripe timestamps are Unix seconds (number | undefined)
function toIso(ts: number | null | undefined): string | null {
  if (ts == null || isNaN(ts)) return null;
  return new Date(ts * 1000).toISOString();
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    console.error("[webhook] missing stripe-signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[webhook] signature verification failed:", msg);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log("[webhook] received:", event.type, "id:", event.id);

  const supabase = createAdminClient();

  try {
    // ── checkout.session.completed ─────────────────────────────────────
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const { user_id, toolkit_slug } = session.metadata ?? {};
      const subscription_id = session.subscription as string | null;

      console.log("[webhook] checkout.session.completed:", { user_id, toolkit_slug, subscription_id });

      if (!user_id || !toolkit_slug) {
        // Non-retryable — return 200
        console.warn("[webhook] missing user_id or toolkit_slug in metadata");
        return NextResponse.json({ received: true });
      }

      if (!subscription_id) {
        // Could be a one-time payment, not a subscription
        console.warn("[webhook] no subscription_id on session — skipping");
        return NextResponse.json({ received: true });
      }

      let sub: Stripe.Subscription;
      try {
        sub = await stripe.subscriptions.retrieve(subscription_id);
      } catch (err) {
        console.error("[webhook] failed to retrieve subscription:", subscription_id, err);
        return NextResponse.json({ error: "Subscription retrieval failed" }, { status: 500 });
      }

      // Ensure user record exists (prevent FK violation)
      await supabase
        .from("users")
        .upsert({ id: user_id }, { onConflict: "id", ignoreDuplicates: true });

      // Try upsert — works if unique constraint (user_id, toolkit_slug) exists
      // Fall back to delete+insert if upsert fails
      const periodEnd = toIso(sub.current_period_end as number | undefined);
      const subRecord = {
        user_id,
        toolkit_slug,
        stripe_subscription_id: subscription_id,
        stripe_customer_id: session.customer as string,
        status: "active",
        current_period_end: periodEnd,
      };

      let writeError: { message: string } | null = null;

      const { error: upsertError } = await supabase
        .from("subscriptions")
        .upsert(subRecord, { onConflict: "user_id,toolkit_slug" });

      if (upsertError) {
        console.warn("[webhook] upsert failed, trying delete+insert:", upsertError.message);
        // Delete existing record then insert fresh
        await supabase
          .from("subscriptions")
          .delete()
          .eq("user_id", user_id)
          .eq("toolkit_slug", toolkit_slug);

        const { error: insertError } = await supabase
          .from("subscriptions")
          .insert(subRecord);

        writeError = insertError;
      }

      if (writeError) {
        console.error("[webhook] subscription write failed:", writeError.message);
        return NextResponse.json({ error: "DB write failed" }, { status: 500 });
      }

      console.log("[webhook] ✅ subscription written:", { user_id, toolkit_slug });

      // Sync users.plan
      await supabase.from("users").update({ plan: "pro" }).eq("id", user_id);

      // Analytics (non-critical)
      supabase.from("analytics_events").insert({
        event_type: "subscription_created",
        user_id,
        toolkit_slug,
      }).then(({ error }) => {
        if (error) console.warn("[webhook] analytics insert failed:", error.message);
      });

      // Referral reward
      const { data: referral } = await supabase
        .from("referrals")
        .select("id, referrer_id")
        .eq("referred_user_id", user_id)
        .eq("status", "pending")
        .maybeSingle();

      if (referral) {
        await supabase.from("referral_rewards").insert({
          user_id: referral.referrer_id,
          reward_type: "free_month_bundle",
          reward_value: "1",
          applied: false,
        });
        await supabase
          .from("referrals")
          .update({ status: "rewarded" })
          .eq("id", referral.id);

        // Affiliate commission (30%)
        try {
          const unitAmount = sub.items?.data[0]?.price?.unit_amount ?? 0;
          const commissionAmount = Math.round(unitAmount * 0.20);
          await supabase.from("affiliate_commissions").insert({
            referrer_id: referral.referrer_id,
            referred_user_id: user_id,
            amount: commissionAmount,
            rate: 0.20,
            status: "pending",
            stripe_payment_id: subscription_id,
          });
          console.log("[webhook] affiliate commission created:", commissionAmount);
        } catch (commErr) {
          console.warn("[webhook] affiliate commission failed:", commErr);
        }
      }
    }

    // ── customer.subscription.updated / deleted ────────────────────────
    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const sub = event.data.object as Stripe.Subscription;
      const status =
        event.type === "customer.subscription.deleted" ? "canceled" : sub.status;

      console.log("[webhook] subscription status update:", { id: sub.id, status });

      const periodEnd = toIso(sub.current_period_end as number | undefined);

      const cancelAtPeriodEnd =
        event.type === "customer.subscription.deleted"
          ? false
          : (sub.cancel_at_period_end ?? false);

      const { error, data: updatedSubs } = await supabase
        .from("subscriptions")
        .update({ status, current_period_end: periodEnd, cancel_at_period_end: cancelAtPeriodEnd })
        .eq("stripe_subscription_id", sub.id)
        .select("user_id");

      if (error) {
        console.error("[webhook] subscription status update failed:", error.message);
        return NextResponse.json({ error: "DB update failed" }, { status: 500 });
      }

      // Downgrade plan if no active subscriptions remain
      if (status === "canceled" && updatedSubs && updatedSubs.length > 0) {
        const userId = updatedSubs[0].user_id;
        const { count } = await supabase
          .from("subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("status", "active");
        if ((count ?? 0) === 0) {
          await supabase.from("users").update({ plan: "free" }).eq("id", userId);
          console.log("[webhook] user downgraded to free:", userId);
        }
      }
    }

    // ── price.updated ──────────────────────────────────────────────────
    if (event.type === "price.updated") {
      const price = event.data.object as Stripe.Price;
      const lookupKey = price.lookup_key ?? "";
      const slug = lookupKey.split("_toolkit_")[0];
      const newPrice = Math.round((price.unit_amount ?? 0) / 100);

      if (slug && newPrice > 0) {
        const { error } = await supabase
          .from("toolkits")
          .update({ price_monthly: newPrice })
          .eq("slug", slug);

        if (error) {
          console.error("[webhook] price update failed:", error.message);
        } else {
          console.log(`[webhook] price.updated: ${slug} → $${newPrice}`);
        }
      }
    }
  } catch (err) {
    // Catch-all: log but return 200 to prevent infinite Stripe retries
    // for events that can never succeed (missing data, logic errors)
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[webhook] unhandled error:", msg, err);
    // Return 500 only for retriable errors; for logic errors return 200
    if (err instanceof Error && err.message.includes("DB")) {
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
