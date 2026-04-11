/**
 * daily-seo-pipeline.mjs
 * 每日 SEO 自动化流水线编排脚本
 * 用法: node scripts/daily-seo-pipeline.mjs
 *
 * 步骤:
 *  1. 为 seo_comparisons 中无内容的记录生成内容
 *  2. 为 seo_alternatives 中无内容的记录生成内容
 *  3. 为 template_pages 中无内容的记录生成内容
 *  4. Ping sitemap
 *
 * 每步独立 try-catch，单步失败不影响后续步骤
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

const CONCURRENCY = 3;
const BATCH_LIMIT = 10; // per pipeline run per table

async function sbGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, { headers: sbHeaders });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function sbPatch(table, filter, update) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: "PATCH",
    headers: { ...sbHeaders, Prefer: "return=minimal" },
    body: JSON.stringify(update),
  });
  if (!res.ok) throw new Error(await res.text());
}

async function openaiChat(prompt, maxTokens = 1200) {
  if (!OPENAI_KEY) throw new Error("OPENAI_API_KEY not found");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return JSON.parse(data.choices[0]?.message?.content ?? "{}");
}

// ─── Step 1: Fill seo_comparisons content ─────────────────────────────────────
async function fillComparisons() {
  console.log("\n📊 Step 1: Filling seo_comparisons content...");
  const rows = await sbGet(
    `/seo_comparisons?select=id,slug,tool_a,tool_b&content=is.null&limit=${BATCH_LIMIT}`
  );
  console.log(`  ${rows.length} comparison(s) need content`);
  if (!rows.length) return;

  const results = { ok: 0, fail: 0 };

  async function process(row) {
    const prompt = `Write a detailed, SEO-optimized comparison article for: "${row.tool_a}" vs "${row.tool_b}".

Return ONLY valid JSON:
{
  "content": "800-1000 word Markdown article comparing the two tools. Include: intro paragraph, feature comparison table (use Markdown table syntax), pros/cons for each, pricing comparison, who each is best for, and a conclusion with recommendation."
}`;
    try {
      const result = await openaiChat(prompt, 1600);
      await sbPatch("seo_comparisons", `id=eq.${row.id}`, { content: result.content ?? "" });
      results.ok++;
      console.log(`    ✓ ${row.slug}`);
    } catch (err) {
      results.fail++;
      console.error(`    ✗ ${row.slug}: ${err.message?.slice(0, 80)}`);
    }
  }

  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    await Promise.allSettled(rows.slice(i, i + CONCURRENCY).map(process));
  }
  console.log(`  Done — ok: ${results.ok}, fail: ${results.fail}`);
}

// ─── Step 2: Fill seo_alternatives content ────────────────────────────────────
async function fillAlternatives() {
  console.log("\n🔄 Step 2: Filling seo_alternatives content...");
  const rows = await sbGet(
    `/seo_alternatives?select=id,slug,tool_name&content=is.null&limit=${BATCH_LIMIT}`
  );
  console.log(`  ${rows.length} alternative page(s) need content`);
  if (!rows.length) return;

  const results = { ok: 0, fail: 0 };

  async function process(row) {
    const prompt = `Write a detailed, SEO-optimized article listing the best alternatives to "${row.tool_name}".

Return ONLY valid JSON:
{
  "content": "700-900 word Markdown article. Include: brief intro about the tool and why people look for alternatives, a list of 5-7 alternatives (each with a short paragraph describing their strengths), a comparison table with tool/best-for/price columns, and a conclusion recommending the best alternative for different use cases. Mention AI Tools Station as one of the alternatives."
}`;
    try {
      const result = await openaiChat(prompt, 1600);
      await sbPatch("seo_alternatives", `id=eq.${row.id}`, { content: result.content ?? "" });
      results.ok++;
      console.log(`    ✓ ${row.slug}`);
    } catch (err) {
      results.fail++;
      console.error(`    ✗ ${row.slug}: ${err.message?.slice(0, 80)}`);
    }
  }

  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    await Promise.allSettled(rows.slice(i, i + CONCURRENCY).map(process));
  }
  console.log(`  Done — ok: ${results.ok}, fail: ${results.fail}`);
}

// ─── Step 3: Fill template_pages content ──────────────────────────────────────
async function fillTemplates() {
  console.log("\n📄 Step 3: Filling template_pages content...");
  const rows = await sbGet(
    `/template_pages?select=id,slug,title,generator_id&template_content=is.null&is_active=eq.true&limit=${BATCH_LIMIT}`
  );
  console.log(`  ${rows.length} template page(s) need content`);
  if (!rows.length) return;

  // Fetch generator titles for context
  const genIds = [...new Set(rows.map((r) => r.generator_id).filter(Boolean))];
  let genMap = {};
  if (genIds.length) {
    const gens = await sbGet(
      `/generators?select=id,title&id=in.(${genIds.join(",")})&limit=100`
    );
    genMap = Object.fromEntries(gens.map((g) => [g.id, g]));
  }

  const results = { ok: 0, fail: 0 };

  async function process(row) {
    const gen = genMap[row.generator_id] ?? {};
    const isExample = row.slug.endsWith("-example");
    const toolName = gen.title ?? row.title;

    const prompt = isExample
      ? `Write a complete, realistic example output for an AI ${toolName.toLowerCase()}.

Write it as actual content the AI would produce — not a template, not instructions. Use concrete details, names, numbers.

Return ONLY valid JSON:
{
  "template_content": "200-300 word example output as Markdown (use appropriate headers/bullets)"
}`
      : `Create a structured, professional template for a ${toolName.toLowerCase()}.

Use [PLACEHOLDER] format for variables. Include section headers and sub-items.

Return ONLY valid JSON:
{
  "template_content": "200-300 word template as Markdown with [PLACEHOLDERS] and clear section structure"
}`;

    try {
      const result = await openaiChat(prompt, 800);
      await sbPatch("template_pages", `id=eq.${row.id}`, {
        template_content: result.template_content ?? "",
      });
      results.ok++;
      console.log(`    ✓ ${row.slug}`);
    } catch (err) {
      results.fail++;
      console.error(`    ✗ ${row.slug}: ${err.message?.slice(0, 80)}`);
    }
  }

  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    await Promise.allSettled(rows.slice(i, i + CONCURRENCY).map(process));
  }
  console.log(`  Done — ok: ${results.ok}, fail: ${results.fail}`);
}

// ─── Step 4: Ping sitemap ─────────────────────────────────────────────────────
async function pingSitemap() {
  console.log("\n📡 Step 4: Pinging sitemap...");
  try {
    const res = await fetch(
      "https://www.aitoolsstation.com/api/seo/ping",
      { method: "GET", signal: AbortSignal.timeout(15000) }
    );
    console.log(`  Sitemap ping → ${res.status}`);
  } catch (err) {
    console.error(`  Ping failed: ${err.message}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
console.log("🚀 Daily SEO Pipeline\n");
const start = Date.now();

try { await fillComparisons(); } catch (e) { console.error("Step 1 error:", e.message); }
try { await fillAlternatives(); } catch (e) { console.error("Step 2 error:", e.message); }
try { await fillTemplates(); } catch (e) { console.error("Step 3 error:", e.message); }
try { await pingSitemap(); } catch (e) { console.error("Step 4 error:", e.message); }

const elapsed = ((Date.now() - start) / 1000).toFixed(1);
console.log(`\n✅ Pipeline complete in ${elapsed}s`);
