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

  // Delete related data first (FK-safe order), then auth.users last.
  // Tables that may not exist are handled silently.
  const steps: Array<{ table: string; column: string }> = [
    { table: "subscriptions",      column: "user_id" },
    { table: "referrals",          column: "referrer_id" },
    { table: "referrals",          column: "referred_user_id" },
    { table: "referral_rewards",   column: "user_id" },
    { table: "usage_logs",         column: "user_id" },
    { table: "analytics_events",   column: "user_id" },
    { table: "leads",              column: "user_id" },
    { table: "affiliate_commissions", column: "user_id" },
    { table: "feature_votes",      column: "user_id" },
    { table: "usage_events",       column: "user_id" },
    { table: "generated_examples", column: "user_id" },
  ];

  const errors: string[] = [];

  for (const { table, column } of steps) {
    const { error } = await admin.from(table).delete().eq(column, user_id);
    // Ignore "table not found" errors (42P01) — table may not exist in this deployment
    if (error && !error.message.includes("does not exist") && error.code !== "42P01") {
      errors.push(`${table}.${column}: ${error.message}`);
    }
  }

  // Delete public.users
  const { error: pubError } = await admin.from("users").delete().eq("id", user_id);
  if (pubError) errors.push(`users: ${pubError.message}`);

  // Delete auth.users last — this is the authoritative step
  const { error: authError } = await admin.auth.admin.deleteUser(user_id);
  if (authError) {
    return NextResponse.json(
      { error: authError.message, partial_errors: errors },
      { status: 500 }
    );
  }

  if (errors.length > 0) {
    // Auth user deleted successfully but some related rows had errors — log and continue
    console.warn("[delete-user] partial errors:", errors);
  }

  return NextResponse.json({ success: true });
}
