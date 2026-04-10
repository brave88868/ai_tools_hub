/**
 * generate-prompts.mjs
 * 为每个 generator 生成 3 个 prompt_pages 记录（含 prompt_text + example_output）
 * 用法: node scripts/generate-prompts.mjs
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
  "REDACTED_SERVICE_ROLE_KEY";

const sbHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

const SEED_ONLY = process.argv.includes("--seed-only");
const CONCURRENCY = 3;

// 3 prompt variants per generator
const VARIANTS = [
  { suffix: "basic",    label: "Basic",    modifier: "basic, beginner-friendly" },
  { suffix: "advanced", label: "Advanced", modifier: "detailed, professional-level" },
  { suffix: "quick",    label: "Quick",    modifier: "concise, under 50 words input" },
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
      temperature: 0.75,
      max_tokens: 1200,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return JSON.parse(data.choices[0]?.message?.content ?? "{}");
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log("\n🚀 Prompt Pages generator\n");

const generators = await sbGet(
  "/generators?select=id,slug,title,keywords,category&is_active=eq.true&limit=100"
);

if (!generators.length) {
  console.error("❌ No generators found.");
  process.exit(1);
}

console.log(`Found ${generators.length} generators × ${VARIANTS.length} variants = ${generators.length * VARIANTS.length} prompt pages\n`);

// Step 1: Seed skeleton records
const seedRows = [];
for (const gen of generators) {
  for (const v of VARIANTS) {
    const slug = `${gen.slug}-${v.suffix}-prompt`;
    const title = `${v.label} ${gen.title} Prompt`;
    seedRows.push({
      slug,
      generator_id: gen.id,
      title,
      meta_title: `${title} — Copy & Use Free | AI Tools Station`,
      meta_description: `Copy this ${v.modifier} prompt for ${gen.title.toLowerCase()}. Works with ChatGPT and Claude. Free.`.slice(0, 160),
      keywords: `${gen.keywords ?? gen.title} prompt, chatgpt prompt, ${gen.category} ai prompt`,
    });
  }
}

for (let i = 0; i < seedRows.length; i += 50) {
  await sbUpsert("prompt_pages?on_conflict=slug", seedRows.slice(i, i + 50));
}
console.log(`✓ Seeded ${seedRows.length} prompt_pages records\n`);

if (SEED_ONLY) {
  console.log("✅ Seed-only mode. Content generation skipped.");
  process.exit(0);
}

// Step 2: Generate prompt_text + example_output for pages without content
const pending = await sbGet(
  "/prompt_pages?select=id,slug,title,generator_id&prompt_text=is.null&is_active=eq.true&limit=200"
);

console.log(`Generating prompts for ${pending.length} pages...\n`);

const genMap = Object.fromEntries(generators.map((g) => [g.id, g]));

const results = { ok: 0, fail: 0 };

async function generatePrompt(page) {
  const gen = genMap[page.generator_id] ?? {};
  const isAdvanced = page.slug.includes("-advanced-");
  const isQuick = page.slug.includes("-quick-");

  const lengthHint = isAdvanced
    ? "detailed, 150-200 word prompt with multiple parameters"
    : isQuick
    ? "concise, 40-70 word prompt, minimal input required"
    : "clear, 80-120 word prompt with key placeholders";

  const promptReq = `Create a ${lengthHint} for generating a ${gen.title?.replace(/^AI /, "")?.toLowerCase()}.

The prompt should:
- Be ready to copy-paste into ChatGPT or Claude
- Use [PLACEHOLDER] format for variables the user fills in
- Produce professional-quality output
- Be practical and specific

Return ONLY valid JSON:
{
  "prompt_text": "the complete prompt text with [PLACEHOLDERS]",
  "example_output": "a realistic 100-150 word example of what the AI would produce (write as if it's the actual output)"
}`;

  try {
    const result = await openaiChat(promptReq);
    await sbPatch("prompt_pages", `id=eq.${page.id}`, {
      prompt_text: result.prompt_text ?? "",
      example_output: result.example_output ?? "",
    });
    results.ok++;
    console.log(`  ✓ [${results.ok + results.fail}/${pending.length}] ${page.slug}`);
  } catch (err) {
    results.fail++;
    console.error(`  ✗ ${page.slug}: ${err.message?.slice(0, 80)}`);
  }
}

for (let i = 0; i < pending.length; i += CONCURRENCY) {
  await Promise.allSettled(pending.slice(i, i + CONCURRENCY).map(generatePrompt));
}

console.log(`\n✅ Done — success: ${results.ok}, failed: ${results.fail}`);
