/**
 * generate-use-cases-new.mjs
 * 为每个 generator × 5 persona 组合生成 use_case_pages 记录
 * 用法: node scripts/generate-use-cases-new.mjs
 *
 * 如果只需插入记录（不生成内容）：
 *   node scripts/generate-use-cases-new.mjs --seed-only
 *
 * 生成内容（需要 OpenAI key）：
 *   node scripts/generate-use-cases-new.mjs
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envContent = readFileSync(resolve(__dirname, "../.env.local"), "utf-8");
const OPENAI_KEY = envContent.match(/OPENAI_API_KEY=(.+)/)?.[1]?.trim();

const SUPABASE_URL = "https://mvgqrgmkyvimsriemwmu.supabase.co";
const SUPABASE_KEY =
  "REDACTED_SERVICE_ROLE_KEY";

const sbHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

const SEED_ONLY = process.argv.includes("--seed-only");
const CONCURRENCY = 4;

const PERSONAS = [
  { key: "for-students",       label: "for Students",       display: "Students" },
  { key: "for-professionals",  label: "for Professionals",  display: "Professionals" },
  { key: "for-small-business", label: "for Small Businesses",display: "Small Businesses" },
  { key: "for-job-seekers",    label: "for Job Seekers",    display: "Job Seekers" },
  { key: "for-freelancers",    label: "for Freelancers",    display: "Freelancers" },
];

async function sbGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, { headers: sbHeaders });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function sbUpsert(table, rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...sbHeaders, Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(await res.text());
}

async function sbPatch(table, filter, update) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: "PATCH",
    headers: { ...sbHeaders, Prefer: "return=minimal" },
    body: JSON.stringify(update),
  });
  if (!res.ok) throw new Error(await res.text());
}

async function openaiChat(prompt) {
  if (!OPENAI_KEY) throw new Error("OPENAI_API_KEY not found");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 900,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return JSON.parse(data.choices[0]?.message?.content ?? "{}");
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log("\n🚀 Use Case Pages generator\n");

const generators = await sbGet(
  "/generators?select=slug,title,keywords,meta_description&is_active=eq.true&limit=100"
);

if (!generators.length) {
  console.error("❌ No generators found. Run the SQL seed first.");
  process.exit(1);
}

console.log(`Found ${generators.length} generators × ${PERSONAS.length} personas = ${generators.length * PERSONAS.length} pages\n`);

// Step 1: Seed records (skip duplicates)
const seedRows = [];
for (const gen of generators) {
  for (const persona of PERSONAS) {
    const slug = `${gen.slug}-generator-${persona.key}`;
    const title = `${gen.title} ${persona.label.charAt(0).toUpperCase() + persona.label.slice(1)}`;
    seedRows.push({
      slug,
      generator_slug: gen.slug,
      title,
      persona: persona.display,
      meta_title: `${title} — Free | AI Tools Station`,
      meta_description: `Use ${gen.title} ${persona.label}. ${gen.meta_description ?? gen.title + " tool for " + persona.display + "."}`.slice(0, 160),
      keywords: `${gen.keywords ?? gen.title}, ${persona.display.toLowerCase()}`,
    });
  }
}

// Batch upsert in chunks of 50
for (let i = 0; i < seedRows.length; i += 50) {
  await sbUpsert("use_case_pages", seedRows.slice(i, i + 50));
}
console.log(`✓ Seeded ${seedRows.length} use_case_pages records\n`);

if (SEED_ONLY) {
  console.log("✅ Seed-only mode. Content generation skipped.");
  process.exit(0);
}

// Step 2: Generate content for pages without content
const pending = await sbGet(
  "/use_case_pages?select=id,slug,title,persona,generator_slug&content=is.null&is_active=eq.true&limit=200"
);

console.log(`Generating content for ${pending.length} pages...\n`);

// Fetch generator data for context
const genMap = Object.fromEntries(generators.map((g) => [g.slug, g]));

const results = { ok: 0, fail: 0 };

async function generateContent(page) {
  const gen = genMap[page.generator_slug] ?? {};
  const prompt = `Write SEO content for an AI tool use case page. Return ONLY valid JSON.

Tool: "${gen.title ?? page.generator_slug}"
Use case persona: ${page.persona}
Page title: "${page.title}"

Return JSON:
{
  "content": "3-4 SEO-optimized paragraphs (200-300 words) written in Markdown, explaining why this tool is perfect for ${page.persona}, what they can achieve, and how it saves time"
}`;

  try {
    const result = await openaiChat(prompt);
    await sbPatch("use_case_pages", `id=eq.${page.id}`, { content: result.content ?? "" });
    results.ok++;
    console.log(`  ✓ [${results.ok + results.fail}/${pending.length}] ${page.slug}`);
  } catch (err) {
    results.fail++;
    console.error(`  ✗ ${page.slug}: ${err.message?.slice(0, 80)}`);
  }
}

for (let i = 0; i < pending.length; i += CONCURRENCY) {
  await Promise.allSettled(pending.slice(i, i + CONCURRENCY).map(generateContent));
}

console.log(`\n✅ Done — success: ${results.ok}, failed: ${results.fail}`);
