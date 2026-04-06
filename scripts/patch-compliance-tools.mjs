/**
 * 修复 5 个 Compliance 工具——重新生成带正确占位符的 prompt_template
 */
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf-8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0,i).trim(), l.slice(i+1).trim()]; })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const SLUGS = [
  "incident-response-planner",
  "data-protection-impact-assessment-tool",
  "vendor-risk-management-evaluator",
  "regulatory-change-impact-analyzer",
];

async function regeneratePrompt(tool) {
  const fieldNames = tool.inputs_schema.map((f) => `{${f.name}}`).join(", ");
  const fieldDefs = tool.inputs_schema
    .map((f) => `- {${f.name}}: ${f.label}`)
    .join("\n");

  const prompt = `Write a detailed AI prompt template for a compliance tool called "${tool.name}".
Description: ${tool.description}

The template MUST reference these user inputs using {field_name} single-brace syntax:
${fieldDefs}

Format:
STEP 1: INTERNAL ANALYSIS
[Think through the compliance task silently]

Now generate the output:

[Professional, structured output using the inputs. Use ## headings. 150-250 words. Reference ${fieldNames} naturally in the text.]

Return only the prompt template text, no JSON wrapper.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 1000,
    temperature: 0.6,
    messages: [{ role: "user", content: prompt }],
  });

  return completion.choices[0].message.content?.trim() ?? "";
}

async function main() {
  console.log("🔧 Patching 5 compliance tools missing placeholders...\n");

  const { data: tools } = await supabase
    .from("tools")
    .select("id, name, slug, description, inputs_schema, prompt_template")
    .in("slug", SLUGS);

  for (const tool of tools ?? []) {
    console.log(`Processing: ${tool.name}`);
    const newTemplate = await regeneratePrompt(tool);

    // Verify placeholders present
    const fields = (tool.inputs_schema ?? []).map((f) => f.name);
    const hasAll = fields.every((f) => newTemplate.includes(`{${f}}`));

    if (!hasAll) {
      console.log(`  ⚠️  Still missing some placeholders, forcing injection...`);
      // Force inject at end
      const injection = fields.map((f) => `\n\nUser input - ${f}: {${f}}`).join("");
      const patched = newTemplate + injection;
      await supabase.from("tools").update({ prompt_template: patched }).eq("id", tool.id);
      console.log(`  ✅ Saved (with forced injection)`);
    } else {
      await supabase.from("tools").update({ prompt_template: newTemplate }).eq("id", tool.id);
      console.log(`  ✅ Saved — fields [${fields.join(", ")}] all present`);
    }
  }

  console.log("\n✅ Patch complete.");
}

main().catch((e) => { console.error(e); process.exit(1); });
