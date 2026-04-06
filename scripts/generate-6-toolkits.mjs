/**
 * scripts/generate-6-toolkits.mjs
 *
 * Step 1: Create 6 new toolkits in DB
 * Step 2: Generate 60 tools via OpenAI GPT-4o (10 per toolkit)
 * Step 3: Upsert to tools table
 * Step 4: Full validation report + generation test
 *
 * Run: node scripts/generate-6-toolkits.mjs
 */

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { readFileSync } from "fs";

// ── Load env ──────────────────────────────────────────────────────────────
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf-8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

// ── Toolkit definitions ───────────────────────────────────────────────────
const TOOLKITS = [
  {
    name: "Customer Support Toolkit",
    slug: "customer-support",
    description: "AI tools to handle customer inquiries, complaints, and support communications professionally and efficiently.",
    icon: "🎧",
    price_monthly: 19,
    sort_order: 10,
    tools: [
      { name: "Customer Complaint Response Generator", slug: "customer-complaint-response-generator" },
      { name: "FAQ Article Generator",                  slug: "faq-article-generator" },
      { name: "Refund & Cancellation Email Writer",     slug: "refund-cancellation-email-writer" },
      { name: "Live Chat Script Builder",               slug: "live-chat-script-builder" },
      { name: "Customer Onboarding Email Sequence",     slug: "customer-onboarding-email-sequence" },
      { name: "Support Ticket Response Templates",      slug: "support-ticket-response-templates" },
      { name: "Product Return Policy Generator",        slug: "product-return-policy-generator" },
      { name: "Customer Satisfaction Survey Creator",   slug: "customer-satisfaction-survey-creator" },
      { name: "Escalation Email Writer",                slug: "escalation-email-writer" },
      { name: "Customer Success Check-in Email",        slug: "customer-success-check-in-email" },
    ],
  },
  {
    name: "HR & Hiring Toolkit",
    slug: "hr-hiring",
    description: "AI tools for job descriptions, interview questions, offer letters, and employee documentation.",
    icon: "👥",
    price_monthly: 19,
    sort_order: 11,
    tools: [
      { name: "Job Description Generator",          slug: "job-description-generator" },
      { name: "Interview Question Bank Creator",    slug: "interview-question-bank-creator" },
      { name: "Offer Letter Generator",             slug: "offer-letter-generator" },
      { name: "Employee Performance Review Writer", slug: "employee-performance-review-writer" },
      { name: "Onboarding Checklist Generator",     slug: "onboarding-checklist-generator" },
      { name: "HR Policy Document Generator",       slug: "hr-policy-document-generator" },
      { name: "Termination Letter Writer",          slug: "termination-letter-writer" },
      { name: "360 Feedback Request Email",         slug: "360-feedback-request-email" },
      { name: "Job Posting Ad Copy Generator",      slug: "job-posting-ad-copy-generator" },
      { name: "Employee Handbook Section Writer",   slug: "employee-handbook-section-writer" },
    ],
  },
  {
    name: "Email Marketing Toolkit",
    slug: "email-marketing",
    description: "AI tools for email sequences, subject lines, newsletters, and cold outreach campaigns.",
    icon: "📧",
    price_monthly: 19,
    sort_order: 12,
    tools: [
      { name: "Email Subject Line Generator",         slug: "email-subject-line-generator" },
      { name: "Welcome Email Sequence Writer",        slug: "welcome-email-sequence-writer" },
      { name: "Cold Outreach Email Generator",        slug: "cold-outreach-email-generator" },
      { name: "Newsletter Content Generator",         slug: "newsletter-content-generator" },
      { name: "Re-engagement Email Campaign Writer",  slug: "re-engagement-email-campaign-writer" },
      { name: "Product Launch Email Sequence",        slug: "product-launch-email-sequence" },
      { name: "Cart Abandonment Email Writer",        slug: "cart-abandonment-email-writer" },
      { name: "Email A/B Test Copy Generator",        slug: "email-ab-test-copy-generator" },
      { name: "Unsubscribe Winback Email Writer",     slug: "unsubscribe-winback-email-writer" },
      { name: "Event Invitation Email Generator",     slug: "event-invitation-email-generator" },
    ],
  },
  {
    name: "Meeting Toolkit",
    slug: "meeting",
    description: "AI tools to prepare agendas, summarize meetings, generate action items, and write weekly reports.",
    icon: "📅",
    price_monthly: 19,
    sort_order: 13,
    tools: [
      { name: "Meeting Agenda Generator",           slug: "meeting-agenda-generator" },
      { name: "Meeting Summary & Minutes Writer",   slug: "meeting-summary-minutes-writer" },
      { name: "Action Items Tracker Email",         slug: "action-items-tracker-email" },
      { name: "Weekly Status Report Generator",     slug: "weekly-status-report-generator" },
      { name: "Project Kickoff Agenda Builder",     slug: "project-kickoff-agenda-builder" },
      { name: "One-on-One Meeting Template",        slug: "one-on-one-meeting-template" },
      { name: "Board Meeting Presentation Outline", slug: "board-meeting-presentation-outline" },
      { name: "Team Retrospective Facilitator",     slug: "team-retrospective-facilitator" },
      { name: "Decision Log Document Generator",    slug: "decision-log-document-generator" },
      { name: "Meeting Follow-up Email Writer",     slug: "meeting-follow-up-email-writer" },
    ],
  },
  {
    name: "Note & Knowledge Toolkit",
    slug: "knowledge",
    description: "AI tools to create SOPs, knowledge base articles, Wiki content, and internal documentation.",
    icon: "📚",
    price_monthly: 19,
    sort_order: 14,
    tools: [
      { name: "SOP Document Generator",                  slug: "sop-document-generator" },
      { name: "Knowledge Base Article Writer",           slug: "knowledge-base-article-writer" },
      { name: "Internal Wiki Page Creator",              slug: "internal-wiki-page-creator" },
      { name: "Process Documentation Builder",           slug: "process-documentation-builder" },
      { name: "Training Manual Generator",               slug: "training-manual-generator" },
      { name: "Technical Specification Writer",          slug: "technical-specification-writer" },
      { name: "Runbook Generator",                       slug: "runbook-generator" },
      { name: "Incident Post-Mortem Report",             slug: "incident-post-mortem-report" },
      { name: "Product Requirements Document Writer",    slug: "product-requirements-document-writer" },
      { name: "Team Onboarding Guide Creator",           slug: "team-onboarding-guide-creator" },
    ],
  },
  {
    name: "SEO & Content Toolkit",
    slug: "seo-content",
    description: "AI tools for SEO-optimized articles, meta descriptions, keyword research briefs, and content strategies.",
    icon: "🔍",
    price_monthly: 19,
    sort_order: 15,
    tools: [
      { name: "SEO Blog Post Outline Generator",         slug: "seo-blog-post-outline-generator" },
      { name: "Meta Title & Description Writer",         slug: "meta-title-description-writer" },
      { name: "Keyword Research Brief Creator",          slug: "keyword-research-brief-creator" },
      { name: "Content Pillar Strategy Generator",       slug: "content-pillar-strategy-generator" },
      { name: "SEO Product Description Writer",          slug: "seo-product-description-writer" },
      { name: "Internal Linking Strategy Builder",       slug: "internal-linking-strategy-builder" },
      { name: "Featured Snippet Optimizer",              slug: "featured-snippet-optimizer" },
      { name: "Content Gap Analysis Report",             slug: "content-gap-analysis-report" },
      { name: "Local SEO Page Generator",                slug: "local-seo-page-generator" },
      { name: "SEO Content Brief for Writers",           slug: "seo-content-brief-for-writers" },
    ],
  },
];

