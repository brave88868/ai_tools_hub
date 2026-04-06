/**
 * Upgrades prompt_template for the 10 MED-quality work-life-templates tools
 * Run: node scripts/upgrade-wlt-prompts.mjs
 */
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf-8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

async function upgradePrompt(tool) {
  const inputNames = Array.isArray(tool.inputs_schema)
    ? tool.inputs_schema.map(f => `{${f.name}}`).join(", ")
    : "";

  const prompt = `You are an expert prompt engineer creating a high-quality system prompt for an AI productivity tool called "${tool.name}".

Current prompt (too short — needs improvement):
---
${tool.prompt_template}
---

Available input variables: ${inputNames}

Rewrite this prompt to be significantly better. Requirements:
1. Start with expert role definition: "You are an expert [role] with 15+ years of experience helping [users]..."
2. List all inputs using {variable_name} placeholders clearly
3. Include STEP 1 — INTERNAL ANALYSIS (do not output): with 3-4 planning steps
4. Output a COMPLETE, READY-TO-USE template with:
   - Clear section headings (## Section Name)
   - Placeholder variables in [BRACKETS] format for users to fill in (e.g., [Name], [Date], [Company])
   - Professional tables or structured lists where appropriate
   - Specific, actionable content (not vague descriptions)
   - At least 5-8 distinct sections appropriate for this template type
5. The template must be immediately usable — paste-and-fill, not describe-what-to-write
6. End with 2-3 pro tips specific to this template type

Return ONLY the improved prompt_template text. No JSON wrapper, no explanation.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 3000,
    temperature: 0.7,
  });

  return response.choices[0].message.content.trim();
}

async function main() {
  // Get toolkit ID
  const { data: tk } = await supabase
    .from("toolkits").select("id").eq("slug", "work-life-templates").single();

  // Get the 10 MED-quality tools
  const { data: tools } = await supabase
    .from("tools")
    .select("id, slug, name, prompt_template, inputs_schema")
    .eq("toolkit_id", tk.id)
    .order("name");

  const medTools = tools.filter(t => (t.prompt_template || "").length < 600);
  console.log(`\n🔧 Upgrading ${medTools.length} MED-quality tools...\n`);

  let upgraded = 0;
  let failed = 0;

  for (let i = 0; i < medTools.length; i++) {
    const tool = medTools[i];
    console.log(`[${i+1}/${medTools.length}] ${tool.name} (${(tool.prompt_template||"").length} chars)`);

    try {
      const newPrompt = await upgradePrompt(tool);
      const { error } = await supabase
        .from("tools")
        .update({ prompt_template: newPrompt })
        .eq("id", tool.id);

      if (error) {
        console.error(`  ❌ DB update failed: ${error.message}`);
        failed++;
      } else {
        console.log(`  ✅ Upgraded: ${(tool.prompt_template||"").length} → ${newPrompt.length} chars`);
        upgraded++;
      }
    } catch (err) {
      console.error(`  ❌ GPT-4o failed: ${err.message}`);
      failed++;
    }
  }

  // Final verification
  const { data: finalTools } = await supabase
    .from("tools")
    .select("slug, prompt_template")
    .eq("toolkit_id", tk.id)
    .order("slug");

  const remaining = finalTools.filter(t => (t.prompt_template || "").length < 600);
  console.log(`\n📊 Done: ${upgraded} upgraded, ${failed} failed`);
  console.log(`📊 Still below 600 chars: ${remaining.length}`);
  if (remaining.length > 0) remaining.forEach(t => console.log(`  - ${t.slug}: ${(t.prompt_template||"").length}`));
}

main().catch(console.error);
