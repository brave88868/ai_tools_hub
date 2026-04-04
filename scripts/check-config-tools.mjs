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
  .select("id, slug, name, tool_type, prompt_file, inputs_schema")
  .eq("is_active", true)
  .order("slug");

// All config tools
const configTools = tools.filter(t => t.tool_type === "config");
console.log(`=== Config tools (${configTools.length}) ===`);
for (const t of configTools) {
  const hasInputs = t.inputs_schema && Array.isArray(t.inputs_schema) && t.inputs_schema.length > 0;
  console.log(`\n${t.slug} [id: ${t.id}]`);
  console.log(`  inputs: ${hasInputs ? t.inputs_schema.map(f => f.name).join(", ") : "EMPTY"}`);
}

// All template tools with null inputs_schema
const templateNoInputs = tools.filter(t => t.tool_type === "template" && (!t.inputs_schema || (Array.isArray(t.inputs_schema) && t.inputs_schema.length === 0)));
console.log(`\n=== Template tools with no inputs (${templateNoInputs.length}) ===`);
for (const t of templateNoInputs) {
  console.log(`  ${t.slug} → prompt: ${t.prompt_file}`);
}
