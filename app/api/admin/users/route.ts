import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";

// GET /api/admin/users — 返回所有用户列表
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { data: users, count } = await auth.admin
    .from("users")
    .select("id, email, role, plan, usage_count, banned, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(200);

  return NextResponse.json({ users: users ?? [], total: count ?? 0 });
}
