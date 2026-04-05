import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { user_id, banned } = await req.json();
  if (!user_id || banned === undefined) return NextResponse.json({ error: "user_id and banned required" }, { status: 400 });

  const { error } = await auth.admin.from("users").update({ banned: Boolean(banned) }).eq("id", user_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
