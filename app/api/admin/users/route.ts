import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase-server";

async function requireAdmin() {
  const serverSupabase = await createServerClient();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: userRecord } = await admin.from("users").select("role").eq("id", user.id).single();
  if (userRecord?.role !== "admin") return null;
  return { user, admin };
}

// GET /api/admin/users — 返回所有用户列表
export async function GET(req: NextRequest) {
  const ctx = await requireAdmin();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { admin } = ctx;
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 50;
  const offset = (page - 1) * limit;

  const { data: users, count } = await admin
    .from("users")
    .select("id, email, role, plan, usage_count, banned, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return NextResponse.json({ users: users ?? [], total: count ?? 0 });
}

// PATCH /api/admin/users — 修改 role 或 banned 状态
export async function PATCH(req: NextRequest) {
  const ctx = await requireAdmin();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { admin } = ctx;
  const body = await req.json();
  const { user_id, role, banned } = body;

  if (!user_id) return NextResponse.json({ error: "user_id required" }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (role !== undefined) update.role = role;
  if (banned !== undefined) update.banned = banned;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await admin.from("users").update(update).eq("id", user_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
