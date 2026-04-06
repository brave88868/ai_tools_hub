/**
 * scripts/generate-6-new-toolkits.mjs
 *
 * 1. Upserts 6 new toolkits into the DB
 * 2. Generates 20 high-quality tools per toolkit via GPT-4o
 * 3. Upserts tools (is_active = true)
 * 4. Full validation report
 *
 * Run: node scripts/generate-6-new-toolkits.mjs
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
    slug: "data-analytics",
    name: "Data & Analytics Toolkit",
    description: "AI tools for data analysis, SQL generation, chart interpretation, and business intelligence reporting.",
    icon: "📊",
    price_monthly: 19,
    sort_order: 20,
    context: "Data analysis, SQL query generation, Python/R scripting, Excel formulas, KPI dashboards, A/B testing, data cleaning, funnel analysis, cohort analysis, and business metrics interpretation",
    tools: [
      { name: "SQL Query Generator",                  slug: "sql-query-generator" },
      { name: "Python Analysis Script Generator",     slug: "python-analysis-script-generator" },
      { name: "Excel Formula Generator",              slug: "excel-formula-generator" },
      { name: "R Script Generator",                   slug: "r-script-generator" },
      { name: "Data Pipeline Planner",                slug: "data-pipeline-planner" },
      { name: "KPI Dashboard Template Generator",     slug: "kpi-dashboard-template-generator" },
      { name: "A/B Test Design Generator",            slug: "ab-test-design-generator" },
      { name: "Data Dictionary Generator",            slug: "data-dictionary-generator" },
      { name: "Data Analysis Assistant",              slug: "data-analysis-assistant" },
      { name: "Dashboard Summary Generator",          slug: "dashboard-summary-generator" },
      { name: "CSV Data Insights Analyzer",           slug: "csv-data-insights" },
      { name: "Business Metrics Interpreter",         slug: "business-metrics-interpreter" },
      { name: "Chart Description Generator",          slug: "chart-description-generator" },
      { name: "Data Cleaning Guide Generator",        slug: "data-cleaning-guide" },
      { name: "Survey Results Analyzer",              slug: "survey-results-analyzer" },
      { name: "Funnel Analysis Report Generator",     slug: "funnel-analysis-report" },
      { name: "Cohort Analysis Template Generator",   slug: "cohort-analysis-template" },
      { name: "Executive Summary from Data",          slug: "executive-summary-from-data" },
      { name: "Data Storytelling Generator",          slug: "data-storytelling-generator" },
      { name: "Anomaly Explanation Generator",        slug: "anomaly-explanation-generator" },
    ],
  },
  {
    slug: "sales",
    name: "Sales Toolkit",
    description: "AI tools for sales scripts, outreach sequences, proposals, objection handling, and deal closing.",
    icon: "💼",
    price_monthly: 19,
    sort_order: 21,
    context: "B2B and B2C sales, cold outreach, sales scripts, objection handling, proposals, CRM notes, lead qualification, competitive analysis, upselling, deal risk assessment, and sales strategy",
    tools: [
      { name: "Cold Email Sequence Generator",         slug: "cold-email-sequence-generator" },
      { name: "Sales Call Script Generator",           slug: "sales-script-generator" },
      { name: "Sales Objection Response Generator",    slug: "sales-objection-response-generator" },
      { name: "Sales Proposal Generator",              slug: "sales-proposal-generator" },
      { name: "Follow-Up Email Generator",             slug: "follow-up-email-generator" },
      { name: "Product Demo Script Generator",         slug: "demo-script-generator" },
      { name: "LinkedIn Outreach Message Generator",   slug: "linkedin-outreach-message-generator" },
      { name: "Sales Deck Outline Generator",          slug: "sales-deck-outline-generator" },
      { name: "Win/Loss Analysis Generator",           slug: "win-loss-analysis-generator" },
      { name: "Sales Battle Card Generator",           slug: "sales-battle-card-generator" },
      { name: "Upsell & Cross-Sell Script Generator",  slug: "upsell-cross-sell-script-generator" },
      { name: "Referral Request Email Generator",      slug: "referral-request-email-generator" },
      { name: "Pricing Proposal Generator",            slug: "pricing-proposal-generator" },
      { name: "Sales One-Pager Generator",             slug: "sales-one-pager-generator" },
      { name: "Lead Qualification Analyzer",           slug: "lead-qualification-analyzer" },
      { name: "CRM Notes Summarizer",                  slug: "crm-notes-summarizer" },
      { name: "Sales Call Debrief Analyzer",           slug: "sales-call-debrief-analyzer" },
      { name: "Competitor Analysis for Sales",         slug: "competitor-analysis-for-sales" },
      { name: "Deal Risk Assessor",                    slug: "deal-risk-assessor" },
      { name: "Ideal Customer Profile Generator",      slug: "icp-profile-generator" },
    ],
  },
  {
    slug: "social-media",
    name: "Social Media Toolkit",
    description: "AI tools for social media content, captions, threads, campaigns, and platform-specific growth strategies.",
    icon: "📱",
    price_monthly: 9,
    sort_order: 22,
    context: "Content creation for Twitter/X, LinkedIn, TikTok, Instagram, Facebook, YouTube Shorts, Pinterest, Reddit; hashtag strategy, social media calendars, campaign planning, viral hooks, brand storytelling, and crisis communications",
    tools: [
      { name: "Twitter/X Thread Generator",             slug: "twitter-thread-generator" },
      { name: "LinkedIn Post Generator",                slug: "linkedin-post-generator" },
      { name: "TikTok Video Script Generator",          slug: "tiktok-script-generator" },
      { name: "YouTube Shorts Script Generator",        slug: "youtube-short-script-generator" },
      { name: "Instagram Caption Generator",            slug: "instagram-caption-generator" },
      { name: "Hashtag Strategy Generator",             slug: "hashtag-strategy-generator" },
      { name: "Social Media Content Calendar Generator",slug: "social-media-content-calendar" },
      { name: "Facebook Post Generator",                slug: "facebook-post-generator" },
      { name: "Pinterest Description Generator",        slug: "pinterest-description-generator" },
      { name: "Reddit Post Generator",                  slug: "reddit-post-generator" },
      { name: "Social Media Bio Generator",             slug: "social-media-bio-generator" },
      { name: "Viral Hook Generator",                   slug: "viral-hook-generator" },
      { name: "Social Media Campaign Planner",          slug: "social-media-campaign-planner" },
      { name: "Engagement Response Generator",          slug: "engagement-response-generator" },
      { name: "Brand Story Generator",                  slug: "brand-story-generator" },
      { name: "Social Media Ad Copy Generator",         slug: "social-media-ad-copy-generator" },
      { name: "Community Post Generator",               slug: "community-post-generator" },
      { name: "Social Proof Caption Generator",         slug: "social-proof-caption-generator" },
      { name: "Product Launch Post Generator",          slug: "product-launch-post-generator" },
      { name: "Crisis Response Message Generator",      slug: "social-media-crisis-response-generator" },
    ],
  },
  {
    slug: "document",
    name: "Document Toolkit",
    description: "AI tools for professional document creation, rewriting, summarization, and analysis.",
    icon: "📄",
    price_monthly: 19,
    sort_order: 23,
    context: "Document creation, report writing, policy documents, SOPs, executive briefs, business cases, white papers, meeting minutes, contracts, document summarization, translation, gap analysis, and readability improvement",
    tools: [
      { name: "Document Optimizer",                    slug: "document-optimizer" },
      { name: "Report Rewriter & Enhancer",             slug: "report-rewriter" },
      { name: "Policy Document Optimizer",              slug: "policy-document-optimizer" },
      { name: "SOP Rewriter",                           slug: "sop-rewriter" },
      { name: "Report Generator",                       slug: "report-generator" },
      { name: "Policy Document Generator",              slug: "policy-generator" },
      { name: "Standard Operating Procedure Generator", slug: "sop-generator" },
      { name: "Meeting Minutes Generator",              slug: "meeting-minutes-generator" },
      { name: "Executive Brief Generator",              slug: "executive-brief-generator" },
      { name: "Project Proposal Generator",             slug: "project-proposal-generator" },
      { name: "Business Case Generator",                slug: "business-case-generator" },
      { name: "White Paper Outline Generator",          slug: "white-paper-outline-generator" },
      { name: "Internal Memo Generator",                slug: "internal-memo-generator" },
      { name: "Document Translator",                    slug: "document-translator" },
      { name: "Document Summarizer",                    slug: "document-summarizer" },
      { name: "Contract Summary Generator",             slug: "contract-summary-generator" },
      { name: "Meeting Summary to Report",              slug: "meeting-summary-to-report" },
      { name: "Document Key Points Extractor",          slug: "document-key-points-extractor" },
      { name: "Document Gap Analyzer",                  slug: "document-gap-analyzer" },
      { name: "Document Readability Analyzer",          slug: "readability-analyzer" },
    ],
  },
  {
    slug: "productivity",
    name: "Productivity Toolkit",
    description: "AI tools for task planning, goal setting, scheduling, and personal productivity systems.",
    icon: "⚡",
    price_monthly: 9,
    sort_order: 24,
    context: "Task planning, daily scheduling, goal-setting, habit tracking, OKRs, priority matrices, project timelines, delegation, focus blocks, retrospectives, standups, work breakdown structures, decision matrices, quarterly reviews, and onboarding plans",
    tools: [
      { name: "Smart Task Planner",                     slug: "task-planner" },
      { name: "Daily Schedule Generator",               slug: "daily-schedule-generator" },
      { name: "Weekly Planner",                         slug: "weekly-planner" },
      { name: "Goal Breakdown Planner",                 slug: "goal-breakdown-planner" },
      { name: "Habit Tracker Planner",                  slug: "habit-tracker-planner" },
      { name: "Priority Matrix Generator",              slug: "priority-matrix-generator" },
      { name: "Project Timeline Generator",             slug: "project-timeline-generator" },
      { name: "OKR Generator",                          slug: "okr-generator" },
      { name: "Meeting Agenda Generator",               slug: "meeting-agenda-generator-prod" },
      { name: "Delegation Plan Generator",              slug: "delegation-plan-generator" },
      { name: "Personal Productivity System Designer",  slug: "productivity-system-designer" },
      { name: "Focus Block Planner",                    slug: "focus-block-planner" },
      { name: "Retrospective Template Generator",       slug: "retrospective-template-generator" },
      { name: "Daily Standup Update Generator",         slug: "standup-update-generator" },
      { name: "Work Breakdown Structure Generator",     slug: "work-breakdown-structure-generator" },
      { name: "Decision Matrix Generator",              slug: "decision-matrix-generator" },
      { name: "Energy Management Planner",              slug: "energy-management-planner" },
      { name: "Inbox Zero System Generator",            slug: "inbox-zero-system-generator" },
      { name: "Quarterly Review Template Generator",    slug: "quarterly-review-template" },
      { name: "90-Day Onboarding Plan Generator",       slug: "90-day-plan-generator" },
    ],
  },
  {
    slug: "ai-prompts",
    name: "AI Prompts Toolkit",
    description: "High-quality prompt generators for ChatGPT, Claude, Gemini, Copilot, Perplexity, Llama, Mistral, Grok and more.",
    icon: "🤖",
    price_monthly: 9,
    sort_order: 25,
    context: "Prompt engineering for major AI models: ChatGPT (GPT-4o), Claude (Anthropic), Gemini (Google), Microsoft Copilot, Perplexity AI, Llama (Meta), Mistral AI, Grok (xAI). Includes system prompts, chain-of-thought, few-shot, role-play, image generation prompts (Midjourney/DALL-E/Stable Diffusion), coding prompts, research prompts, and multi-model comparison",
    tools: [
      { name: "ChatGPT Prompt Generator",              slug: "chatgpt-prompt-generator" },
      { name: "Claude Prompt Generator",               slug: "claude-prompt-generator" },
      { name: "Gemini Prompt Generator",               slug: "gemini-prompt-generator" },
      { name: "Microsoft Copilot Prompt Generator",    slug: "copilot-prompt-generator" },
      { name: "Perplexity AI Prompt Generator",        slug: "perplexity-prompt-generator" },
      { name: "AI Prompt Optimizer",                   slug: "ai-prompt-optimizer" },
      { name: "System Prompt Generator",               slug: "system-prompt-generator" },
      { name: "Chain-of-Thought Prompt Generator",     slug: "chain-of-thought-prompt-generator" },
      { name: "Role-Play Prompt Generator",            slug: "role-play-prompt-generator" },
      { name: "Few-Shot Prompt Generator",             slug: "few-shot-prompt-generator" },
      { name: "Image Generation Prompt Generator",     slug: "image-generation-prompt-generator" },
      { name: "AI Research Prompt Generator",          slug: "ai-research-prompt-generator" },
      { name: "AI Coding Prompt Generator",            slug: "ai-coding-prompt-generator" },
      { name: "AI Writing Prompt Generator",           slug: "ai-writing-prompt-generator" },
      { name: "AI Data Analysis Prompt Generator",     slug: "ai-analysis-prompt-generator" },
      { name: "AI Marketing Prompt Generator",         slug: "ai-marketing-prompt-generator" },
      { name: "AI Customer Service Prompt Generator",  slug: "ai-customer-service-prompt-generator" },
      { name: "Prompt Library Organizer",              slug: "prompt-library-organizer" },
      { name: "Prompt Testing Framework Generator",    slug: "prompt-testing-framework-generator" },
      { name: "Multi-Model Comparison Prompt Generator", slug: "multi-model-comparison-prompt-generator" },
    ],
  },
];

// ── Generate tool details via GPT-4o ─────────────────────────────────────
async function generateToolBatch(toolkit, tools) {
  const toolList = tools
    .map((t, i) => `${i + 1}. ${t.name} (slug: "${t.slug}")`)
    .join("\n");

  const isAiPromptsToolkit = toolkit.slug === "ai-prompts";

  const aiPromptsExtra = isAiPromptsToolkit ? `

SPECIAL REQUIREMENT for AI Prompts Toolkit:
- Each tool must explicitly mention which AI model(s) it targets in the description
- The prompt_template must generate prompts that are optimized for the specific model's strengths
- For model-specific tools (ChatGPT/Claude/Gemini/Copilot/Perplexity), reference the model's unique capabilities
- For general prompt tools (optimizer, system prompts, chain-of-thought), support all major models
- Image generation prompts should support Midjourney, DALL-E 3, and Stable Diffusion XL
` : "";

  const prompt = `You are a product designer building an AI SaaS platform called "AI Tools Station".

Toolkit: "${toolkit.name}"
Toolkit description: ${toolkit.description}
Toolkit context: ${toolkit.context}
${aiPromptsExtra}
Generate detailed, production-ready configurations for these 20 tools:
${toolList}

For EACH tool, produce:
- description: 3-4 professional sentences. Who it helps, what problem it solves, key output delivered.
- inputs_schema: 2-4 input fields as JSON array.
  * Exactly ONE "textarea" for the main input (the primary content/data field)
  * Additional "text" or "select" fields for context/parameters
  * Use "select" ONLY when there are 3-6 fixed options, add "options":["opt1","opt2",...]
  * Field names MUST be snake_case
  * Every field needs: name, label, type, placeholder (concrete example), required
- prompt_template: Minimum 200 words. Must follow this structure:
  "You are an expert [specific role] with [specific experience]...

  [User inputs labeled clearly]

  STEP 1 — INTERNAL ANALYSIS (do not output):
  [Think through the task]

  ## [Output Section 1]
  [structured output with ## headings]

  ## [Output Section 2]
  [etc]"

  CRITICAL: Reference ALL input fields using SINGLE braces: {field_name}
  (NOT {{field_name}}, NOT [field_name] — exactly {field_name})
  Produce structured output with clear ## headings.
  Minimum 200 words in the template.
- seo_title: Max 60 chars, includes main keyword
- seo_description: 120-160 chars, clear value proposition

Return ONLY valid JSON with this exact top-level structure:
{
  "tools": [
    {
      "name": "...",
      "slug": "...",
      "description": "...",
      "inputs_schema": [...],
      "prompt_template": "...",
      "seo_title": "...",
      "seo_description": "..."
    }
  ]
}

Generate all 20 tools. Do not skip any.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 16000,
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "You are a product designer. Return only valid JSON with a top-level 'tools' array containing exactly 20 tool objects. Do not skip any tool.",
      },
      { role: "user", content: prompt },
    ],
  });

  const raw = completion.choices[0].message.content ?? "{}";
  const parsed = JSON.parse(raw);
  return parsed.tools ?? [];
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log("🚀 Generating 6 new toolkits × 20 tools = 120 tools\n");

  // Step 1: Upsert toolkits
  console.log("📦 Step 1: Upserting toolkits...");
  const toolkitInserts = TOOLKITS.map((t) => ({
    slug: t.slug,
    name: t.name,
    description: t.description,
    price_monthly: t.price_monthly,
    icon: t.icon,
    is_active: false,
    sort_order: t.sort_order,
  }));

  const { error: tkErr } = await supabase
    .from("toolkits")
    .upsert(toolkitInserts, { onConflict: "slug", ignoreDuplicates: false });

  if (tkErr) {
    console.error("❌ Failed to upsert toolkits:", tkErr.message);
    process.exit(1);
  }
  console.log(`  ✅ ${TOOLKITS.length} toolkits upserted\n`);

  // Step 2: Fetch toolkit IDs
  const slugs = TOOLKITS.map((t) => t.slug);
  const { data: toolkitRows, error: fetchErr } = await supabase
    .from("toolkits")
    .select("id, slug")
    .in("slug", slugs);

  if (fetchErr || !toolkitRows) {
    console.error("❌ Failed to fetch toolkit IDs:", fetchErr?.message);
    process.exit(1);
  }

  const toolkitMap = new Map(toolkitRows.map((r) => [r.slug, r.id]));

  // Step 3: Generate + upsert tools for each toolkit
  const allResults = [];

  for (const toolkit of TOOLKITS) {
    const toolkitId = toolkitMap.get(toolkit.slug);
    if (!toolkitId) {
      console.error(`❌ Toolkit ID not found for slug: ${toolkit.slug}`);
      continue;
    }

    console.log(`\n🔧 [${toolkit.slug}] Generating ${toolkit.tools.length} tools via GPT-4o...`);

    let generatedTools;
    try {
      generatedTools = await generateToolBatch(toolkit, toolkit.tools);
      console.log(`  ✅ GPT-4o returned ${generatedTools.length} tools`);
    } catch (err) {
      console.error(`  ❌ GPT-4o failed: ${err.message}`);
      allResults.push(...toolkit.tools.map((t) => ({ toolkit: toolkit.slug, name: t.name, status: "generation_failed" })));
      continue;
    }

    // Merge generated data with our predefined slugs/names
    const toolMap = new Map(toolkit.tools.map((t) => [t.slug, t]));

    for (let i = 0; i < toolkit.tools.length; i++) {
      const predefined = toolkit.tools[i];
      // Find matching generated tool by slug or position
      const generated = generatedTools.find((g) => g.slug === predefined.slug)
        ?? generatedTools[i]
        ?? {};

      const result = { toolkit: toolkit.slug, name: predefined.name, slug: predefined.slug };

      // Validate inputs_schema
      let schemaValid = false;
      try {
        const schema = generated.inputs_schema;
        if (!Array.isArray(schema) || schema.length === 0) throw new Error("empty schema");
        for (const f of schema) {
          if (!f.name || !f.label || !f.type) throw new Error(`invalid field: ${JSON.stringify(f)}`);
        }
        schemaValid = true;
      } catch (e) {
        result.schemaError = e.message;
      }

      // Validate prompt has placeholders
      const hasPlaceholders = (generated.inputs_schema ?? []).some(
        (f) => (generated.prompt_template ?? "").includes(`{${f.name}}`)
      );

      const upsertPayload = {
        toolkit_id: toolkitId,
        slug: predefined.slug,
        name: predefined.name,
        description: generated.description ?? `AI-powered ${predefined.name}`,
        tool_type: "template",
        inputs_schema: generated.inputs_schema ?? [
          { name: "input", label: "Your Input", type: "textarea", placeholder: "Describe your request...", required: true }
        ],
        prompt_template: generated.prompt_template ?? `You are an expert assistant. Help with: {input}`,
        output_format: "markdown",
        seo_title: generated.seo_title ?? null,
        seo_description: generated.seo_description ?? null,
        auto_generated: true,
        is_active: true,
        sort_order: i + 1,
      };

      const { error: upsertErr } = await supabase
        .from("tools")
        .upsert(upsertPayload, { onConflict: "slug", ignoreDuplicates: false });

      result.dbOk = !upsertErr;
      result.schemaOk = schemaValid;
      result.hasPlaceholders = hasPlaceholders;
      if (upsertErr) result.dbError = upsertErr.message;

      allResults.push(result);
      process.stdout.write(`  ${upsertErr ? "❌" : "✅"} [${i + 1}/20] ${predefined.name}\n`);
    }
  }

  // Step 4: Activate toolkits
  console.log("\n\n🟢 Step 4: Activating toolkits...");
  const { error: activateErr } = await supabase
    .from("toolkits")
    .update({ is_active: true })
    .in("slug", slugs);

  if (activateErr) {
    console.warn("  ⚠️  Failed to activate toolkits:", activateErr.message);
  } else {
    console.log("  ✅ All 6 toolkits activated");
  }

  // Step 5: Validation report
  console.log("\n\n📊 VALIDATION REPORT");
  console.log("─".repeat(90));
  console.log(
    "Toolkit".padEnd(18) +
    "Tool Name".padEnd(44) +
    "DB".padEnd(6) +
    "Schema".padEnd(10) +
    "Placeholders"
  );
  console.log("─".repeat(90));

  let totalOk = 0;
  let totalFailed = 0;
  for (const r of allResults) {
    if (r.status === "generation_failed") {
      console.log(`[${r.toolkit}] GENERATION FAILED`.padEnd(62) + "❌ ❌ ❌");
      totalFailed++;
      continue;
    }
    const db = r.dbOk ? "✅" : "❌";
    const schema = r.schemaOk ? "✅" : "⚠️ ";
    const ph = r.hasPlaceholders ? "✅" : "⚠️ ";
    const label = `[${r.toolkit.slice(0, 14)}] ${r.name}`;
    console.log(label.slice(0, 60).padEnd(62) + db.padEnd(6) + schema.padEnd(10) + ph);
    if (r.dbOk) totalOk++;
    else totalFailed++;
  }

  console.log("─".repeat(90));
  console.log(`\n✅ ${totalOk} tools written to DB  |  ❌ ${totalFailed} failed`);
  console.log("\n🎉 Done! Visit /toolkits to see the new toolkits.");
  console.log("💡 Set Stripe Price IDs in .env.local / Vercel to enable checkout for new toolkits.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