// ── Generate tool fields via OpenAI ──────────────────────────────────────
async function generateToolBatch(toolkit, tools) {
  const toolList = tools
    .map((t, i) => `${i + 1}. ${t.name} (slug: "${t.slug}")`)
    .join("\n");

  const prompt = `You are a product designer building an AI SaaS platform called "AI Tools Station".

Toolkit: "${toolkit.name}"
Toolkit description: ${toolkit.description}

Generate detailed configurations for these 10 tools:
${toolList}

For EACH tool, produce the following fields:
- description: 3-4 professional sentences. What problem it solves, who it's for, core value.
- inputs_schema: 3-5 input fields as JSON array. Each: {"name":"snake_case","label":"Display Label","type":"text|textarea|select","placeholder":"concrete example text","required":true}
  * At least one textarea for main input
  * Use "select" only if there are 3-5 clear fixed options; add "options":["opt1","opt2","opt3"]
- prompt_template: Minimum 200 words. Must start with:
  "You are an expert [role]..."
  Include clear output structure with ## headings.
  CRITICAL: Reference ALL input fields using single-brace syntax: {field_name}
  (not {{field_name}}, not [field_name] — exactly {field_name})
- seo_title: Max 60 chars, includes main keyword
- seo_description: 120-160 chars, clear value proposition

Return ONLY valid JSON in this exact structure (top-level object with "tools" array):
{
  "tools": [
    {
      "slug": "exact-slug-from-list",
      "description": "...",
      "inputs_schema": [...],
      "prompt_template": "...",
      "seo_title": "...",
      "seo_description": "..."
    }
  ]
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 12000,
    temperature: 0.6,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You are a product designer. Return only valid JSON with a top-level 'tools' array of exactly 10 objects." },
      { role: "user", content: prompt },
    ],
  });

  const raw = completion.choices[0].message.content ?? "{}";
  const parsed = JSON.parse(raw);
  return parsed.tools ?? [];
}

// ── Validate placeholder presence ────────────────────────────────────────
function validatePlaceholders(tool, generatedData) {
  const fields = (generatedData.inputs_schema ?? []).map((f) => f.name);
  const missing = fields.filter((f) => !generatedData.prompt_template?.includes(`{${f}}`));
  return { ok: missing.length === 0, missing };
}

// ── Test tool generation ──────────────────────────────────────────────────
async function testToolGeneration(toolName, generatedData) {
  try {
    const fields = generatedData.inputs_schema ?? [];
    if (!fields.length || !generatedData.prompt_template) return { ok: false, words: 0, error: "no inputs or template" };

    // Build test inputs from placeholders
    const testInputs = {};
    for (const f of fields) {
      testInputs[f.name] = f.placeholder || `sample ${f.label.toLowerCase()}`;
    }

    // Substitute {field_name} → test value
    let prompt = generatedData.prompt_template;
    for (const [k, v] of Object.entries(testInputs)) {
      prompt = prompt.replace(new RegExp(`\\{${k}\\}`, "g"), v);
    }
    // Trim to avoid huge token usage
    prompt = prompt.slice(0, 3000);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 500,
      temperature: 0.5,
      messages: [{ role: "user", content: prompt }],
    });

    const output = completion.choices[0].message.content ?? "";
    const words = output.split(/\s+/).filter(Boolean).length;
    return { ok: words >= 50, words };
  } catch (err) {
    return { ok: false, words: 0, error: err.message };
  }
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log("🚀 Starting 6-toolkit generation pipeline...\n");

  // Step 1: Check existing slugs
  const { data: existingTools } = await supabase.from("tools").select("slug, name");
  const existingSlugs = new Set((existingTools ?? []).map((t) => t.slug));
  console.log(`📋 Existing tools: ${existingSlugs.size}`);

  // Step 2: Create toolkits
  console.log("\n📦 Step 1: Creating 6 toolkits...");
  for (const tk of TOOLKITS) {
    const { error } = await supabase.from("toolkits").upsert(
      {
        name: tk.name,
        slug: tk.slug,
        description: tk.description,
        icon: tk.icon,
        price_monthly: tk.price_monthly,
        sort_order: tk.sort_order,
        is_active: true,
      },
      { onConflict: "slug", ignoreDuplicates: false }
    );
    console.log(`  ${error ? "❌" : "✅"} ${tk.name}${error ? " — " + error.message : ""}`);
  }

  // Fetch toolkit IDs
  const { data: toolkitRows } = await supabase
    .from("toolkits")
    .select("id, slug")
    .in("slug", TOOLKITS.map((t) => t.slug));

  const toolkitIdMap = new Map((toolkitRows ?? []).map((r) => [r.slug, r.id]));

  // Step 3: Generate and insert tools
  console.log("\n🔧 Step 2-3: Generating and inserting 60 tools...");
  const allResults = [];

  for (const toolkit of TOOLKITS) {
    const tkId = toolkitIdMap.get(toolkit.slug);
    if (!tkId) {
      console.error(`  ❌ No toolkit ID for ${toolkit.slug}`);
      continue;
    }

    console.log(`\n  → ${toolkit.name}`);

    // Filter out tools that already exist
    const newTools = toolkit.tools.filter((t) => !existingSlugs.has(t.slug));
    const skipped = toolkit.tools.filter((t) => existingSlugs.has(t.slug));
    if (skipped.length) console.log(`    ⚠️  Skipping ${skipped.length} existing: ${skipped.map((t) => t.slug).join(", ")}`);

    if (!newTools.length) { console.log("    ⚠️  All tools already exist, skipping"); continue; }

    // Generate
    let generated;
    try {
      generated = await generateToolBatch(toolkit, newTools);
      console.log(`    ✅ GPT-4o returned ${generated.length} tools`);
    } catch (err) {
      console.error(`    ❌ Generation failed: ${err.message}`);
      for (const t of newTools) allResults.push({ toolkit: toolkit.name, name: t.name, slug: t.slug, status: "gen_failed" });
      continue;
    }

    // Build slug → generated data map
    const genMap = new Map(generated.map((g) => [g.slug, g]));

    for (let i = 0; i < newTools.length; i++) {
      const toolDef = newTools[i];
      const gen = genMap.get(toolDef.slug) ?? generated[i]; // fallback by position
      if (!gen) {
        allResults.push({ toolkit: toolkit.name, name: toolDef.name, slug: toolDef.slug, status: "no_data" });
        continue;
      }

      const { ok: phOk, missing } = validatePlaceholders(toolDef, gen);

      // If placeholders missing, inject them forcefully
      let finalTemplate = gen.prompt_template ?? "";
      if (!phOk && gen.inputs_schema?.length) {
        const injections = (gen.inputs_schema ?? [])
          .filter((f) => !finalTemplate.includes(`{${f.name}}`))
          .map((f) => `\n\nUser provided ${f.label}: {${f.name}}`);
        finalTemplate += injections.join("");
      }

      const { error: upsertErr } = await supabase.from("tools").upsert(
        {
          toolkit_id: tkId,
          slug: toolDef.slug,
          name: toolDef.name,
          description: gen.description ?? null,
          tool_type: "template",
          inputs_schema: gen.inputs_schema ?? null,
          prompt_template: finalTemplate || null,
          output_format: "markdown",
          seo_title: gen.seo_title ?? null,
          seo_description: gen.seo_description ?? null,
          auto_generated: true,
          is_active: false,
          sort_order: i + 1,
        },
        { onConflict: "slug", ignoreDuplicates: false }
      );

      allResults.push({
        toolkit: toolkit.name,
        name: toolDef.name,
        slug: toolDef.slug,
        dbOk: !upsertErr,
        schemaOk: Array.isArray(gen.inputs_schema) && gen.inputs_schema.length >= 2,
        promptOk: !!(finalTemplate && finalTemplate.length > 100),
        phOk: phOk || !missing.length,
        dbError: upsertErr?.message,
        genData: gen,
      });

      process.stdout.write(`    ${upsertErr ? "❌" : "✅"} ${toolDef.name}\n`);
    }
  }

  // Step 4: Generation tests (1 tool per toolkit)
  console.log("\n🧪 Step 4: Running generation tests (1 per toolkit)...");
  const testResults = [];
  for (const toolkit of TOOLKITS) {
    const firstTool = allResults.find((r) => r.toolkit === toolkit.name && r.dbOk && r.genData);
    if (!firstTool) { testResults.push({ toolkit: toolkit.name, ok: false, words: 0, error: "no valid tool found" }); continue; }
    process.stdout.write(`  Testing: ${firstTool.name}... `);
    const test = await testToolGeneration(firstTool.name, firstTool.genData);
    testResults.push({ toolkit: toolkit.name, toolName: firstTool.name, ...test });
    console.log(test.ok ? `✅ ${test.words} words` : `❌ ${test.error ?? test.words + " words"}`);
  }

  // Step 4: Validation report
  console.log("\n\n" + "═".repeat(90));
  console.log("📊 VALIDATION REPORT");
  console.log("═".repeat(90));
  console.log(
    "Toolkit".padEnd(26) +
    "Tool Name".padEnd(38) +
    "DB".padEnd(5) +
    "Schema".padEnd(8) +
    "Prompt".padEnd(8) +
    "Placeholder"
  );
  console.log("─".repeat(90));

  let totalOk = 0;
  let totalTools = 0;
  for (const r of allResults) {
    if (r.status) { console.log(`[${r.toolkit.slice(0,14)}] ${r.name.slice(0,34).padEnd(38)} ❌ (${r.status})`); continue; }
    totalTools++;
    const db = r.dbOk ? "✅" : "❌";
    const sc = r.schemaOk ? "✅" : "❌";
    const pr = r.promptOk ? "✅" : "❌";
    const ph = r.phOk ? "✅" : "⚠️ ";
    if (r.dbOk && r.schemaOk && r.promptOk) totalOk++;
    console.log(
      r.toolkit.slice(0, 25).padEnd(26) +
      r.name.slice(0, 37).padEnd(38) +
      db.padEnd(5) + sc.padEnd(8) + pr.padEnd(8) + ph
    );
  }

  console.log("─".repeat(90));
  console.log(`\n✅ ${totalOk}/${totalTools} tools: DB + Schema + Prompt all OK`);

  console.log("\n📈 Generation Test Summary:");
  console.log("─".repeat(50));
  for (const t of testResults) {
    console.log(`  ${t.ok ? "✅" : "❌"} ${t.toolkit.padEnd(28)} ${t.toolName ?? "—"} (${t.words} words)`);
  }

  // Step 4.2: Duplicate check
  console.log("\n🔍 Duplicate name check...");
  const { data: dupes } = await supabase.rpc
    ? await supabase.from("tools").select("name").then(async ({ data }) => {
        const counts = {};
        for (const t of data ?? []) counts[t.name] = (counts[t.name] ?? 0) + 1;
        const dups = Object.entries(counts).filter(([, c]) => c > 1).map(([n]) => n);
        return { data: dups };
      })
    : { data: [] };

  if ((dupes ?? []).length === 0) console.log("  ✅ No duplicate names found");
  else console.log("  ⚠️  Duplicates:", dupes.join(", "));

  // DB summary by toolkit
  console.log("\n📊 DB summary per toolkit:");
  const slugsToCheck = TOOLKITS.map((t) => t.slug);
  const { data: tkStats } = await supabase
    .from("toolkits")
    .select("name, slug, id")
    .in("slug", slugsToCheck);

  for (const tk of tkStats ?? []) {
    const { count } = await supabase
      .from("tools")
      .select("*", { count: "exact", head: true })
      .eq("toolkit_id", tk.id)
      .eq("auto_generated", true);
    console.log(`  ${tk.name.padEnd(30)} ${count} tools`);
  }

  console.log("\n🎉 Done! Review in /admin/tools-manage, then activate with 'On' toggle.");
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
