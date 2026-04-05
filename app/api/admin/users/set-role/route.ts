import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { user_id, role } = await req.json();
  if (!user_id || !role) return NextResponse.json({ error: "user_id and role required" }, { status: 400 });
  if (!["user", "pro", "admin"].includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  // Sync plan alongside role: pro→plan='pro', user→plan='free', admin→plan unchanged
  const updates: Record<string, string> = { role };
  if (role === "pro") updates.plan = "pro";
  if (role === "user") updates.plan = "free";

  const { error } = await auth.admin.from("users").update(updates).eq("id", user_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
