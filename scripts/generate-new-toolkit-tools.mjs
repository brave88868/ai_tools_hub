/**
 * scripts/generate-new-toolkit-tools.mjs
 *
 * 为三个新 Toolkit 生成高质量工具并写入数据库：
 *   - presentation-toolkit
 *   - workflow-automation-toolkit
 *   - compliance-toolkit
 *
 * 用法：node scripts/generate-new-toolkit-tools.mjs
 */

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { readFileSync } from "fs";

// ── Load env ──────────────────────────────────────────────────────────────
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf-8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

// ── Toolkit definitions ───────────────────────────────────────────────────
const TOOLKITS = [
  {
    slug: "presentation-toolkit",
    label: "Presentation",
    referenceTools: [
      "Gamma", "Beautiful.ai", "Tome", "Pitch", "Canva AI",
      "Plus AI", "Slides AI", "Decktopus", "MagicSlides", "Prezent",
    ],
    context: "AI-powered presentation creation, slide design, visual storytelling, and pitch deck building",
  },
  {
    slug: "workflow-automation-toolkit",
    label: "Workflow Automation",
    referenceTools: [
      "Zapier", "Make", "n8n", "Relay", "Lindy",
      "Gumloop", "Activepieces", "Bardeen", "Tray.io", "Workato",
    ],
    context: "AI workflow automation, process documentation, integration planning, and business process optimization",
  },
  {
    slug: "compliance-toolkit",
    label: "Compliance",
    referenceTools: [
      "Vanta", "Sprinto", "Drata", "Tugboat Logic", "Hyperproof",
      "LogicGate", "Secureframe", "Laika", "Thoropass", "AuditBoard",
    ],
    context: "Compliance management, security frameworks (SOC2, ISO27001, GDPR, HIPAA), audit preparation, and risk assessment",
  },
];

