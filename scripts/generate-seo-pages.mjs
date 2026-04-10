/**
 * generate-seo-pages.mjs
 * 为 generators 表中 content IS NULL 的记录生成页面内容
 * 用法: node scripts/generate-seo-pages.mjs
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envContent = readFileSync(resolve(__dirname, "../.env.local"), "utf-8");
const OPENAI_KEY = envContent.match(/OPENAI_API_KEY=(.+)/)?.[1]?.trim();
if (!OPENAI_KEY) throw new Error("OPENAI_API_KEY not found in .env.local");

const SUPABASE_URL = "https://mvgqrgmkyvimsriemwmu.supabase.co";
const SUPABASE_KEY =
  "REDACTED_SERVICE_ROLE_KEY";

const sbHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

const CONCURRENCY = 4;

async function sbGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, { headers: sbHeaders });
  if (!res.ok) throw new Error(`GET ${path}: ${await res.text()}`);
  return res.json();
}

async function sbPatch(table, filter, update) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: "PATCH",
    headers: { ...sbHeaders, Prefer: "return=minimal" },
    body: JSON.stringify(update),
  });
  if (!res.ok) throw new Error(`PATCH ${table}: ${await res.text()}`);
}

async function openaiChat(systemPrompt, userPrompt) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1800,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices[0]?.message?.content ?? "";
}

function buildPrompt(gen) {
  return {
    system: "You are an expert content writer for an AI tools platform. Write clear, helpful, SEO-optimized content in Markdown format.",
    user: `Write comprehensive content for the page titled "${gen.title}".

Include these sections in Markdown:
## What is ${gen.title}?
(2 paragraphs explaining what it does and why it's valuable)

## Key Features
(4 bullet points of main capabilities)

## How to Use ${gen.title}
(3 numbered steps)

## Who Should Use ${gen.title}?
(2 paragraphs describing ideal users and use cases)

## Benefits of Using AI for ${gen.title.replace(/^AI /, "").replace(/ Generator$/, " Generation")}
(4 bullet points of key benefits)

Keywords to naturally include: ${gen.keywords ?? gen.title}
Tone: Professional, helpful, practical
Length: 800-1000 words total
Do NOT add a H1 title at the top.`,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log("\n🚀 Generator SEO content builder\n");

const pending = await sbGet(
  "/generators?select=id,slug,title,keywords&content=is.null&is_active=eq.true&limit=50"
);

if (!pending.length) {
  console.log("✅ All generators already have content. Nothing to do.");
  process.exit(0);
}

console.log(`Found ${pending.length} generators without content\n`);

const results = { ok: 0, fail: 0 };

async function processOne(gen) {
  try {
    const { system, user } = buildPrompt(gen);
    const content = await openaiChat(system, user);
    await sbPatch("generators", `id=eq.${gen.id}`, { content });
    results.ok++;
    console.log(`  ✓ [${results.ok + results.fail}/${pending.length}] ${gen.title}`);
  } catch (err) {
    results.fail++;
    console.error(`  ✗ ${gen.slug}: ${err.message?.slice(0, 80)}`);
  }
}

for (let i = 0; i < pending.length; i += CONCURRENCY) {
  await Promise.allSettled(pending.slice(i, i + CONCURRENCY).map(processOne));
}

console.log(`\n✅ Done — success: ${results.ok}, failed: ${results.fail}`);
