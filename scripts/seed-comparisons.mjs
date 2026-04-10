/**
 * seed-comparisons.mjs
 * 向 seo_comparisons 表写入初始对比页面记录
 * 用法: node scripts/seed-comparisons.mjs
 */

import { readFileSync } from "fs";

// 读取 .env.local
const env = readFileSync(".env.local", "utf-8");
env.split("\n").forEach((line) => {
  const eq = line.indexOf("=");
  if (eq > 0) process.env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env.local");
  process.exit(1);
}

const headers = {
  "Content-Type": "application/json",
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  Prefer: "resolution=ignore-duplicates,return=minimal",
};

const COMPARISONS = [
  {
    slug: "ai-resume-generator-vs-chatgpt",
    title: "AI Resume Generator vs ChatGPT: Which Writes Better Resumes?",
    tool_a: "AI Tools Station Resume Generator",
    tool_b: "ChatGPT",
    seo_title: "AI Resume Generator vs ChatGPT — Which is Better for Job Seekers? (2025)",
    seo_description:
      "Compare AI Tools Station Resume Generator vs ChatGPT for writing resumes. See which produces better results for job seekers.",
  },
  {
    slug: "ai-flashcard-generator-vs-quizlet",
    title: "AI Flashcard Generator vs Quizlet: Best Study Tool?",
    tool_a: "AI Tools Station Flashcard Generator",
    tool_b: "Quizlet",
    seo_title: "AI Flashcard Generator vs Quizlet — Best Study Tool Compared (2025)",
    seo_description:
      "Compare AI Flashcard Generator vs Quizlet. Which tool creates better flashcards and helps you learn faster?",
  },
  {
    slug: "ai-business-plan-generator-vs-chatgpt",
    title: "AI Business Plan Generator vs ChatGPT",
    tool_a: "AI Tools Station Business Plan Generator",
    tool_b: "ChatGPT",
    seo_title: "AI Business Plan Generator vs ChatGPT — Which Creates Better Plans?",
    seo_description:
      "Compare AI Business Plan Generator vs ChatGPT. See which tool produces more structured, professional business plans.",
  },
  {
    slug: "ai-marketing-copy-generator-vs-jasper",
    title: "AI Marketing Copy Generator vs Jasper AI",
    tool_a: "AI Tools Station Marketing Copy Generator",
    tool_b: "Jasper AI",
    seo_title: "AI Marketing Copy Generator vs Jasper AI — Which Writes Better Copy? (2025)",
    seo_description:
      "Compare AI Marketing Copy Generator vs Jasper AI for writing marketing content. Free vs paid — which delivers better results?",
  },
  {
    slug: "ai-resume-generator-vs-resume-io",
    title: "AI Resume Generator vs Resume.io",
    tool_a: "AI Tools Station Resume Generator",
    tool_b: "Resume.io",
    seo_title: "AI Resume Generator vs Resume.io — Best Resume Builder Compared (2025)",
    seo_description:
      "Compare AI Resume Generator vs Resume.io. Which resume builder creates more professional, ATS-friendly resumes?",
  },
  {
    slug: "ai-tools-station-vs-jasper",
    title: "AI Tools Station vs Jasper AI",
    tool_a: "AI Tools Station",
    tool_b: "Jasper AI",
    seo_title: "AI Tools Station vs Jasper AI: Full Comparison (2025)",
    seo_description:
      "AI Tools Station vs Jasper AI — compare features, pricing, and content quality. Find the best AI writing platform for your needs.",
  },
  {
    slug: "ai-tools-station-vs-writesonic",
    title: "AI Tools Station vs Writesonic",
    tool_a: "AI Tools Station",
    tool_b: "Writesonic",
    seo_title: "AI Tools Station vs Writesonic: Full 2025 Review",
    seo_description:
      "AI Tools Station vs Writesonic — 600+ specialized AI tools vs an all-in-one writing assistant. Which fits your workflow?",
  },
  {
    slug: "ai-cover-letter-generator-vs-kickresume",
    title: "AI Cover Letter Generator vs Kickresume",
    tool_a: "AI Tools Station Cover Letter Generator",
    tool_b: "Kickresume",
    seo_title: "AI Cover Letter Generator vs Kickresume (2025)",
    seo_description:
      "Compare AI cover letter generators. AI Tools Station vs Kickresume — which writes better letters for job applications?",
  },
  {
    slug: "ai-email-generator-vs-lavender",
    title: "AI Email Generator vs Lavender",
    tool_a: "AI Tools Station Email Generator",
    tool_b: "Lavender",
    seo_title: "AI Email Generator vs Lavender: Best Email AI Tool? (2025)",
    seo_description:
      "AI Tools Station Email Generator vs Lavender. Compare cold email, sales email writing quality, features and price.",
  },
  {
    slug: "ai-blog-post-generator-vs-surfer-seo",
    title: "AI Blog Post Generator vs Surfer SEO",
    tool_a: "AI Tools Station Blog Post Generator",
    tool_b: "Surfer SEO",
    seo_title: "AI Blog Generator vs Surfer SEO: Which Creates Better Content? (2025)",
    seo_description:
      "AI blog post generator vs Surfer SEO — creation speed, SEO optimization, and output quality for content marketers.",
  },
];

const res = await fetch(`${SUPABASE_URL}/rest/v1/seo_comparisons?on_conflict=slug`, {
  method: "POST",
  headers,
  body: JSON.stringify(COMPARISONS),
});

if (!res.ok) {
  console.error("❌ Error:", await res.text());
  process.exit(1);
}

console.log(`✅ Seeded ${COMPARISONS.length} comparison records into seo_comparisons`);
console.log("   Content can be generated with: node scripts/generate-comparisons.mjs");
