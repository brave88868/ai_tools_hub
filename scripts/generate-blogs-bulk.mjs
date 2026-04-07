/**
 * Bulk blog post generator
 * Generates posts from pending seo_keywords + custom topic list
 * Usage: node scripts/generate-blogs-bulk.mjs [target=42]
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envContent = readFileSync(resolve(__dirname, "../.env.local"), "utf-8");
const OPENAI_KEY = envContent.match(/OPENAI_API_KEY=(.+)/)?.[1]?.trim();
if (!OPENAI_KEY) throw new Error("OPENAI_API_KEY not found");

const SUPABASE_URL = "https://mvgqrgmkyvimsriemwmu.supabase.co";
const SUPABASE_KEY =
  "REDACTED_SERVICE_ROLE_KEY";
const sbHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

const TARGET = parseInt(process.argv[2] ?? "42");
const CONCURRENCY = 5;

// Fallback topic list (used if seo_keywords < TARGET)
const FALLBACK_TOPICS = [
  "How to use AI for job interviews in 2025",
  "Top 10 AI tools for marketers in 2025",
  "AI resume writer vs manual resume: which is better?",
  "Complete guide to AI writing tools for bloggers",
  "How AI tools are transforming small business operations",
  "Best AI tools for freelancers to save 10 hours a week",
  "How to write a cover letter with AI (step-by-step)",
  "AI tools for social media managers: the ultimate guide",
  "How to use AI for content creation in 2025",
  "Top AI productivity tools for remote workers",
  "AI legal tools: what small businesses need to know",
  "How to optimize your LinkedIn profile with AI",
  "AI tools for data analysts: a practical guide",
  "How to generate product descriptions with AI",
  "Best AI email tools to write faster and convert more",
  "How to use AI for competitive market research",
  "AI tools for teachers and educators in 2025",
  "How to create a business plan with AI",
  "Top AI tools for e-commerce sellers",
  "How AI is changing the recruitment industry",
  "AI copywriting tools vs human copywriters: pros and cons",
  "How to use AI to analyze customer feedback",
  "Best AI tools for content repurposing",
  "How to use AI for financial planning and analysis",
  "AI tools for project managers: boost team productivity",
  "How to write SEO blog posts with AI in 30 minutes",
  "AI video tools for YouTube creators in 2025",
  "How to use AI for sales proposals and pitches",
  "Best AI tools for podcast creators",
  "How to build a personal brand with AI tools",
  "AI tools for HR managers: streamline hiring and onboarding",
  "How to create marketing campaigns with AI",
  "Top AI tools for startup founders in 2025",
  "How to use AI for customer service automation",
  "AI writing tools comparison: GPT-4 vs Claude vs Gemini",
  "How to analyze legal contracts with AI (safely)",
  "Best AI tools for accountants and finance teams",
  "How to use AI to grow your consulting business",
  "AI tools for designers: automate the repetitive tasks",
  "How to write technical documentation with AI",
  "Complete guide to AI tools for students",
  "How to use AI for meeting notes and action items",
];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
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
  if (!res.ok) throw new Error(await res.text());
}

async function sbPatch(table, filter, update) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: "PATCH",
    headers: { ...sbHeaders, Prefer: "return=minimal" },
    body: JSON.stringify(update),
  });
  return res.ok;
}

async function openaiChat(prompt) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
      temperature: 0.75,
      max_tokens: 2000,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return JSON.parse(data.choices[0]?.message?.content ?? "{}");
}

// ── Main ──────────────────────────────────────────────────────────────────────
const startTime = Date.now();
console.log(`\n📝 Blog bulk generator — target: ${TARGET} posts, concurrency: ${CONCURRENCY}\n`);

// Load current blog slugs (dedup)
const existingBlogs = await sbGet("/blog_posts?select=slug&limit=500");
const existingSlugs = new Set((existingBlogs ?? []).map((b) => b.slug));
console.log(`✓ Existing blogs: ${existingSlugs.size}`);

// Load pending seo_keywords
const pendingKw = await sbGet(
  `/seo_keywords?select=id,keyword,toolkit_slug&status=eq.pending&limit=200`
);
console.log(`✓ Pending seo_keywords: ${pendingKw.length}`);

// Build topic list: keywords first, then fallbacks
const topics = [];
for (const kw of pendingKw) {
  topics.push({ keyword: kw.keyword, kwId: kw.id });
}
for (const t of FALLBACK_TOPICS) {
  if (topics.length >= TARGET) break;
  if (!topics.find((x) => x.keyword.toLowerCase() === t.toLowerCase())) {
    topics.push({ keyword: t, kwId: null });
  }
}
const workList = topics.slice(0, TARGET);
console.log(`✓ Work list: ${workList.length} topics\n`);

const results = { generated: 0, skipped: 0 };

async function generateOne(item) {
  const { keyword, kwId } = item;
  const prompt = `Write an 800-1000 word SEO blog article about: "${keyword}" for an AI tools platform.
Markdown format with ## headings. Practical and helpful tone. No H1 tag in body.
Include: introduction, 3-4 main sections, practical tips, conclusion.
Return ONLY valid JSON:
{"title":"max 70 chars","excerpt":"2 engaging sentences","seo_title":"max 60 chars","seo_description":"max 155 chars","content":"full markdown body"}`;

  try {
    const article = await openaiChat(prompt);
    const baseSlug = slugify(article.title ?? keyword);
    const finalSlug = existingSlugs.has(baseSlug) ? `${baseSlug}-${Date.now()}` : baseSlug;
    existingSlugs.add(finalSlug);

    await sbInsert("blog_posts", {
      slug: finalSlug,
      title: article.title ?? keyword,
      excerpt: article.excerpt ?? "",
      content: article.content ?? "",
      seo_title: article.seo_title ?? article.title ?? keyword,
      seo_description: article.seo_description ?? "",
      keywords: keyword,
      published: true,
      auto_generated: true,
    });

    if (kwId) {
      await sbPatch("seo_keywords", `id=eq.${kwId}`, { status: "used" });
    }

    results.generated++;
    console.log(
      `  ✓ [${results.generated}/${workList.length}] "${(article.title ?? keyword).slice(0, 60)}"`
    );
  } catch (err) {
    results.skipped++;
    console.error(`  ✗ skip "${keyword.slice(0, 50)}": ${err.message?.slice(0, 80)}`);
  }
}

// Chunked concurrency
for (let i = 0; i < workList.length; i += CONCURRENCY) {
  const chunk = workList.slice(i, i + CONCURRENCY);
  await Promise.allSettled(chunk.map(generateOne));
}

const totalSec = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(
  `\n✅ Done in ${totalSec}s — generated: ${results.generated}, skipped: ${results.skipped}`
);
console.log(`   Total blogs now: ~${existingSlugs.size}`);
