import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("[webhook] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log("[webhook] received event:", event.type);

  const supabase = createAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { user_id, toolkit_slug } = session.metadata ?? {};
    const subscription_id = session.subscription as string;

    console.log("[webhook] checkout.session.completed metadata:", { user_id, toolkit_slug, subscription_id });

    if (!user_id || !toolkit_slug || !subscription_id) {
      console.error("[webhook] missing required metadata fields", { user_id, toolkit_slug, subscription_id });
      // Return 200 — missing metadata is not retryable
      return NextResponse.json({ received: true });
    }

    let sub: Stripe.Subscription;
    try {
      sub = await stripe.subscriptions.retrieve(subscription_id);
    } catch (err) {
      console.error("[webhook] failed to retrieve subscription", subscription_id, err);
      return NextResponse.json({ error: "Subscription retrieval failed" }, { status: 500 });
    }

    const { error: upsertError } = await supabase.from("subscriptions").upsert(
      {
        user_id,
        toolkit_slug,
        stripe_subscription_id: subscription_id,
        stripe_customer_id: session.customer as string,
        status: "active",
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      },
      { onConflict: "user_id,toolkit_slug" }
    );

    if (upsertError) {
      console.error("[webhook] subscriptions upsert failed:", upsertError);
      // Return 500 so Stripe retries the webhook
      return NextResponse.json({ error: "DB write failed" }, { status: 500 });
    }

    console.log("[webhook] subscription written successfully:", { user_id, toolkit_slug });

    const { error: analyticsError } = await supabase.from("analytics_events").insert({
      event_type: "subscription_created",
      user_id,
      toolkit_slug,
    });

    if (analyticsError) {
      // Non-critical — log but don't fail the webhook
      console.warn("[webhook] analytics insert failed:", analyticsError);
    }

    // ── Referral 奖励：首次付费时查找 pending referral ───────────────
    const { data: referral } = await supabase
      .from("referrals")
      .select("id, referrer_id")
      .eq("referred_user_id", user_id)
      .eq("status", "pending")
      .single();

    if (referral) {
      await supabase.from("referral_rewards").insert({
        user_id: referral.referrer_id,
        reward_type: "free_month",
        reward_value: "1",
        applied: false,
      });
      await supabase
        .from("referrals")
        .update({ status: "rewarded" })
        .eq("id", referral.id);
      console.log("[webhook] referral reward created for:", referral.referrer_id);

      // ── 联盟佣金记录（30% 首月）──────────────────────────────────────
      try {
        const subscriptionAmount = sub.items?.data[0]?.price?.unit_amount ?? 0;
        const commissionAmount = Math.round(subscriptionAmount * 0.30);
        await supabase.from("affiliate_commissions").insert({
          referrer_id: referral.referrer_id,
          referred_user_id: user_id,
          amount: commissionAmount,
          rate: 0.30,
          status: "pending",
          stripe_payment_id: subscription_id,
        });
        console.log("[webhook] affiliate commission created:", { referrer: referral.referrer_id, amount: commissionAmount });
      } catch (commErr) {
        console.warn("[webhook] affiliate commission insert failed:", commErr);
      }
      // ──────────────────────────────────────────────────────────────────
    }
    // ─────────────────────────────────────────────────────────────────
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const status = event.type === "customer.subscription.deleted" ? "canceled" : sub.status;

    console.log("[webhook] subscription status update:", { id: sub.id, status });

    const { error } = await supabase
      .from("subscriptions")
      .update({
        status,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      })
      .eq("stripe_subscription_id", sub.id);

    if (error) {
      console.error("[webhook] subscription status update failed:", error);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }
  }

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
        console.error("[webhook] price update failed:", error);
      } else {
        console.log(`[webhook] price.updated: ${slug} → $${newPrice}`);
      }
    }
  }

  return NextResponse.json({ received: true });
}
