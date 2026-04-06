import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { admin } = auth;
  const body = await req.json();
  const { email, password, role, toolkit_slug } = body as {
    email: string;
    password: string;
    role: string;
    toolkit_slug?: string;
  };

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
  const hasToolkit = toolkit_slug && toolkit_slug !== "free";
  const plan = role === "pro" || role === "admin" || hasToolkit ? "pro" : "free";
  const effectiveRole = hasToolkit && role === "user" ? "pro" : role;

  // upsert instead of insert — handles the case where a public.users row
  // already exists (e.g. from a previous partial creation).
  const { error: dbError } = await admin.from("users").upsert(
    { id: newUser.id, email: newUser.email, role: effectiveRole, plan, usage_count: 0, banned: false },
    { onConflict: "id" }
  );

  if (dbError) {
    // Roll back the auth user so we don't leave an orphan in auth.users
    await admin.auth.admin.deleteUser(newUser.id);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  // Create subscription if a toolkit was selected
  if (hasToolkit) {
    const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const { error: subError } = await admin.from("subscriptions").insert({
      user_id: newUser.id,
      toolkit_slug,
      status: "active",
      stripe_subscription_id: `manual_${newUser.id}`,
      current_period_end: oneYearFromNow,
    });
    if (subError) {
      console.error("[create-user] subscription insert failed:", subError.message);
    }
  }

  return NextResponse.json({
    success: true,
    user: { id: newUser.id, email: newUser.email, role: effectiveRole, plan },
  });
}
