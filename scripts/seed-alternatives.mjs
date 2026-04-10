/**
 * seed-alternatives.mjs
 * 向 seo_alternatives 表写入初始 alternatives 页面记录
 * 用法: node scripts/seed-alternatives.mjs
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

const ALTERNATIVES = [
  {
    slug: "jasper-ai-alternatives",
    tool_name: "Jasper AI",
    title: "Best Jasper AI Alternatives (Free & Paid)",
    seo_title: "Best Jasper AI Alternatives in 2025 — Free & Paid Options",
    seo_description:
      "Looking for Jasper AI alternatives? Compare the best free and paid alternatives for AI writing and marketing copy generation.",
  },
  {
    slug: "quizlet-alternatives",
    tool_name: "Quizlet",
    title: "Best Quizlet Alternatives for AI-Powered Studying",
    seo_title: "Best Quizlet Alternatives in 2025 — AI Flashcard Tools Compared",
    seo_description:
      "Looking for Quizlet alternatives? Discover AI-powered flashcard tools that create study materials automatically from your notes.",
  },
  {
    slug: "resume-io-alternatives",
    tool_name: "Resume.io",
    title: "Best Resume.io Alternatives (Free AI Resume Builders)",
    seo_title: "Best Resume.io Alternatives in 2025 — Free AI Resume Builders",
    seo_description:
      "Looking for Resume.io alternatives? Compare free AI resume builders that create professional, ATS-friendly resumes instantly.",
  },
  {
    slug: "copy-ai-alternatives",
    tool_name: "Copy.ai",
    title: "Best Copy.ai Alternatives for AI Copywriting",
    seo_title: "Best Copy.ai Alternatives in 2025 — Free AI Copywriting Tools",
    seo_description:
      "Looking for Copy.ai alternatives? Discover free AI copywriting tools that generate marketing copy, ads and social media content.",
  },
  {
    slug: "chatgpt-alternatives-for-business",
    tool_name: "ChatGPT",
    title: "Best ChatGPT Alternatives for Business Tasks",
    seo_title: "Best ChatGPT Alternatives for Business in 2025",
    seo_description:
      "Looking for ChatGPT alternatives for business? Discover structured AI tools built for specific business workflows — no prompt engineering needed.",
  },
  {
    slug: "writesonic-alternatives",
    tool_name: "Writesonic",
    title: "Best Writesonic Alternatives in 2025",
    seo_title: "Top Writesonic Alternatives: Better AI Writing Tools (2025)",
    seo_description:
      "Looking for Writesonic alternatives? Compare the best AI content tools for blogs, ads, emails, and social media.",
  },
  {
    slug: "buffer-alternatives",
    tool_name: "Buffer",
    title: "Best Buffer Alternatives for Social Media",
    seo_title: "10 Best Buffer Alternatives for Social Media (2025)",
    seo_description:
      "The best Buffer alternatives for social media management. AI-powered tools that create and schedule posts automatically.",
  },
  {
    slug: "kickresume-alternatives",
    tool_name: "Kickresume",
    title: "Best Kickresume Alternatives for Resume Building",
    seo_title: "Top Kickresume Alternatives for Resume Building (2025)",
    seo_description:
      "Compare the best Kickresume alternatives. AI resume builders that create ATS-optimized resumes in minutes.",
  },
  {
    slug: "grammarly-alternatives",
    tool_name: "Grammarly",
    title: "Best Grammarly Alternatives (Free & Premium)",
    seo_title: "10 Best Grammarly Alternatives: Free & Premium (2025)",
    seo_description:
      "The best Grammarly alternatives for grammar checking, writing improvement, and editing. Compare free and paid options.",
  },
  {
    slug: "canva-alternatives",
    tool_name: "Canva",
    title: "Best Canva Alternatives for Design & Content",
    seo_title: "Best Canva Alternatives for Design & Content (2025)",
    seo_description:
      "Top Canva alternatives for graphic design, social media, and marketing content. AI-powered tools that work faster.",
  },
];

const res = await fetch(`${SUPABASE_URL}/rest/v1/seo_alternatives?on_conflict=slug`, {
  method: "POST",
  headers,
  body: JSON.stringify(ALTERNATIVES),
});

if (!res.ok) {
  console.error("❌ Error:", await res.text());
  process.exit(1);
}

console.log(`✅ Seeded ${ALTERNATIVES.length} alternatives records into seo_alternatives`);
console.log("   Content can be generated with: node scripts/generate-alternatives.mjs");
