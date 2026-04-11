/**
 * generate-templates.mjs
 * 为每个 generator 生成 2 个 template_pages 记录（含 template_content）
 * 用法: node scripts/generate-templates.mjs
 *
 * --seed-only  只插入骨架记录，不调用 OpenAI
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envContent = readFileSync(resolve(__dirname, "../.env.local"), "utf-8");
const OPENAI_KEY = envContent.match(/OPENAI_API_KEY=(.+)/)?.[1]?.trim();

const SUPABASE_URL = "https://mvgqrgmkyvimsriemwmu.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12Z3FyZ21reXZpbXNyaWVtd211Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIzMTM3NSwiZXhwIjoyMDkwODA3Mzc1fQ.7pAqglMtNEiS7I2FC74WOaoJ-lxCnG3VOvIi_ntggv8";

const sbHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

const SEED_ONLY = process.argv.includes("--seed-only");
const CONCURRENCY = 3;

// 2 template types per generator
const TEMPLATE_TYPES = [
  {
    suffix: "template",
    label: "Template",
    modifier: "structured, ready-to-fill template with clear sections and placeholders",
  },
  {
    suffix: "example",
    label: "Example",
    modifier: "complete, filled-in example showing what a real output looks like",
  },
];

async function sbGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, { headers: sbHeaders });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function sbUpsert(path, rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
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
      max_tokens: 1400,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return JSON.parse(data.choices[0]?.message?.content ?? "{}");
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log("\n🚀 Template Pages generator\n");

const generators = await sbGet(
  "/generators?select=id,slug,title,keywords,category,meta_description&is_active=eq.true&limit=100"
);

if (!generators.length) {
  console.error("❌ No generators found.");
  process.exit(1);
}

console.log(
  `Found ${generators.length} generators × ${TEMPLATE_TYPES.length} types = ${generators.length * TEMPLATE_TYPES.length} template pages\n`
);

// Step 1: Seed skeleton records
const seedRows = [];
for (const gen of generators) {
  for (const t of TEMPLATE_TYPES) {
    const slug = `${gen.slug}-${t.suffix}`;
    const title =
      t.suffix === "example"
        ? `${gen.title} Example`
        : `Free ${gen.title} Template`;
    seedRows.push({
      slug,
      generator_id: gen.id,
      title,
      meta_title: `${title} — Copy & Use Free | AI Tools Station`,
      meta_description: `Free ${gen.title.toLowerCase()} ${t.suffix}. ${t.modifier.charAt(0).toUpperCase() + t.modifier.slice(1, 60)}. Works with ChatGPT and Claude.`.slice(0, 160),
      keywords: `${gen.keywords ?? gen.title} ${t.suffix}, free ${gen.title.toLowerCase()} ${t.suffix}, ai ${t.suffix}`,
    });
  }
}

for (let i = 0; i < seedRows.length; i += 50) {
  await sbUpsert("template_pages?on_conflict=slug", seedRows.slice(i, i + 50));
}
console.log(`✓ Seeded ${seedRows.length} template_pages records\n`);

if (SEED_ONLY) {
  console.log("✅ Seed-only mode. Content generation skipped.");
  process.exit(0);
}

// Step 2: Generate template_content for pages without content
const pending = await sbGet(
  "/template_pages?select=id,slug,title,generator_id&template_content=is.null&is_active=eq.true&limit=200"
);

console.log(`Generating content for ${pending.length} pages...\n`);

const genMap = Object.fromEntries(generators.map((g) => [g.id, g]));
const results = { ok: 0, fail: 0 };

async function generateTemplate(page) {
  const gen = genMap[page.generator_id] ?? {};
  const isExample = page.slug.endsWith("-example");

  const contentReq = isExample
    ? `Write a complete, realistic example output for an AI ${gen.title?.toLowerCase() ?? "generator"}.

This should look like the ACTUAL OUTPUT the tool produces (not instructions, not a template with placeholders).
Write it as if a professional just used the AI tool and this is the result.

Requirements:
- 200-350 words, realistic and detailed
- Professional quality
- No meta-commentary, just the content itself
- Include concrete names, numbers, and specifics to feel authentic

Return ONLY valid JSON:
{
  "template_content": "the complete example output as Markdown (use headers, bullet points where appropriate)"
}`
    : `Create a structured template for a ${gen.title?.toLowerCase() ?? "document"}.

Requirements:
- Use [PLACEHOLDER] format for variables users fill in
- Include clear section headers
- 200-300 words
- Professional, ready-to-use format
- Each section should have 2-3 sub-items or lines

Return ONLY valid JSON:
{
  "template_content": "the complete template as Markdown with [PLACEHOLDERS] and section headers"
}`;

  try {
    const result = await openaiChat(contentReq);
    await sbPatch("template_pages", `id=eq.${page.id}`, {
      template_content: result.template_content ?? "",
    });
    results.ok++;
    console.log(`  ✓ [${results.ok + results.fail}/${pending.length}] ${page.slug}`);
  } catch (err) {
    results.fail++;
    console.error(`  ✗ ${page.slug}: ${err.message?.slice(0, 80)}`);
  }
}

for (let i = 0; i < pending.length; i += CONCURRENCY) {
  await Promise.allSettled(pending.slice(i, i + CONCURRENCY).map(generateTemplate));
}

console.log(`\n✅ Done — success: ${results.ok}, failed: ${results.fail}`);
