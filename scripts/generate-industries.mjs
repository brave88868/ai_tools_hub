#!/usr/bin/env node
/**
 * Generate "best AI tools for {industry}" landing pages
 * Usage: node scripts/generate-industries.mjs [--count=10]
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "../.env.local");
try {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
} catch { console.error("Could not load .env.local"); }

const INDUSTRY_SLUGS = [
  "lawyers", "teachers", "marketers", "students", "freelancers",
  "startups", "small-business-owners", "content-creators", "hr-managers",
  "sales-teams", "real-estate-agents", "coaches", "consultants",
  "engineers", "designers", "product-managers", "entrepreneurs",
  "recruiters", "accountants", "healthcare-professionals",
  "e-commerce-sellers", "social-media-managers", "seo-specialists",
  "copywriters", "journalists", "researchers", "developers",
  "finance-professionals", "project-managers", "event-planners",
  "photographers", "videographers", "podcasters", "authors",
  "professors", "nonprofit-managers", "virtual-assistants",
  "customer-support-teams", "data-analysts", "investors",
];

function slugToTitle(slug) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));
const count = Math.min(parseInt(args.count ?? "10", 10), 40);

async function main() {
  const { data: existing } = await supabase.from("seo_industries").select("slug");
  const existingSet = new Set((existing ?? []).map((r) => r.slug));

  const candidates = INDUSTRY_SLUGS.filter((s) => !existingSet.has(s));
  if (candidates.length === 0) { console.log("All industry pages already generated!"); return; }

  const toGenerate = candidates.slice(0, count);
  console.log(`Generating ${toGenerate.length} industry pages...`);
  let generated = 0;

  for (const industrySlug of toGenerate) {
    const industryName = slugToTitle(industrySlug);
    try {
      console.log(`  Generating: ${industryName}...`);
      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: `Write an SEO landing page: "Best AI Tools for ${industryName} in 2025"

Include:
1. Common challenges faced by ${industryName}
2. How AI tools solve these problems
3. Top 5 recommended AI tools with specific use cases
4. Getting started guide (3-5 steps)
5. FAQ section (3 questions)

Return ONLY valid JSON:
{"seo_title":"string max 60 chars","seo_description":"string max 155 chars","content":"full 800 word markdown page"}`
        }],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const article = JSON.parse(res.choices[0].message.content ?? "{}");
      const { error } = await supabase.from("seo_industries").insert({
        slug: industrySlug, industry: industryName,
        seo_title: article.seo_title, seo_description: article.seo_description, content: article.content,
      });

      if (!error) { generated++; console.log(`  ✓ [${generated}] ${industrySlug}`); }
      else console.error(`  ✗ ${error.message}`);
    } catch (err) {
      console.error(`  ✗ ${err.message}`);
    }
  }
  console.log(`\nDone. Generated ${generated} industry pages.`);
}

main().catch(console.error);
