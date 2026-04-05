#!/usr/bin/env node
/**
 * Generate comparison articles for AI tools
 * Usage: node scripts/generate-comparisons.mjs [--count=10]
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// Load .env.local
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => a.replace(/^--/, "").split("="))
);
const count = Math.min(parseInt(args.count ?? "10", 10), 50);

async function main() {
  console.log(`Generating ${count} comparison articles...`);

  const { data: tools } = await supabase.from("tools").select("slug, name").eq("is_active", true);
  if (!tools || tools.length < 2) { console.error("Not enough tools in DB"); process.exit(1); }

  const { data: existing } = await supabase.from("seo_comparisons").select("slug");
  const existingSet = new Set((existing ?? []).map((r) => r.slug));

  let generated = 0;
  let attempts = 0;

  while (generated < count && attempts < count * 6) {
    attempts++;
    const idxA = Math.floor(Math.random() * tools.length);
    let idxB = Math.floor(Math.random() * tools.length);
    while (idxB === idxA) idxB = Math.floor(Math.random() * tools.length);

    const toolA = tools[idxA];
    const toolB = tools[idxB];
    const slug = `${toolA.slug}-vs-${toolB.slug}`;
    const reverseSlug = `${toolB.slug}-vs-${toolA.slug}`;

    if (existingSet.has(slug) || existingSet.has(reverseSlug)) continue;

    try {
      console.log(`  Generating: ${toolA.name} vs ${toolB.name}...`);
      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: `Compare two AI tools for an SEO comparison article.
Tool A: ${toolA.name}
Tool B: ${toolB.name}

Write a 900-word SEO article including:
1. Overview of both tools
2. Features comparison table
3. Pros and cons of each
4. Pricing comparison
5. Which tool is better for different users
6. Final verdict

Return ONLY valid JSON:
{"title":"string max 80 chars","seo_title":"string max 60 chars","seo_description":"string max 155 chars","content":"full markdown article"}`
        }],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const article = JSON.parse(res.choices[0].message.content ?? "{}");
      const { error } = await supabase.from("seo_comparisons").insert({
        slug, tool_a: toolA.name, tool_b: toolB.name,
        title: article.title, seo_title: article.seo_title,
        seo_description: article.seo_description, content: article.content,
      });

      if (!error) {
        existingSet.add(slug);
        generated++;
        console.log(`  ✓ [${generated}/${count}] ${slug}`);
      } else {
        console.error(`  ✗ DB error: ${error.message}`);
      }
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}`);
    }
  }

  console.log(`\nDone. Generated ${generated} comparison articles.`);
}

main().catch(console.error);
