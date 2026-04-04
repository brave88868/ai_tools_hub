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

    // 校验订阅归属当前用户
    const admin = createAdminClient();
    const { data: sub } = await admin
      .from("subscriptions")
      .select("stripe_subscription_id, current_period_end")
      .eq("user_id", user.id)
      .eq("stripe_subscription_id", stripe_subscription_id)
      .single();

    if (!sub) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // 在当前计费周期结束时取消（不立即取消）
    await stripe.subscriptions.update(stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    // 更新本地状态
    await admin
      .from("subscriptions")
      .update({ status: "canceling" })
      .eq("stripe_subscription_id", stripe_subscription_id);

    return NextResponse.json({
      success: true,
      cancel_at: sub.current_period_end,
    });
  } catch (err) {
    console.error("[cancel]", err);
    return NextResponse.json({ error: "Cancel failed" }, { status: 500 });
  }
}
