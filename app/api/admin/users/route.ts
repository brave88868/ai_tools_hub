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
    .select("user_id, toolkit_slug")
    .in("user_id", userIds)
    .in("status", ["active", "canceling"]);

  // Group toolkit slugs by user_id
  const toolkitsByUser: Record<string, string[]> = {};
  for (const sub of subs ?? []) {
    if (!toolkitsByUser[sub.user_id]) toolkitsByUser[sub.user_id] = [];
    toolkitsByUser[sub.user_id].push(sub.toolkit_slug);
  }

  const enriched = users.map((u) => ({
    ...u,
    toolkits: toolkitsByUser[u.id] ?? [],
  }));

  return NextResponse.json({ users: enriched, total: count ?? 0 });
}
