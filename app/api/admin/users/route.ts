import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";

// GET /api/admin/users — 返回所有用户列表（含 toolkit 订阅）
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { data: users, count } = await auth.admin
    .from("users")
    .select("id, email, role, plan, usage_count, banned, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(200);

  if (!users || users.length === 0) {
    return NextResponse.json({ users: [], total: 0 });
  }

  // Fetch active/canceling subscriptions for these users in one query
  const userIds = users.map((u) => u.id);
  const { data: subs } = await auth.admin
    .from("subscriptions")
    .select("user_id, toolkit_slug, status, current_period_end")
    .in("user_id", userIds)
    .in("status", ["active", "canceling"]);

  // Group by user_id
  const toolkitsByUser: Record<string, string[]> = {};
  const subsByUser: Record<string, { status: string; current_period_end: string | null }[]> = {};

  for (const sub of subs ?? []) {
    if (!toolkitsByUser[sub.user_id]) toolkitsByUser[sub.user_id] = [];
    toolkitsByUser[sub.user_id].push(sub.toolkit_slug);

    if (!subsByUser[sub.user_id]) subsByUser[sub.user_id] = [];
    subsByUser[sub.user_id].push({ status: sub.status, current_period_end: sub.current_period_end });
  }

  // Derive expiry per user:
  // - any active sub  → 'continuing'
  // - only canceling  → latest current_period_end ISO string
  // - none            → null
  function deriveExpiry(userSubs: { status: string; current_period_end: string | null }[]): string | null {
    if (!userSubs || userSubs.length === 0) return null;
    if (userSubs.some((s) => s.status === "active")) return "continuing";
    // All canceling — pick the latest period end
    const ends = userSubs
      .map((s) => s.current_period_end)
      .filter((e): e is string => !!e)
      .sort()
      .reverse();
    return ends[0] ?? null;
  }

  const enriched = users.map((u) => ({
    ...u,
    toolkits: toolkitsByUser[u.id] ?? [],
    expiry: deriveExpiry(subsByUser[u.id] ?? []),
  }));

  return NextResponse.json({ users: enriched, total: count ?? 0 });
}
