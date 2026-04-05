import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { toolkit_id, is_active } = await req.json();
  if (!toolkit_id || is_active === undefined) {
    return NextResponse.json({ error: "toolkit_id and is_active required" }, { status: 400 });
  }

  const { error } = await auth.admin.from("toolkits").update({ is_active: Boolean(is_active) }).eq("id", toolkit_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