// ── Generate tools for a toolkit ─────────────────────────────────────────
async function generateToolsForToolkit(toolkit) {
  const prompt = `You are a product designer building AI tools for a SaaS platform called "AI Tools Station".

Toolkit: ${toolkit.label}
Context: ${toolkit.context}
Inspired by these real products: ${toolkit.referenceTools.join(", ")}

Generate 10 unique, high-quality AI tools for this toolkit. Each tool should be:
- Practical and immediately useful
- Focused on a specific, concrete task (not too broad)
- Different from the others (no duplicates)
- Named clearly (not copying the real product names above, but inspired by their use cases)

Return ONLY a valid JSON array of 10 tools with this exact structure:
[
  {
    "name": "Tool Display Name",
    "slug": "tool-slug-kebab-case",
    "description": "2-3 sentences explaining what this tool does and who benefits from it.",
    "inputs_schema": [
      {"name": "field_name", "label": "Display Label", "type": "textarea", "placeholder": "Helpful hint for user...", "required": true}
    ],
    "prompt_template": "STEP 1: INTERNAL ANALYSIS\\n[Think through the task silently]\\n\\nNow generate the output:\\n\\n[Detailed, professional AI prompt using {{field_name}} placeholders for inputs. 150-250 words. Produce structured, professional output with clear headings.]",
    "seo_title": "SEO title max 60 chars including main keyword",
    "seo_description": "SEO description max 155 chars, clear value proposition"
  }
]

Rules for inputs_schema:
- 2-4 fields max
- At least one "textarea" type for main input
- Use "text" for short inputs (topic, company name, etc.)
- Use "select" sparingly, only if there are 3-5 clear fixed options (add "options": ["opt1","opt2"])
- field names must be snake_case

Rules for prompt_template:
- Must start with "STEP 1: INTERNAL ANALYSIS"
- Use {{field_name}} to reference inputs (double braces)
- Generate structured output with ## headings
- Be specific, professional, results-oriented
- 150-250 words`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 8000,
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "You are a product designer. Return only valid JSON — a top-level object with a 'tools' array containing exactly 10 tool objects.",
      },
      { role: "user", content: prompt + "\n\nWrap the array in: {\"tools\": [...]} " },
    ],
  });

  const raw = completion.choices[0].message.content ?? "{}";
  const parsed = JSON.parse(raw);
  return parsed.tools ?? parsed; // handle both {tools:[]} and direct array
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log("🚀 Starting tool generation for 3 new toolkits...\n");

  // Step 1: Fetch toolkit IDs
  const slugs = TOOLKITS.map((t) => t.slug);
  const { data: toolkitRows, error: tkErr } = await supabase
    .from("toolkits")
    .select("id, slug, name")
    .in("slug", slugs);

  if (tkErr) { console.error("❌ Failed to fetch toolkits:", tkErr.message); process.exit(1); }

  const toolkitMap = new Map(toolkitRows.map((r) => [r.slug, r]));
  console.log("📦 Found toolkits:");
  for (const t of TOOLKITS) {
    const row = toolkitMap.get(t.slug);
    console.log(`  ${row ? "✅" : "❌"} ${t.slug} → ${row ? `id: ${row.id}` : "NOT FOUND"}`);
  }

  const missing = TOOLKITS.filter((t) => !toolkitMap.has(t.slug));
  if (missing.length > 0) {
    console.error(`\n❌ Missing toolkits: ${missing.map((t) => t.slug).join(", ")}`);
    console.error("Please create these toolkits in the DB first via /admin/toolkits");
    process.exit(1);
  }

  console.log();

  // Step 2 & 3: Generate and insert tools
  const allResults = [];

  for (const toolkit of TOOLKITS) {
    const tkRow = toolkitMap.get(toolkit.slug);
    console.log(`\n🔧 Generating 10 tools for ${toolkit.label} Toolkit...`);

    let tools;
    try {
      tools = await generateToolsForToolkit(toolkit);
      console.log(`  ✅ Claude returned ${tools.length} tools`);
    } catch (err) {
      console.error(`  ❌ Claude generation failed: ${err.message}`);
      allResults.push(...Array(10).fill({ toolkit: toolkit.label, status: "generation_failed" }));
      continue;
    }

    // Insert tools one by one to track individual results
    for (let i = 0; i < tools.length; i++) {
      const tool = tools[i];
      const result = { toolkit: toolkit.label, name: tool.name, slug: tool.slug };

      // Validate inputs_schema
      let schemaValid = false;
      try {
        if (!Array.isArray(tool.inputs_schema) || tool.inputs_schema.length === 0) throw new Error("empty");
        for (const f of tool.inputs_schema) {
          if (!f.name || !f.label || !f.type) throw new Error(`invalid field: ${JSON.stringify(f)}`);
        }
        schemaValid = true;
      } catch (e) {
        result.schemaError = e.message;
      }

      // Validate prompt_template has placeholders
      const hasPlaceholders = tool.inputs_schema?.some(
        (f) => tool.prompt_template?.includes(`{{${f.name}}}`)
      ) ?? false;

      const { error: upsertErr } = await supabase.from("tools").upsert(
        {
          toolkit_id: tkRow.id,
          slug: tool.slug,
          name: tool.name,
          description: tool.description ?? null,
          tool_type: "template",
          inputs_schema: tool.inputs_schema,
          prompt_template: tool.prompt_template ?? null,
          output_format: "markdown",
          seo_title: tool.seo_title ?? null,
          seo_description: tool.seo_description ?? null,
          auto_generated: true,
          is_active: false,
          sort_order: i + 1,
        },
        { onConflict: "slug", ignoreDuplicates: false }
      );

      result.dbOk = !upsertErr;
      result.schemaOk = schemaValid;
      result.hasPlaceholders = hasPlaceholders;
      if (upsertErr) result.dbError = upsertErr.message;

      allResults.push(result);
      process.stdout.write(`  ${upsertErr ? "❌" : "✅"} [${i + 1}/10] ${tool.name}\n`);
    }
  }

  // Step 4: Validation + report
  console.log("\n\n📊 VALIDATION REPORT");
  console.log("─".repeat(80));
  console.log(
    "Tool Name".padEnd(36) +
    "DB".padEnd(8) +
    "Schema".padEnd(10) +
    "Placeholders"
  );
  console.log("─".repeat(80));

  let totalOk = 0;
  for (const r of allResults) {
    if (r.status === "generation_failed") {
      console.log(`[${r.toolkit}] GENERATION FAILED`.padEnd(56) + "❌ ❌ ❌");
      continue;
    }
    const db = r.dbOk ? "✅" : "❌";
    const schema = r.schemaOk ? "✅" : "❌";
    const placeholders = r.hasPlaceholders ? "✅" : "⚠️ ";
    const label = `[${r.toolkit.slice(0, 12)}] ${r.name}`;
    console.log(label.slice(0, 35).padEnd(36) + db.padEnd(8) + schema.padEnd(10) + placeholders);
    if (r.dbOk && r.schemaOk) totalOk++;
  }

  console.log("─".repeat(80));
  console.log(`\n✅ ${totalOk}/${allResults.length} tools successfully written to DB`);

  // Step 4b: Verify from DB
  console.log("\n🔍 DB verification query...");
  const toolkitIds = [...toolkitMap.values()].map((r) => r.id);
  const { data: dbTools, error: verifyErr } = await supabase
    .from("tools")
    .select("name, slug, is_active, toolkit_id, inputs_schema")
    .in("toolkit_id", toolkitIds)
    .eq("auto_generated", true)
    .order("created_at", { ascending: false })
    .limit(35);

  if (verifyErr) {
    console.error("  DB verify error:", verifyErr.message);
  } else {
    console.log(`  Found ${dbTools.length} auto_generated tools in DB for these toolkits`);

    let schemaIssues = 0;
    for (const t of dbTools) {
      if (!Array.isArray(t.inputs_schema) || t.inputs_schema.length === 0) {
        console.warn(`  ⚠️  ${t.name}: inputs_schema invalid`);
        schemaIssues++;
      }
    }
    if (schemaIssues === 0) console.log("  ✅ All inputs_schema valid");
  }

  console.log("\n🎉 Done! Next step: review tools in /admin/tools-manage, then set is_active=true");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
