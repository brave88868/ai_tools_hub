import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import path from "path";

const env = readFileSync(".env.local", "utf-8");
const vars = {};
for (const line of env.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) vars[m[1].trim()] = m[2].trim();
}

const supabase = createClient(vars.NEXT_PUBLIC_SUPABASE_URL, vars.SUPABASE_SERVICE_ROLE_KEY);
const { data: tools } = await supabase
  .from("tools")
  .select("slug, tool_type, prompt_file, inputs_schema")
  .eq("is_active", true);

let issues = 0;

for (const t of tools) {
  const hasInputs = Array.isArray(t.inputs_schema) && t.inputs_schema.length > 0;
  const promptExists = t.prompt_file
    ? existsSync(path.join("prompts", t.prompt_file))
    : false;

  if (!hasInputs) {
    console.log(`❌ NO INPUTS: ${t.slug}`);
    issues++;
  } else if (t.tool_type === "template" && !promptExists) {
    console.log(`❌ MISSING PROMPT: ${t.slug} → ${t.prompt_file}`);
    issues++;
  } else if (t.tool_type === "config") {
    console.log(`⚠️  STILL CONFIG: ${t.slug}`);
    issues++;
  }
}

if (issues === 0) {
  console.log(`✅ All ${tools.length} tools look good!`);
} else {
  console.log(`\n⚠️  ${issues} issues found.`);
}

// Spot check target tools
const targets = ["flashcard-generator","business-proposal-gen","meeting-summary-gen","nda-analyzer","resume-optimizer"];
console.log("\n=== Target tools ===");
for (const slug of targets) {
  const t = tools.find(x => x.slug === slug);
  if (!t) { console.log(`${slug}: NOT FOUND`); continue; }
  const hasInputs = Array.isArray(t.inputs_schema) && t.inputs_schema.length > 0;
  const promptOk = t.prompt_file && existsSync(path.join("prompts", t.prompt_file));
  console.log(`${slug}: inputs=${hasInputs ? "✓" : "✗"} prompt=${promptOk ? "✓" : "✗"} type=${t.tool_type}`);
}
