import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { user: adminUser, admin } = auth;
  const body = await req.json();
  const { user_id } = body as { user_id: string };

  if (!user_id) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }

  if (user_id === adminUser.id) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  const { error: authError } = await admin.auth.admin.deleteUser(user_id);
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  await admin.from("users").delete().eq("id", user_id);

  return NextResponse.json({ success: true });
}
