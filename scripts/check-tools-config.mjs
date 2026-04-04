import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf-8");
const vars = {};
for (const line of env.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) vars[m[1].trim()] = m[2].trim();
}

const supabase = createClient(vars.NEXT_PUBLIC_SUPABASE_URL, vars.SUPABASE_SERVICE_ROLE_KEY);

const { data: tools } = await supabase
  .from("tools")
  .select("slug, name, tool_type, prompt_file, inputs_schema, is_active")
  .eq("is_active", true)
  .order("slug");

console.log(`\nTotal active tools: ${tools.length}\n`);

// 找出 inputs_schema 为空或 null 的工具
const noInputs = tools.filter(t => !t.inputs_schema || (Array.isArray(t.inputs_schema) && t.inputs_schema.length === 0));
console.log(`=== Tools with empty inputs_schema (${noInputs.length}) ===`);
noInputs.forEach(t => console.log(` - ${t.slug}`));

// 找出没有 prompt_file 的工具
const noPrompt = tools.filter(t => !t.prompt_file);
console.log(`\n=== Tools with no prompt_file (${noPrompt.length}) ===`);
noPrompt.forEach(t => console.log(` - ${t.slug} [${t.tool_type}]`));

// 重点工具详情
const targets = ["flashcard-generator", "business-proposal-gen", "meeting-summary-gen", "nda-analyzer", "resume-optimizer"];
console.log(`\n=== Target tool details ===`);
for (const slug of targets) {
  const t = tools.find(x => x.slug === slug);
  if (!t) { console.log(`${slug}: NOT FOUND`); continue; }
  console.log(`\n${slug}:`);
  console.log(`  tool_type: ${t.tool_type}`);
  console.log(`  prompt_file: ${t.prompt_file}`);
  console.log(`  inputs_schema: ${JSON.stringify(t.inputs_schema)}`);
}
