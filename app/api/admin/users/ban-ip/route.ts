import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";

// POST — 封禁 IP
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { ip, reason } = await req.json();
  if (!ip) return NextResponse.json({ error: "ip required" }, { status: 400 });

  const { error } = await auth.admin.from("banned_ips").insert({
    ip: ip.trim(),
    reason: reason ?? null,
  });

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "IP already banned" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE — 解除封禁
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { ip } = await req.json();
  if (!ip) return NextResponse.json({ error: "ip required" }, { status: 400 });

  await auth.admin.from("banned_ips").delete().eq("ip", ip.trim());
  return NextResponse.json({ success: true });
}

// GET — 获取封禁列表
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { data } = await auth.admin
    .from("banned_ips")
    .select("id, ip, reason, created_at")
    .order("created_at", { ascending: false });

  return NextResponse.json({ banned_ips: data ?? [] });
}
