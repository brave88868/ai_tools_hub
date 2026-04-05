import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

/**
 * 统一 Bearer token 权限校验（admin 路由专用）
 * 用法：
 *   const auth = await requireAdmin(req);
 *   if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 *   const { user, admin } = auth;
 */
export async function requireAdmin(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token) return null;

  const admin = createAdminClient();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return null;

  const { data: rec } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (rec?.role !== "admin") return null;
  return { user, admin };
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
