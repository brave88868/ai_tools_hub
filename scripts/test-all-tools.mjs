import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";

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
  .order("name");

let pass = 0, fail = 0;
const issues = [];

for (const tool of tools) {
  const problems = [];

  if (tool.tool_type !== "template") {
    problems.push(`tool_type=${tool.tool_type} (should be template)`);
  }
  if (!tool.prompt_file) {
    problems.push("missing prompt_file");
  } else if (!existsSync(`prompts/${tool.prompt_file}`)) {
    problems.push(`prompt file not found: prompts/${tool.prompt_file}`);
  }
  if (!tool.inputs_schema || tool.inputs_schema.length === 0) {
    problems.push("empty inputs_schema");
  }

  if (problems.length > 0) {
    fail++;
    issues.push({ slug: tool.slug, problems });
    console.log(`❌ ${tool.slug}: ${problems.join(", ")}`);
  } else {
    pass++;
  }
}

console.log(`\n✅ Pass: ${pass} | ❌ Fail: ${fail}`);
if (issues.length > 0) {
  console.log("\nFailed tools:", JSON.stringify(issues, null, 2));
}
