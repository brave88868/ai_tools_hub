/**
 * generate-use-cases-missing.mjs
 *
 * 为没有 use-case 记录的工具各生成 3 个 use-case 页面。
 * 写入 seo_pages 表（type='use_case', tool_slug, slug={toolSlug}-for-{professionSlug}）
 *
 * Usage: node scripts/generate-use-cases-missing.mjs
 */

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "../.env.local") });

const CONCURRENCY = 5;
const PROFESSIONS_PER_TOOL = 3;
const TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3_000;

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

function toProfessionSlug(profession) {
  return profession.toLowerCase().replace(/\s+/g, "-");
}

function toPageSlug(toolSlug, professionSlug) {
  return `${toolSlug}-for-${professionSlug}`;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Step 1: 查询没有 use-case 的工具 ──────────────────────────────────────
console.log("🔍 查询缺少 use-case 的工具...");

const { data: allTools } = await admin
  .from("tools")
  .select("slug, name")
  .eq("is_active", true)
  .order("slug");

const { data: covered } = await admin
  .from("seo_pages")
  .select("tool_slug")
  .eq("type", "use_case")
  .not("tool_slug", "is", null);

const coveredSet = new Set((covered ?? []).map((r) => r.tool_slug));
const missingTools = (allTools ?? []).filter((t) => !coveredSet.has(t.slug));

console.log(`✅ Active 工具总数: ${allTools?.length}`);
console.log(`✅ 已有 use-case 工具数: ${coveredSet.size}`);
console.log(`⚠️  缺少 use-case 工具数: ${missingTools.length}`);
console.log(`📋 预计生成: ${missingTools.length * PROFESSIONS_PER_TOOL} 条\n`);

if (missingTools.length === 0) {
  console.log("🎉 所有工具已有 use-case，无需生成。");
  process.exit(0);
}

// ── Step 2: 构建生成队列 ────────────────────────────────────────────────────
const { data: existingSlugs } = await admin
  .from("seo_pages")
  .select("slug")
  .eq("type", "use_case");
const existingSet = new Set((existingSlugs ?? []).map((r) => r.slug));

const queue = [];
for (const tool of missingTools) {
  const picked = shuffle(PROFESSIONS).slice(0, PROFESSIONS_PER_TOOL);
  for (const profession of picked) {
    const profSlug = toProfessionSlug(profession);
    const slug = toPageSlug(tool.slug, profSlug);
    if (!existingSet.has(slug)) {
      queue.push({ tool, profession, profSlug, slug });
    }
  }
}

console.log(`🚀 实际队列大小: ${queue.length} 条（已排除重复）\n`);

// ── Step 3: 并发生成（含重试）──────────────────────────────────────────────
let generated = 0;
let skipped = 0;
let failed = 0;

async function callOpenAI(tool, profession, attempt = 1) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const completion = await openai.chat.completions.create(
      {
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: `Write an SEO-optimized landing page for:

Tool: ${tool.name}
Target user: ${profession}s

Structure:

**Introduction** (2 paragraphs)
Why ${profession}s need AI assistance for this task.

**How ${tool.name} Helps ${profession}s**
Specific workflows and use cases for this profession.

**3 Key Benefits**
Concrete, measurable benefits with specific examples.

**Step-by-Step Example**
A real-world example of a ${profession} using this tool.

**Getting Started**
How to begin using the tool immediately.

Target length: 900-1100 words.
Include natural keyword variations.

Return JSON:
{
  "title": "string (e.g. AI ${tool.name} for ${profession}s | AI Tools Station)",
  "seo_title": "string (max 60 chars)",
  "seo_description": "string (max 155 chars)",
  "content": "string (full markdown content)"
}`,
          },
        ],
        max_tokens: 1600,
      },
      { signal: controller.signal }
    );

    clearTimeout(timer);
    return completion.choices[0]?.message?.content ?? "{}";
  } catch (err) {
    clearTimeout(timer);
    if (attempt < MAX_RETRIES) {
      await sleep(RETRY_DELAY_MS * attempt);
      return callOpenAI(tool, profession, attempt + 1);
    }
    throw err;
  }
}

async function generateOne(item) {
  const { tool, profession, profSlug, slug } = item;

  try {
    const raw = await callOpenAI(tool, profession);
    const parsed = JSON.parse(raw);

    const row = {
      slug,
      type: "use_case",
      title: parsed.title ?? `AI ${tool.name} for ${profession}s`,
      seo_title:
        parsed.seo_title ??
        `AI ${tool.name} for ${profession}s | AI Tools Station`,
      seo_description:
        parsed.seo_description ??
        `How ${profession}s use ${tool.name} to work smarter and faster.`,
      content: parsed.content ?? "",
      tool_slug: tool.slug,
      meta: { profession: profSlug, tool_name: tool.name },
    };

    const { error } = await admin.from("seo_pages").insert(row);
    if (error) {
      if (error.code === "23505") {
        skipped++;
      } else {
        console.error(`  ✗ Insert [${slug}]: ${error.message}`);
        failed++;
      }
    } else {
      generated++;
      if (generated % 10 === 0) {
        process.stdout.write(`\r  ✅ ${generated} 条已生成，失败 ${failed} 条`);
      }
    }
  } catch (err) {
    console.error(`\n  ✗ ${slug}: ${err.message}`);
    failed++;
  }
}

// 分批并发（CONCURRENCY=5）
for (let i = 0; i < queue.length; i += CONCURRENCY) {
  const chunk = queue.slice(i, i + CONCURRENCY);
  await Promise.allSettled(chunk.map(generateOne));
}

console.log("\n");

// ── Step 4: 输出总结 ────────────────────────────────────────────────────────
const { count: totalUseCase } = await admin
  .from("seo_pages")
  .select("*", { count: "exact", head: true })
  .eq("type", "use_case");

console.log("═══════════════════════════════════");
console.log(`✅ 本次生成: ${generated} 条`);
console.log(`⚠️  跳过(重复): ${skipped} 条`);
console.log(`✗  失败: ${failed} 条`);
console.log(`📊 seo_pages use_case 总数: ${totalUseCase}`);
console.log("═══════════════════════════════════");
