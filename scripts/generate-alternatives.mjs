#!/usr/bin/env node
/**
 * Generate "{tool} alternatives" articles for major competitor tools
 * Usage: node scripts/generate-alternatives.mjs [--count=10]
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

const COMPETITOR_TOOLS = [
  "Jasper", "Copy.ai", "Grammarly", "ChatGPT", "Notion AI",
  "Resume.io", "Canva", "Midjourney", "Claude", "Gemini",
  "Perplexity", "Writesonic", "Rytr", "Surfer SEO", "Frase",
  "Semrush", "Ahrefs", "Clearscope", "Loom", "Otter.ai",
  "Descript", "Synthesia", "HeyGen", "Pictory", "Murf",
  "ElevenLabs", "Runway", "Pika", "Invideo AI", "Opus Clip",
];

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));
const count = Math.min(parseInt(args.count ?? "10", 10), 30);

async function main() {
  const { data: existing } = await supabase.from("seo_alternatives").select("slug");
  const existingSet = new Set((existing ?? []).map((r) => r.slug));

  const candidates = COMPETITOR_TOOLS.filter((t) => {
    const slug = t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-alternatives";
    return !existingSet.has(slug);
  });

  if (candidates.length === 0) { console.log("All alternatives already generated!"); return; }

  const toGenerate = candidates.slice(0, count);
  console.log(`Generating ${toGenerate.length} alternatives articles...`);
  let generated = 0;

  for (const toolName of toGenerate) {
    const slug = toolName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-alternatives";
    try {
      console.log(`  Generating: ${toolName} alternatives...`);
      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: `Write an SEO article: "Top 10 Alternatives to ${toolName} in 2025"

Include for each alternative: overview, key features, pricing, pros and cons.
Focus on how AI Tools Hub tools compare as alternatives.
Include a comparison summary at the end.

Return ONLY valid JSON:
{"title":"string max 80 chars","seo_title":"string max 60 chars","seo_description":"string max 155 chars","content":"full 900 word markdown article"}`
        }],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const article = JSON.parse(res.choices[0].message.content ?? "{}");
      const { error } = await supabase.from("seo_alternatives").insert({
        slug, tool_name: toolName, title: article.title,
        seo_title: article.seo_title, seo_description: article.seo_description, content: article.content,
      });

      if (!error) { generated++; console.log(`  ✓ [${generated}] ${slug}`); }
      else console.error(`  ✗ ${error.message}`);
    } catch (err) {
      console.error(`  ✗ ${err.message}`);
    }
  }
  console.log(`\nDone. Generated ${generated} alternatives articles.`);
}

main().catch(console.error);
