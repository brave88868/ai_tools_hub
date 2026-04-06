/**
 * scripts/sync-subscription-dates.mjs
 *
 * 从 Stripe 同步 current_period_end 到 subscriptions 表。
 * 修复 current_period_end 为 null 或 epoch (1970) 的记录。
 *
 * 用法：node scripts/sync-subscription-dates.mjs
 */

import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf-8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const stripe = new Stripe(env.STRIPE_SECRET_KEY);

function isEpochOrNull(iso) {
  if (!iso) return true;
  const d = new Date(iso);
  return isNaN(d.getTime()) || d.getFullYear() < 2000;
}

async function main() {
  console.log("🔄 Syncing subscription dates from Stripe...\n");

  const { data: subs, error } = await supabase
    .from("subscriptions")
    .select("id, stripe_subscription_id, current_period_end, status, toolkit_slug")
    .in("status", ["active", "canceling"]);

  if (error) { console.error("❌ DB query failed:", error.message); process.exit(1); }
  if (!subs?.length) { console.log("No active/canceling subscriptions found."); return; }

  console.log(`Found ${subs.length} subscription(s) to check.\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const sub of subs) {
    const needsSync = isEpochOrNull(sub.current_period_end);
    const label = `[${sub.toolkit_slug}] ${sub.stripe_subscription_id}`;

    if (!needsSync) {
      console.log(`  ✓  ${label} — already has valid date: ${sub.current_period_end}`);
      skipped++;
      continue;
    }

    if (!sub.stripe_subscription_id) {
      console.warn(`  ⚠️  ${label} — no stripe_subscription_id, skipping`);
      failed++;
      continue;
    }

    try {
      const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
      const periodEndTs = stripeSub.current_period_end;
      const periodEnd = periodEndTs && periodEndTs > 0
        ? new Date(periodEndTs * 1000).toISOString()
        : null;

      if (!periodEnd) {
        console.warn(`  ⚠️  ${label} — Stripe returned no valid period_end`);
        failed++;
        continue;
      }

      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({ current_period_end: periodEnd })
        .eq("id", sub.id);

      if (updateError) {
        console.error(`  ❌ ${label} — DB update failed: ${updateError.message}`);
        failed++;
      } else {
        console.log(`  ✅ ${label} — updated to ${periodEnd}`);
        updated++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Subscription may have been deleted in Stripe
      console.error(`  ❌ ${label} — Stripe error: ${msg}`);
      failed++;
    }
  }

  console.log(`\n📊 Done: ${updated} updated, ${skipped} already OK, ${failed} failed`);
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
