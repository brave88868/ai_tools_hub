import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase-server";

export async function DELETE(req: NextRequest) {
  // Verify the caller is the authenticated user (cookie or Bearer token)
  let userId: string | null = null;

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const admin = createAdminClient();

  if (token) {
    const { data } = await admin.auth.getUser(token);
    userId = data.user?.id ?? null;
  } else {
    const serverClient = await createServerClient();
    const { data } = await serverClient.auth.getUser();
    userId = data.user?.id ?? null;
  }

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Fetch email for orphan cleanup after deletion
  const { data: authUserData } = await admin.auth.admin.getUserById(userId);
  const userEmail = authUserData?.user?.email;

  // Delete all related data first (FK-safe order)
  const steps: Array<{ table: string; column: string }> = [
    { table: "subscriptions",         column: "user_id" },
    { table: "referrals",             column: "referrer_id" },
    { table: "referrals",             column: "referred_user_id" },
    { table: "referral_rewards",      column: "user_id" },
    { table: "usage_logs",            column: "user_id" },
    { table: "analytics_events",      column: "user_id" },
    { table: "leads",                 column: "user_id" },
    { table: "affiliate_commissions", column: "user_id" },
    { table: "feature_votes",         column: "user_id" },
    { table: "usage_events",          column: "user_id" },
    { table: "generated_examples",    column: "user_id" },
  ];

  for (const { table, column } of steps) {
    const { error } = await admin.from(table).delete().eq(column, userId);
    if (error && error.code !== "42P01" && !error.message.includes("does not exist")) {
      console.warn(`[delete-account] ${table}.${column}:`, error.message);
    }
  }

  // Delete public.users
  await admin.from("users").delete().eq("id", userId);

  // Delete auth.users — this also fires the on_auth_user_deleted trigger as backup
  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  // Extra safety: remove any orphaned public.users row matched by email
  if (userEmail) {
    await admin.from("users").delete().eq("email", userEmail);
  }

  return NextResponse.json({ success: true });
}
