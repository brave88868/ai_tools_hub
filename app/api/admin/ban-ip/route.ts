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

// GET /api/admin/ban-ip — 返回所有封禁的 IP
export async function GET() {
  const ctx = await requireAdmin();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await ctx.admin
    .from("banned_ips")
    .select("id, ip, reason, created_at")
    .order("created_at", { ascending: false });

  return NextResponse.json({ banned_ips: data ?? [] });
}

// POST /api/admin/ban-ip — 封禁一个 IP
export async function POST(req: NextRequest) {
  const ctx = await requireAdmin();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ip, reason } = await req.json();
  if (!ip) return NextResponse.json({ error: "ip required" }, { status: 400 });

  const { error } = await ctx.admin.from("banned_ips").insert({
    ip: ip.trim(),
    reason: reason ?? null,
    banned_by: ctx.user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "IP already banned" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/admin/ban-ip — 解除封禁
export async function DELETE(req: NextRequest) {
  const ctx = await requireAdmin();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ip } = await req.json();
  if (!ip) return NextResponse.json({ error: "ip required" }, { status: 400 });

  await ctx.admin.from("banned_ips").delete().eq("ip", ip.trim());
  return NextResponse.json({ success: true });
}
