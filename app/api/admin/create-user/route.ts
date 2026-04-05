import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { admin } = auth;
  const body = await req.json();
  const { email, password, role } = body as { email: string; password: string; role: string };

  if (!email || !password || !role) {
    return NextResponse.json({ error: "email, password, role are required" }, { status: 400 });
  }

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? "Failed to create user" }, { status: 500 });
  }

  const newUser = authData.user;
  const plan = role === "pro" || role === "admin" ? "pro" : "free";

  // upsert instead of insert — handles the case where a public.users row
  // already exists (e.g. from a previous partial creation).
  const { error: dbError } = await admin.from("users").upsert(
    { id: newUser.id, email: newUser.email, role, plan, usage_count: 0, banned: false },
    { onConflict: "id" }
  );

  if (dbError) {
    // Roll back the auth user so we don't leave an orphan in auth.users
    await admin.auth.admin.deleteUser(newUser.id);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, user: { id: newUser.id, email: newUser.email, role, plan } });
}
