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

    // Cancel at period end in Stripe (no immediate refund)
    const stripeSub = await stripe.subscriptions.update(stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    // Sync the real current_period_end from Stripe
    const periodEndTs = stripeSub.current_period_end as number | undefined;
    const periodEnd =
      periodEndTs && periodEndTs > 0
        ? new Date(periodEndTs * 1000).toISOString()
        : dbSub.current_period_end;

    // Write all three fields to DB
    const { error: updateError } = await admin
      .from("subscriptions")
      .update({
        status: "canceling",
        current_period_end: periodEnd,
        cancel_at_period_end: true,
      })
      .eq("stripe_subscription_id", stripe_subscription_id);

    if (updateError) {
      console.error("[cancel] DB update failed:", updateError.message);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }

    // ── Post-write verification ───────────────────────────────────────────
    const { data: verified } = await admin
      .from("subscriptions")
      .select("status, cancel_at_period_end, current_period_end")
      .eq("stripe_subscription_id", stripe_subscription_id)
      .single();

    const verifyOk =
      verified?.status === "canceling" &&
      verified?.cancel_at_period_end === true &&
      !!verified?.current_period_end;

    if (!verifyOk) {
      console.error("[cancel] DB verification failed — forcing retry:", verified);
      // Force retry: update individually to avoid column-level failures
      await admin
        .from("subscriptions")
        .update({ status: "canceling" })
        .eq("stripe_subscription_id", stripe_subscription_id);
      await admin
        .from("subscriptions")
        .update({ current_period_end: periodEnd })
        .eq("stripe_subscription_id", stripe_subscription_id);
      await admin
        .from("subscriptions")
        .update({ cancel_at_period_end: true })
        .eq("stripe_subscription_id", stripe_subscription_id);
      console.log("[cancel] forced retry complete");
    } else {
      console.log("[cancel] ✅ DB verified:", verified);
    }

    return NextResponse.json({ success: true, cancel_at: periodEnd });
  } catch (err) {
    console.error("[cancel]", err);
    return NextResponse.json({ error: "Cancel failed" }, { status: 500 });
  }
}
