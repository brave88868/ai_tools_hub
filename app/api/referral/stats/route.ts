import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [
    { count: invitedCount },
    { count: paidCount },
    { count: rewardsCount },
  ] = await Promise.all([
    // Total invited users
    admin
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_id", user.id),
    // Users who went on to subscribe (status completed or rewarded)
    admin
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_id", user.id)
      .in("status", ["completed", "rewarded"]),
    // Free months earned
    admin
      .from("referral_rewards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  return NextResponse.json({
    invited_count: invitedCount ?? 0,
    paid_count: paidCount ?? 0,
    rewards_count: rewardsCount ?? 0,
  });
}
