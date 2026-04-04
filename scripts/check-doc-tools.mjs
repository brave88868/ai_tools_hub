import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf-8");
const vars = {};
for (const line of env.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) vars[m[1].trim()] = m[2].trim();
}

const sb = createClient(vars.NEXT_PUBLIC_SUPABASE_URL, vars.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await sb.from("tools").select("slug, name, is_active").order("slug");

// Exact slugs we care about for dual-view
const TARGET_SLUGS = [
  "resume-optimizer",
  "cover-letter-optimizer",
  "linkedin-profile-optimizer",
  "linkedin-optimizer",
  "nda-analyzer",
  "contract-analyzer",
  "contract-risk-analyzer",
  "essay-improver",
  "email-rewriter",
];

console.log("=== Target doc tools (exact match) ===");
for (const slug of TARGET_SLUGS) {
  const t = data.find(x => x.slug === slug);
  console.log(t ? `✅ ${slug} (active: ${t.is_active})` : `❌ ${slug} — NOT IN DB`);
}

// Also show all tools containing optimizer/analyzer/improver/rewriter
console.log("\n=== All tools with optimizer/analyzer/improver/rewriter/editor ===");
const docTools = data.filter(t =>
  ["optimizer", "analyzer", "improver", "rewriter", "editor"].some(k => t.slug.includes(k))
);
console.table(docTools.map(t => ({ slug: t.slug, name: t.name, active: t.is_active })));
