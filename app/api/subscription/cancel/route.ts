import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { stripe_subscription_id } = await req.json();

    if (!stripe_subscription_id) {
      return NextResponse.json({ error: "Missing subscription ID" }, { status: 400 });
    }

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Verify subscription belongs to this user
    const { data: dbSub } = await admin
      .from("subscriptions")
      .select("stripe_subscription_id, current_period_end")
      .eq("user_id", user.id)
      .eq("stripe_subscription_id", stripe_subscription_id)
      .single();

    if (!dbSub) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    const isManual =
      stripe_subscription_id.startsWith("manual_") ||
      stripe_subscription_id.startsWith("referral_reward_");

    let periodEnd = dbSub.current_period_end;
    let newStatus: "canceling" | "canceled" = "canceling";

    if (isManual) {
      // Manual / referral subscriptions have no real Stripe record — skip Stripe.
      console.log("[cancel] manual/referral subscription — skipping Stripe call");
    } else {
      // Defensive retrieve: check Stripe state before acting.
      // Handles cases where the subscription was already canceled or never synced.
      let current: import("stripe").Stripe.Subscription | null = null;
      try {
        current = await stripe.subscriptions.retrieve(stripe_subscription_id);
      } catch (retrieveErr: unknown) {
        const msg = retrieveErr instanceof Error ? retrieveErr.message : String(retrieveErr);
        if (msg.includes("No such subscription")) {
          // Subscription doesn't exist in Stripe — auto-fix DB and succeed
          console.warn("[cancel] subscription not found in Stripe, marking canceled in DB:", stripe_subscription_id);
          await admin
            .from("subscriptions")
            .update({ status: "canceled" })
            .eq("stripe_subscription_id", stripe_subscription_id);
          return NextResponse.json({ success: true, cancel_at: periodEnd });
        }
        throw retrieveErr; // Re-throw unexpected Stripe errors
      }

      if (current.status === "canceled") {
        // Already canceled in Stripe — sync DB and succeed
        console.log("[cancel] already canceled in Stripe, syncing DB:", stripe_subscription_id);
        await admin
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("stripe_subscription_id", stripe_subscription_id);
        return NextResponse.json({ success: true, cancel_at: periodEnd });
      }

      // Normal case: request cancel-at-period-end
      const updated = await stripe.subscriptions.update(stripe_subscription_id, {
        cancel_at_period_end: true,
      });
      const periodEndTs = updated.current_period_end as number | undefined;
      if (periodEndTs && periodEndTs > 0) {
        periodEnd = new Date(periodEndTs * 1000).toISOString();
      }
      newStatus = "canceling";
    }

    // Update DB — only columns that exist in the schema
    const { error: updateError } = await admin
      .from("subscriptions")
      .update({ status: newStatus, current_period_end: periodEnd })
      .eq("stripe_subscription_id", stripe_subscription_id);

    if (updateError) {
      console.error("[cancel] DB update failed:", updateError.message);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }

    console.log("[cancel] ✅ cancelled:", stripe_subscription_id);
    return NextResponse.json({ success: true, cancel_at: periodEnd });
  } catch (err) {
    console.error("[cancel]", err);
    return NextResponse.json({
      error: "Cancel failed",
      detail: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
