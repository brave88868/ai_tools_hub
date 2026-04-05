#!/usr/bin/env node
/**
 * Generate how-to problem solving guides
 * Usage: node scripts/generate-problems.mjs [--count=10]
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

const PROBLEM_SLUGS = [
  "how-to-write-resume-summary", "how-to-write-cover-letter",
  "how-to-write-youtube-script", "how-to-write-marketing-email",
  "how-to-create-business-plan", "how-to-write-linkedin-profile",
  "how-to-write-blog-post", "how-to-create-social-media-content",
  "how-to-write-product-description", "how-to-analyze-contract",
  "how-to-write-cold-email", "how-to-create-pitch-deck",
  "how-to-write-job-description", "how-to-create-youtube-thumbnail",
  "how-to-write-press-release", "how-to-create-newsletter",
  "how-to-write-terms-of-service", "how-to-create-nda",
  "how-to-write-performance-review", "how-to-create-content-calendar",
];

function slugToTitle(slug) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));
const count = Math.min(parseInt(args.count ?? "10", 10), 20);

async function main() {
  const { data: existing } = await supabase.from("seo_problems").select("slug");
  const existingSet = new Set((existing ?? []).map((r) => r.slug));

  const candidates = PROBLEM_SLUGS.filter((s) => !existingSet.has(s));
  if (candidates.length === 0) { console.log("All problem pages already generated!"); return; }

  const toGenerate = candidates.slice(0, count);
  console.log(`Generating ${toGenerate.length} problem pages...`);
  let generated = 0;

  for (const problemSlug of toGenerate) {
    const problemTitle = slugToTitle(problemSlug);
    try {
      console.log(`  Generating: ${problemTitle}...`);
      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: `Write a comprehensive how-to guide: "${problemTitle}"

Include:
1. Understanding the problem and why it matters
2. Step-by-step solution (5-7 clear steps)
3. AI tools that help with each step
4. Real examples with before/after
5. Common mistakes to avoid

Return ONLY valid JSON:
{"seo_title":"string max 60 chars","seo_description":"string max 155 chars","content":"full 800 word markdown guide"}`
        }],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const article = JSON.parse(res.choices[0].message.content ?? "{}");
      const { error } = await supabase.from("seo_problems").insert({
        slug: problemSlug, problem: problemTitle,
        seo_title: article.seo_title, seo_description: article.seo_description, content: article.content,
      });

      if (!error) { generated++; console.log(`  ✓ [${generated}] ${problemSlug}`); }
      else console.error(`  ✗ ${error.message}`);
    } catch (err) {
      console.error(`  ✗ ${err.message}`);
    }
  }
  console.log(`\nDone. Generated ${generated} problem pages.`);
}

main().catch(console.error);
