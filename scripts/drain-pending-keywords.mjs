#!/usr/bin/env node
/**
 * One-time script to drain pending seo_keywords backlog.
 * Calls production generate-blog endpoint with 15s delay between requests.
 */
import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf-8");
env.split("\n").forEach((l) => {
  const i = l.indexOf("=");
  if (i > 0) process.env[l.slice(0, i).trim()] = l.slice(i + 1).trim();
});

const BASE_URL = "https://www.aitoolsstation.com";
const CRON_SECRET = process.env.CRON_SECRET;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!CRON_SECRET || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing env vars: CRON_SECRET, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

async function getPendingCount() {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/seo_keywords?select=id&status=eq.pending`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "count=exact",
    },
  });
  const range = r.headers.get("content-range") ?? "0/0";
  return parseInt(range.split("/")[1], 10) || 0;
}

async function triggerGenerate() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  const start = Date.now();
  try {
    const r = await fetch(`${BASE_URL}/api/cron/generate-blog`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const text = await r.text();
    return { status: r.status, elapsed, body: text.slice(0, 150) };
  } catch (err) {
    clearTimeout(timeout);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    return { status: 0, elapsed, body: String(err).slice(0, 150) };
  }
}

(async () => {
  const initial = await getPendingCount();
  console.log(`Starting: ${initial} pending keywords\n`);

  let successes = 0;
  let failures = 0;

  for (let i = 0; i < initial + 5; i++) {
    const result = await triggerGenerate();
    const current = await getPendingCount();
    const flag = result.status === 200 ? "✓" : "✗";
    console.log(`[${i + 1}] ${flag} status=${result.status} time=${result.elapsed}s remaining=${current}`);

    if (result.status === 200) successes++;
    else {
      failures++;
      console.log(`    body: ${result.body}`);
    }

    if (current === 0) {
      console.log("\nAll drained!");
      break;
    }

    if (failures >= 5 && successes === 0) {
      console.log("\nStopping — too many failures without success.");
      break;
    }

    await new Promise((r) => setTimeout(r, 15000));
  }

  const final = await getPendingCount();
  console.log(`\n=== Summary ===`);
  console.log(`Started:   ${initial}`);
  console.log(`Ended:     ${final}`);
  console.log(`Processed: ${initial - final}`);
  console.log(`Successes: ${successes}`);
  console.log(`Failures:  ${failures}`);
})();
