/**
 * Category blog post generator
 * Generates 10 posts for a specific category with the category field set.
 * Usage: node scripts/generate-blog-category.mjs <professionals|developers>
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

const TOPICS = {
  professionals: [
    "How AI Tools Can Simplify Your Daily Work Tasks",
    "Top AI Tools for Writing Professional Documents Faster",
    "How to Use AI to Prepare Better Meeting Agendas",
    "AI Tools for Taking and Organizing Meeting Notes",
    "How AI Can Help You Manage Your Work Schedule More Effectively",
    "Best AI Tools for Creating SOPs and Internal Documentation",
    "How to Use AI for Faster Email Writing at Work",
    "AI Tools for Office Workers: Save 2 Hours Every Day",
    "How AI Helps Professionals Stay Organized and Productive",
    "Using AI to Summarize Long Reports and Documents Instantly",
  ],
  developers: [
    "How AI Tools Help Data Analysts Work Faster",
    "Best AI Tools for Writing SQL Queries Automatically",
    "How to Use AI for Python Script Generation",
    "AI Tools for Automating Repetitive Data Tasks",
    "How AI Can Help You Build Workflow Automations Without Code",
    "Top AI Tools for Business Intelligence Reporting",
    "How to Use AI to Analyze and Interpret Business Data",
    "AI Tools for Creating Excel Formulas and Data Dashboards",
    "How AI Workflow Tools Save Time for Developers and Analysts",
    "Using AI to Generate and Document APIs Faster",
  ],
};

const category = process.argv[2];
if (!category || !TOPICS[category]) {
  console.error("Usage: node scripts/generate-blog-category.mjs <professionals|developers>");
  process.exit(1);
}

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
const topics = TOPICS[category];
console.log(`\n📝 Blog category generator — category: ${category}, posts: ${topics.length}\n`);

// Load existing slugs to avoid duplicates
const existingBlogs = await sbGet("/blog_posts?select=slug&limit=500");
const existingSlugs = new Set((existingBlogs ?? []).map((b) => b.slug));
console.log(`✓ Existing blogs: ${existingSlugs.size}\n`);

const results = { generated: 0, skipped: 0 };

for (const keyword of topics) {
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
      category,
    });

    results.generated++;
    console.log(`  ✓ [${results.generated}/${topics.length}] "${(article.title ?? keyword).slice(0, 60)}"`);
  } catch (err) {
    results.skipped++;
    console.error(`  ✗ skip "${keyword.slice(0, 50)}": ${err.message?.slice(0, 80)}`);
  }
}

const totalSec = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(
  `\n✅ Done in ${totalSec}s — generated: ${results.generated}, skipped: ${results.skipped}`
);
console.log(`   Total blogs now: ~${existingSlugs.size}`);
