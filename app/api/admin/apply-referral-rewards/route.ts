import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

/**
 * POST /api/admin/apply-referral-rewards
 * Auth: Bearer CRON_SECRET (used by cron) OR admin Bearer token
 *
 * Processes pending referral_rewards where reward_type = 'free_month_bundle'
 * and applied = false (or applied is null).
 *
 * For each pending reward, creates/extends a 'bundle' subscription in Supabase
 * (status = active, expires_at = now + 30 days) so the user gets free Pro access.
 *
 * NOTE: applied_at column needs to be added to referral_rewards via Supabase SQL:
 *   ALTER TABLE referral_rewards ADD COLUMN IF NOT EXISTS applied_at timestamptz;
 */
export async function POST(req: NextRequest) {
  // Accept either CRON_SECRET or admin bearer token
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();

  const isCron = token === process.env.CRON_SECRET;

  if (!isCron) {
    // Validate as admin
    const admin = createAdminClient();
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: rec } = await admin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    if (rec?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();

  // Fetch all unapplied free_month_bundle rewards
  const { data: pendingRewards, error: fetchError } = await admin
    .from("referral_rewards")
    .select("id, user_id, reward_type, milestone")
    .eq("reward_type", "free_month_bundle")
    .eq("applied", false);

  if (fetchError) {
    console.error("[apply-referral-rewards] fetch error:", fetchError);
    return NextResponse.json({ error: "Failed to fetch pending rewards" }, { status: 500 });
  }

  if (!pendingRewards?.length) {
    return NextResponse.json({ success: true, processed: 0, message: "No pending rewards" });
  }

  let processed = 0;
  let errors = 0;
  const results: { user_id: string; status: string; detail?: string }[] = [];

  for (const reward of pendingRewards) {
    try {
      const userId = reward.user_id;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days

      // Check if user already has an active bundle subscription
      const { data: existingSub } = await admin
        .from("subscriptions")
        .select("id, status, expires_at")
        .eq("user_id", userId)
        .eq("toolkit_slug", "bundle")
        .maybeSingle();

      if (existingSub) {
        // Extend existing subscription
        const currentExpiry = existingSub.expires_at
          ? new Date(existingSub.expires_at)
          : now;
        // Extend from the later of now or current expiry
        const extendFrom = currentExpiry > now ? currentExpiry : now;
        const newExpiry = new Date(extendFrom.getTime() + 30 * 24 * 60 * 60 * 1000);

        await admin
          .from("subscriptions")
          .update({
            status: "active",
            expires_at: newExpiry.toISOString(),
          })
          .eq("id", existingSub.id);

        results.push({ user_id: userId, status: "extended", detail: `expires ${newExpiry.toISOString()}` });
      } else {
        // Create new bundle subscription
        await admin.from("subscriptions").insert({
          user_id: userId,
          toolkit_slug: "bundle",
          status: "active",
          stripe_subscription_id: `referral_reward_${reward.id}`,
          expires_at: expiresAt.toISOString(),
        });

        results.push({ user_id: userId, status: "created", detail: `expires ${expiresAt.toISOString()}` });
      }

      // Mark reward as applied
      const updatePayload: Record<string, unknown> = { applied: true };
      // applied_at is optional — column may not exist yet
      try {
        const { error: applyErr } = await admin
          .from("referral_rewards")
          .update({ ...updatePayload, applied_at: now.toISOString() })
          .eq("id", reward.id);

        if (applyErr?.message?.includes("applied_at")) {
          // Column doesn't exist, update without it
          await admin
            .from("referral_rewards")
            .update(updatePayload)
            .eq("id", reward.id);
        }
      } catch {
        // Fallback without applied_at
        await admin
          .from("referral_rewards")
          .update(updatePayload)
          .eq("id", reward.id);
      }

      // Also sync users.plan to 'pro' so tool access is granted immediately
      await admin
        .from("users")
        .update({ plan: "pro" })
        .eq("id", userId);

      processed++;
    } catch (err) {
      console.error(`[apply-referral-rewards] error for user ${reward.user_id}:`, err);
      results.push({ user_id: reward.user_id, status: "error", detail: (err as Error).message });
      errors++;
    }
  }

  return NextResponse.json({
    success: true,
    processed,
    errors,
    total_pending: pendingRewards.length,
    results,
  });
}
