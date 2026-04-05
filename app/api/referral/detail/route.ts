import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [
    { count: inviteCount },
    { data: rewards },
    { data: invites },
    { data: userRecord },
  ] = await Promise.all([
    admin
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_id", user.id),
    admin
      .from("referral_rewards")
      .select("uses_granted, type, milestone, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    admin
      .from("referrals")
      .select("created_at")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("users")
      .select("bonus_uses")
      .eq("id", user.id)
      .single(),
  ]);

  const totalUsesGranted = (rewards ?? []).reduce(
    (sum: number, r: { uses_granted: number }) => sum + (r.uses_granted ?? 0),
    0
  );

  return NextResponse.json({
    invite_count: inviteCount ?? 0,
    total_uses_granted: totalUsesGranted,
    bonus_uses: userRecord?.bonus_uses ?? 0,
    rewards: rewards ?? [],
    invites: invites ?? [],
  });
}
