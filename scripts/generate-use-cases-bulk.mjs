/**
 * Bulk use-case page generator
 * Generates {toolSlug}-for-{professionSlug} pages in seo_pages (type=use_case)
 * Usage: node scripts/generate-use-cases-bulk.mjs [target=2000] [concurrency=10]
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://mvgqrgmkyvimsriemwmu.supabase.co";
const SUPABASE_KEY =
  "REDACTED_SERVICE_ROLE_KEY";

// Read OPENAI_API_KEY from .env.local
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
const OPENAI_KEY = envContent.match(/OPENAI_API_KEY=(.+)/)?.[1]?.trim();
if (!OPENAI_KEY) throw new Error("OPENAI_API_KEY not found in .env.local");

const TARGET = parseInt(process.argv[2] ?? "2000");
const CONCURRENCY = parseInt(process.argv[3] ?? "20");

const PROFESSIONS = [
  "software engineer", "data analyst", "product manager",
  "marketing manager", "sales manager", "startup founder",
  "student", "freelancer", "consultant", "teacher",
  "lawyer", "recruiter", "designer", "content creator",
  "youtube creator", "blogger", "podcaster",
  "social media manager", "ecommerce seller",
  "small business owner", "hr manager", "accountant",
  "project manager", "business owner", "copywriter",
  "seo specialist", "developer", "entrepreneur",
  "customer success manager", "finance professional",
];

const sbHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function toProfessionSlug(p) {
  return p.toLowerCase().replace(/\s+/g, "-");
}
function toPageSlug(toolSlug, profSlug) {
  return `${toolSlug}-for-${profSlug}`;
}

async function sbGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, { headers: sbHeaders });
  return res.json();
}

async function sbInsert(table, row) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...sbHeaders, Prefer: "return=minimal" },
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
}

async function openaiChat(messages, maxTokens = 1600) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages,
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return JSON.parse(data.choices[0]?.message?.content ?? "{}");
}

// ── Main ──────────────────────────────────────────────────────────────────────
const startTime = Date.now();
console.log(`\n🚀 Use-case bulk generator — target: ${TARGET} pages, concurrency: ${CONCURRENCY}\n`);

// 1. Load active tools
const tools = await sbGet("/tools?select=slug,name&is_active=eq.true&limit=1000");
console.log(`✓ Loaded ${tools.length} active tools`);

// 2. Load existing slugs
let existingPage = 0;
const existingSet = new Set();
while (true) {
  const batch = await sbGet(
    `/seo_pages?select=slug&type=eq.use_case&limit=1000&offset=${existingPage * 1000}`
  );
  if (!Array.isArray(batch) || batch.length === 0) break;
  batch.forEach((r) => existingSet.add(r.slug));
  if (batch.length < 1000) break;
  existingPage++;
}
console.log(`✓ Existing use_case pages: ${existingSet.size}`);

// 3. Build queue
const queue = [];
for (const tool of tools) {
  for (const profession of PROFESSIONS) {
    const profSlug = toProfessionSlug(profession);
    const slug = toPageSlug(tool.slug, profSlug);
    if (!existingSet.has(slug)) {
      queue.push({ tool, profession, profSlug, slug });
    }
  }
}
queue.sort(() => Math.random() - 0.5);
const workQueue = queue.slice(0, TARGET);
console.log(`✓ Queue built: ${workQueue.length} combinations to generate (capped at ${TARGET})\n`);

// 4. Process with concurrency
let generated = 0;
let skipped = 0;
let inFlight = 0;
const results = { generated: 0, skipped: 0 };

async function generateOne(item) {
  const { tool, profession, profSlug, slug } = item;
  try {
    const parsed = await openaiChat([
      {
        role: "user",
        content: `Write a concise SEO landing page (400-500 words) for:
Tool: ${tool.name} | Target: ${profession}s

Include: intro why ${profession}s need this, 3 key benefits, quick start tips.
Return JSON:
{"title":"${tool.name} for ${profession}s | AI Tools Station","seo_title":"max 60 chars","seo_description":"max 155 chars","content":"markdown 400-500 words"}`,
      },
    ], 900);

    await sbInsert("seo_pages", {
      slug,
      type: "use_case",
      title: parsed.title ?? `${tool.name} for ${profession}s`,
      seo_title: parsed.seo_title ?? `${tool.name} for ${profession}s | AI Tools Station`,
      seo_description:
        parsed.seo_description ??
        `How ${profession}s use ${tool.name} to work smarter and faster.`,
      content: parsed.content ?? "",
      tool_slug: tool.slug,
      meta: { profession: profSlug, tool_name: tool.name },
    });

    results.generated++;
    if (results.generated % 50 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const rate = (results.generated / ((Date.now() - startTime) / 60000)).toFixed(1);
      console.log(
        `  ✓ ${results.generated}/${workQueue.length} generated (${elapsed}s elapsed, ${rate}/min)`
      );
    }
  } catch (err) {
    results.skipped++;
    if (results.skipped <= 5) console.error(`  ✗ skip ${slug}: ${err.message?.slice(0, 80)}`);
  }
}

// Chunked concurrency loop
for (let i = 0; i < workQueue.length; i += CONCURRENCY) {
  const chunk = workQueue.slice(i, i + CONCURRENCY);
  await Promise.allSettled(chunk.map(generateOne));
}

const totalSec = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\n✅ Done in ${totalSec}s — generated: ${results.generated}, skipped: ${results.skipped}`);
console.log(`   Total use_case pages now: ~${existingSet.size + results.generated}`);
