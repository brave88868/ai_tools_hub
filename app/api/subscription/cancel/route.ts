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

    // Cancel at period end (no immediate refund)
    const stripeSub = await stripe.subscriptions.update(stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    // Sync the real current_period_end from Stripe
    const periodEndTs = stripeSub.current_period_end as number | undefined;
    const periodEnd =
      periodEndTs && periodEndTs > 0
        ? new Date(periodEndTs * 1000).toISOString()
        : dbSub.current_period_end;

    // Update DB — include cancel_at_period_end if the column exists
    // (Column may need to be added via SQL migration; update will skip unknown columns gracefully)
    const { error: updateError } = await admin
      .from("subscriptions")
      .update({
        status: "canceling",
        current_period_end: periodEnd,
        cancel_at_period_end: true,
      })
      .eq("stripe_subscription_id", stripe_subscription_id);

    if (updateError) {
      // cancel_at_period_end column may not exist yet — retry without it
      console.warn("[cancel] update with cancel_at_period_end failed, retrying:", updateError.message);
      await admin
        .from("subscriptions")
        .update({ status: "canceling", current_period_end: periodEnd })
        .eq("stripe_subscription_id", stripe_subscription_id);
    }

    console.log("[cancel] ✅ subscription canceling:", { stripe_subscription_id, periodEnd });

    return NextResponse.json({ success: true, cancel_at: periodEnd });
  } catch (err) {
    console.error("[cancel]", err);
    return NextResponse.json({ error: "Cancel failed" }, { status: 500 });
  }
}
