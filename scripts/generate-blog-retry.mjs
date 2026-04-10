/**
 * Retry script for failed blog posts
 * Usage: node scripts/generate-blog-retry.mjs
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

const RETRY_ITEMS = [
  { keyword: "Top AI Tools for Business Intelligence Reporting", category: "developers" },
  { keyword: "Using AI to Generate and Document APIs Faster", category: "developers" },
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

const existingBlogs = await sbGet("/blog_posts?select=slug&limit=500");
const existingSlugs = new Set((existingBlogs ?? []).map((b) => b.slug));
console.log(`\n🔄 Retrying ${RETRY_ITEMS.length} failed posts...\n`);

for (const { keyword, category } of RETRY_ITEMS) {
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

    console.log(`  ✓ "${(article.title ?? keyword).slice(0, 60)}"`);
  } catch (err) {
    console.error(`  ✗ "${keyword.slice(0, 50)}": ${err.message?.slice(0, 80)}`);
  }
}

console.log("\n✅ Retry done.");
