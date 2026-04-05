import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { admin } = auth;
  const body = await req.json();
  const { user_id, plan } = body as { user_id: string; plan: "free" | "pro" };

  if (!user_id || !plan) {
    return NextResponse.json({ error: "user_id and plan are required" }, { status: 400 });
  }

  if (plan !== "free" && plan !== "pro") {
    return NextResponse.json({ error: "plan must be free or pro" }, { status: 400 });
  }

  const { error } = await admin.from("users").update({ plan }).eq("id", user_id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
