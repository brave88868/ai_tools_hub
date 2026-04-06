/**
 * scripts/add-10-tools-per-toolkit.mjs
 *
 * Adds 10 new high-quality tools to each of 15 existing toolkits.
 * Queries existing slugs/names per toolkit to avoid conflicts.
 * Processes one toolkit at a time; prints results after each.
 *
 * Run: node scripts/add-10-tools-per-toolkit.mjs
 * Run single toolkit: node scripts/add-10-tools-per-toolkit.mjs jobseeker
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

// ─────────────────────────────────────────────────────────────────────────────
// TOOLKIT DEFINITIONS — 15 toolkits × 10 new tools each
// Format: { slug (DB), context, tools: [{name, slug, aClass?}] }
// aClass=true means the tool should produce "compare original vs optimized" output
// ─────────────────────────────────────────────────────────────────────────────
const TOOLKITS = [
  {
    slug: "jobseeker",
    name: "Jobseeker Toolkit",
    context: "Job searching, career development, personal branding, and professional communications for candidates at all levels",
    tools: [
      { name: "Personal Brand Statement Generator",    slug: "personal-brand-statement-generator" },
      { name: "LinkedIn Headline Generator",           slug: "linkedin-headline-generator" },
      { name: "Interview Thank You Email Generator",   slug: "interview-thank-you-email-generator" },
      { name: "Job Rejection Response Generator",      slug: "job-rejection-response-generator" },
      { name: "Career Change Cover Letter Generator",  slug: "career-change-cover-letter-generator" },
      { name: "Executive Resume Writer",               slug: "executive-resume-writer" },
      { name: "Portfolio Description Generator",       slug: "portfolio-description-generator" },
      { name: "Reference Request Email Generator",     slug: "reference-request-email-generator" },
      { name: "Job Offer Negotiation Email Generator", slug: "job-offer-negotiation-email-generator" },
      { name: "Career Gap Explanation Generator",      slug: "career-gap-explanation-generator" },
    ],
  },
  {
    slug: "creator",
    name: "Creator Toolkit",
    context: "Content creation, monetization, audience building, and multi-platform distribution for digital creators",
    tools: [
      { name: "Video Hook Generator",                      slug: "video-hook-generator" },
      { name: "Content Repurposing Planner",               slug: "content-repurposing-planner" },
      { name: "YouTube Channel Description Generator",     slug: "youtube-channel-description-generator" },
      { name: "Sponsorship Pitch Email Generator",         slug: "sponsorship-pitch-email-generator" },
      { name: "Content Series Planner",                    slug: "content-series-planner" },
      { name: "Video Thumbnail Text Generator",            slug: "video-thumbnail-text-generator" },
      { name: "Email Newsletter Subject Line Generator",   slug: "email-newsletter-subject-line-generator" },
      { name: "Blog Post Introduction Generator",          slug: "blog-post-introduction-generator" },
      { name: "Creator Bio Generator",                     slug: "creator-bio-generator" },
      { name: "Content Pillar Strategy Generator",         slug: "content-pillar-strategy-generator" },
    ],
  },
  {
    slug: "marketing",
    name: "Marketing Toolkit",
    context: "Marketing strategy, conversion optimization, customer acquisition, and campaign planning for businesses",
    tools: [
      { name: "Customer Persona Generator",                slug: "customer-persona-generator" },
      { name: "Email Drip Campaign Generator",             slug: "email-drip-campaign-generator" },
      { name: "Social Proof Copy Generator",               slug: "social-proof-copy-generator" },
      { name: "Competitive Positioning Statement Generator", slug: "competitive-positioning-statement-generator" },
      { name: "Marketing Campaign Brief Generator",        slug: "marketing-campaign-brief-generator" },
      { name: "Referral Program Copy Generator",           slug: "referral-program-copy-generator" },
      { name: "Testimonial Request Email Generator",       slug: "testimonial-request-email-generator" },
      { name: "Urgency and Scarcity Copy Generator",       slug: "urgency-scarcity-copy-generator" },
      { name: "Onboarding Email Sequence Generator",       slug: "onboarding-email-sequence-generator" },
      { name: "Case Study Outline Generator",              slug: "case-study-outline-generator" },
    ],
  },
  {
    slug: "business",
    name: "Business Toolkit",
    context: "Business strategy, operations, communications, and organizational management",
    tools: [
      { name: "Executive Summary Generator",               slug: "executive-summary-generator" },
      { name: "Investor Update Email Generator",           slug: "investor-update-email-generator" },
      { name: "Terms and Conditions Generator",            slug: "terms-and-conditions-generator" },
      { name: "Partnership Proposal Generator",            slug: "partnership-proposal-generator" },
      { name: "Job Description Generator",                 slug: "job-description-generator-biz" },
      { name: "Performance Review Template Generator",     slug: "performance-review-template-generator" },
      { name: "Company Values Statement Generator",        slug: "company-values-statement-generator" },
      { name: "Press Release Generator",                   slug: "press-release-generator" },
      { name: "Risk Assessment Report Generator",          slug: "risk-assessment-report-generator" },
      { name: "Competitive Analysis Report Generator",     slug: "competitive-analysis-report-generator" },
    ],
  },
  {
    slug: "legal",
    name: "Legal Toolkit",
    context: "Legal document drafting, compliance, intellectual property, and business law (informational only, not legal advice)",
    disclaimer: true,
    tools: [
      { name: "IP Assignment Agreement Generator",         slug: "ip-assignment-agreement-generator" },
      { name: "Cease and Desist Letter Generator",         slug: "cease-and-desist-letter-generator" },
      { name: "Vendor Agreement Generator",                slug: "vendor-agreement-generator" },
      { name: "Website Disclaimer Generator",              slug: "website-disclaimer-generator" },
      { name: "Software License Agreement Generator",      slug: "software-license-agreement-generator" },
      { name: "Consulting Agreement Generator",            slug: "consulting-agreement-generator" },
      { name: "Liability Waiver Generator",                slug: "liability-waiver-generator" },
      { name: "Legal Demand Letter Generator",             slug: "legal-demand-letter-generator" },
      { name: "Contract Amendment Generator",              slug: "contract-amendment-generator" },
      { name: "Legal Clause Analyzer",                     slug: "legal-clause-analyzer" },
    ],
  },
  {
    slug: "exam",
    name: "Exam Prep Toolkit",
    context: "Academic study, exam preparation, critical thinking, research, and academic writing",
    tools: [
      { name: "Spaced Repetition Schedule Generator",      slug: "spaced-repetition-schedule-generator" },
      { name: "Mind Map Outline Generator",                slug: "mind-map-outline-generator" },
      { name: "Exam Cheat Sheet Generator",                slug: "exam-cheat-sheet-generator" },
      { name: "Critical Thinking Question Generator",      slug: "critical-thinking-question-generator" },
      { name: "Essay Writing Feedback Generator",          slug: "essay-writing-feedback-generator", aClass: true },
      { name: "Research Question Generator",               slug: "research-question-generator" },
      { name: "Study Group Discussion Guide Generator",    slug: "study-group-discussion-guide-generator" },
      { name: "Academic Vocabulary Builder",               slug: "academic-vocabulary-builder" },
      { name: "Argument Analysis Generator",               slug: "argument-analysis-generator" },
      { name: "Literature Review Outline Generator",       slug: "literature-review-outline-generator" },
    ],
  },
  {
    slug: "compliance-toolkit",
    name: "Compliance Toolkit",
    context: "Regulatory compliance, security frameworks (SOC2, ISO27001, GDPR, HIPAA), audit preparation, and risk management",
    disclaimer: true,
    tools: [
      { name: "GDPR Compliance Checklist Generator",       slug: "gdpr-compliance-checklist-generator" },
      { name: "SOC 2 Readiness Assessment Generator",      slug: "soc2-readiness-assessment-generator" },
      { name: "ISO 27001 Gap Analysis Generator",          slug: "iso27001-gap-analysis-generator" },
      { name: "HIPAA Risk Assessment Generator",           slug: "hipaa-risk-assessment-generator" },
      { name: "Privacy Policy Gap Analyzer",               slug: "privacy-policy-gap-analyzer" },
      { name: "Security Awareness Training Script Generator", slug: "security-awareness-training-script-generator" },
      { name: "Data Breach Response Plan Generator",       slug: "data-breach-response-plan-generator" },
      { name: "Third-Party Vendor Compliance Checklist",   slug: "vendor-compliance-checklist-generator" },
      { name: "Compliance Audit Report Generator",         slug: "compliance-audit-report-generator" },
      { name: "Information Security Policy Generator",     slug: "information-security-policy-generator" },
    ],
  },
  {
    slug: "seo-content",
    name: "SEO & Content Toolkit",
    context: "SEO strategy, content optimization, keyword research, technical SEO, and organic traffic growth",
    tools: [
      { name: "Meta Title and Description Optimizer",      slug: "meta-title-description-optimizer", aClass: true },
      { name: "Internal Linking Strategy Generator",       slug: "internal-linking-strategy-generator" },
      { name: "FAQ Schema Generator",                      slug: "faq-schema-generator" },
      { name: "Keyword Cluster Generator",                 slug: "keyword-cluster-generator" },
      { name: "Content Brief Generator",                   slug: "content-brief-generator" },
      { name: "Competitor Content Gap Analyzer",           slug: "competitor-content-gap-analyzer" },
      { name: "Blog Post SEO Optimizer",                   slug: "blog-post-seo-optimizer", aClass: true },
      { name: "Backlink Outreach Email Generator",         slug: "backlink-outreach-email-generator" },
      { name: "SEO Audit Checklist Generator",             slug: "seo-audit-checklist-generator" },
      { name: "Long-Tail Keyword Generator",               slug: "long-tail-keyword-generator" },
    ],
  },
  {
    slug: "knowledge",
    name: "Note & Knowledge Toolkit",
    context: "Knowledge management, note-taking systems, personal productivity, documentation, and second-brain setups",
    tools: [
      { name: "Meeting Notes Optimizer",                   slug: "meeting-notes-optimizer", aClass: true },
      { name: "Research Notes Summarizer",                 slug: "research-notes-summarizer" },
      { name: "Knowledge Base Article Generator",          slug: "knowledge-base-article-generator" },
      { name: "Second Brain Setup Guide Generator",        slug: "second-brain-setup-guide-generator" },
      { name: "Reading Notes to Action Items Converter",   slug: "reading-notes-to-action-items-converter", aClass: true },
      { name: "Personal Wiki Structure Generator",         slug: "personal-wiki-structure-generator" },
      { name: "Book Summary Generator",                    slug: "book-summary-generator" },
      { name: "Idea Expansion Generator",                  slug: "idea-expansion-generator" },
      { name: "Learning Notes Template Generator",         slug: "learning-notes-template-generator" },
      { name: "Project Documentation Generator",           slug: "project-documentation-generator" },
    ],
  },
  {
    slug: "meeting",
    name: "Meeting Toolkit",
    context: "Meeting facilitation, productivity, follow-ups, action items, and organizational communication",
    tools: [
      { name: "Meeting Recap Email Generator",             slug: "meeting-recap-email-generator" },
      { name: "Action Items Tracker Generator",            slug: "action-items-tracker-generator" },
      { name: "One-on-One Meeting Template Generator",     slug: "one-on-one-meeting-template-generator" },
      { name: "Board Meeting Minutes Generator",           slug: "board-meeting-minutes-generator", aClass: true },
      { name: "Workshop Facilitation Guide Generator",     slug: "workshop-facilitation-guide-generator" },
      { name: "Meeting Notes to Project Plan Converter",   slug: "meeting-notes-to-project-plan-converter", aClass: true },
      { name: "Stakeholder Update Email Generator",        slug: "stakeholder-update-email-generator" },
      { name: "Decision Log Template Generator",           slug: "decision-log-template-generator" },
      { name: "Meeting Effectiveness Assessment Generator", slug: "meeting-effectiveness-assessment-generator" },
      { name: "Virtual Meeting Ice-Breaker Generator",     slug: "virtual-meeting-ice-breaker-generator" },
    ],
  },
  {
    slug: "email-marketing",
    name: "Email Marketing Toolkit",
    context: "Email marketing strategy, copywriting, automation sequences, and campaign optimization",
    tools: [
      { name: "Email Subject Line A/B Test Generator",     slug: "email-subject-line-ab-test-generator" },
      { name: "Re-Engagement Email Sequence Generator",    slug: "re-engagement-email-sequence-generator" },
      { name: "Welcome Email Series Generator",            slug: "welcome-email-series-generator" },
      { name: "Cart Abandonment Email Generator",          slug: "cart-abandonment-email-generator" },
      { name: "Post-Purchase Email Sequence Generator",    slug: "post-purchase-email-sequence-generator" },
      { name: "Email List Segmentation Strategy Generator", slug: "email-list-segmentation-strategy-generator" },
      { name: "Promotional Email Generator",               slug: "promotional-email-generator" },
      { name: "Unsubscribe Win-Back Email Generator",      slug: "unsubscribe-win-back-email-generator" },
      { name: "Email Campaign Performance Report Generator", slug: "email-campaign-performance-report-generator" },
      { name: "Email Copywriting Optimizer",               slug: "email-copywriting-optimizer", aClass: true },
    ],
  },
  {
    slug: "hr-hiring",
    name: "HR & Hiring Toolkit",
    context: "Human resources, talent acquisition, employee management, and organizational development",
    tools: [
      { name: "Interview Question Bank Generator",         slug: "interview-question-bank-generator" },
      { name: "Onboarding Checklist Generator",            slug: "onboarding-checklist-generator" },
      { name: "Employee Handbook Section Generator",       slug: "employee-handbook-section-generator" },
      { name: "Performance Improvement Plan Generator",    slug: "performance-improvement-plan-generator" },
      { name: "Salary Benchmark Report Generator",         slug: "salary-benchmark-report-generator" },
      { name: "Exit Interview Questions Generator",        slug: "exit-interview-questions-generator" },
      { name: "Job Posting Optimizer",                     slug: "job-posting-optimizer", aClass: true },
      { name: "Team Culture Assessment Generator",         slug: "team-culture-assessment-generator" },
      { name: "HR Policy Document Generator",              slug: "hr-policy-document-generator" },
      { name: "Employee Recognition Message Generator",    slug: "employee-recognition-message-generator" },
    ],
  },
  {
    slug: "customer-support",
    name: "Customer Support Toolkit",
    context: "Customer service, support operations, retention, and customer success management",
    tools: [
      { name: "Customer Complaint Response Generator",     slug: "customer-complaint-response-generator" },
      { name: "Support Ticket Response Templates Generator", slug: "support-ticket-response-templates-generator" },
      { name: "Customer Success Check-In Email Generator", slug: "customer-success-checkin-email-generator" },
      { name: "Refund and Return Policy Generator",        slug: "refund-return-policy-generator" },
      { name: "Knowledge Base FAQ Generator",              slug: "knowledge-base-faq-generator" },
      { name: "Customer Feedback Response Optimizer",      slug: "customer-feedback-response-optimizer", aClass: true },
      { name: "Escalation Response Script Generator",      slug: "escalation-response-script-generator" },
      { name: "Customer Satisfaction Survey Generator",    slug: "customer-satisfaction-survey-generator" },
      { name: "Churn Risk Assessment Generator",           slug: "churn-risk-assessment-generator" },
      { name: "Support Canned Response Generator",         slug: "support-canned-response-generator" },
    ],
  },
  {
    slug: "workflow-automation-toolkit",
    name: "Workflow Automation Toolkit",
    context: "Business process design, automation planning, workflow optimization, and digital transformation",
    tools: [
      { name: "Process Documentation Generator",          slug: "process-documentation-generator" },
      { name: "Automation Opportunity Identifier",        slug: "automation-opportunity-identifier" },
      { name: "SOP Template Generator",                   slug: "sop-template-generator" },
      { name: "Workflow Diagram Description Generator",   slug: "workflow-diagram-description-generator" },
      { name: "Zapier/Make Automation Recipe Generator",  slug: "automation-recipe-generator" },
      { name: "Business Process Optimization Report Generator", slug: "business-process-optimization-report-generator" },
      { name: "Delegation Matrix Generator",              slug: "delegation-matrix-generator" },
      { name: "Tool Evaluation Template Generator",       slug: "tool-evaluation-template-generator" },
      { name: "Process Bottleneck Analyzer",              slug: "process-bottleneck-analyzer" },
      { name: "Digital Transformation Roadmap Generator", slug: "digital-transformation-roadmap-generator" },
    ],
  },
  {
    slug: "presentation-toolkit",
    name: "Presentation Toolkit",
    context: "Presentation design, public speaking, pitch decks, visual storytelling, and executive communications",
    tools: [
      { name: "Presentation Slide Outline Generator",     slug: "presentation-slide-outline-generator" },
      { name: "Executive Presentation Script Generator",  slug: "executive-presentation-script-generator" },
      { name: "Pitch Deck Storytelling Generator",        slug: "pitch-deck-storytelling-generator" },
      { name: "Presentation Opening Hook Generator",      slug: "presentation-opening-hook-generator" },
      { name: "Data Visualization Description Generator", slug: "data-visualization-description-generator" },
      { name: "Presentation Feedback Analyzer",           slug: "presentation-feedback-analyzer" },
      { name: "Speaker Notes Generator",                  slug: "speaker-notes-generator" },
      { name: "Q&A Preparation Generator",                slug: "qa-preparation-generator" },
      { name: "Webinar Script Generator",                 slug: "webinar-script-generator" },
      { name: "Presentation Summary Slide Generator",     slug: "presentation-summary-slide-generator" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Generate tool details via GPT-4o
// ─────────────────────────────────────────────────────────────────────────────
async function generateToolBatch(toolkit, tools, existingNames) {
  const toolList = tools
    .map((t, i) => `${i + 1}. ${t.name} (slug: "${t.slug}"${t.aClass ? ", TYPE: A-class text optimizer" : ""})`)
    .join("\n");

  const aClassNote = tools.some(t => t.aClass) ? `

A-CLASS TOOLS (marked above): These tools take existing content as input and return an improved version.
For A-class tools:
- The main textarea field should have label like "Your Current [Document/Email/Post/etc]" and placeholder showing example existing content
- The prompt should be designed to improve/optimize the provided content
- inputs_schema should include the existing content field PLUS 1-2 context fields
` : "";

  const prompt = `You are a product designer building "AI Tools Station", a professional AI SaaS platform.

Toolkit: "${toolkit.name}"
Context: ${toolkit.context}
${aClassNote}
Generate production-ready configurations for these 10 tools:
${toolList}

EXISTING TOOL NAMES TO AVOID (do not use these exact names):
${existingNames.slice(0, 30).join(", ")}

For EACH tool produce:
- description: 3-4 professional sentences. Specific problem solved, who benefits, key output.
- inputs_schema: 2-4 fields as JSON array.
  * ONE primary "textarea" for the main input (existing content for A-class, user's data/request for B/C-class)
  * 1-2 additional "text" or "select" fields for context
  * "select" only when 3-6 fixed options make sense; add "options": ["opt1","opt2"]
  * All field names: snake_case
  * Each field: { name, label, type, placeholder (concrete example), required }
- prompt_template: Min 200 words. Structure:
  "You are an expert [specific role] with [years/credentials]...

  [Field: {field_name}]
  [Field: {field_name2}]

  STEP 1 — INTERNAL ANALYSIS (do not output):
  [Think through the task]

  ## [Output Section]
  [Professional structured output with ## headings]"

  CRITICAL: Use SINGLE braces {field_name}, NOT double {{}} and NOT square brackets []
  All input fields must appear in the prompt as {field_name}
- seo_title: ≤60 chars with main keyword
- seo_description: 120-160 chars, clear value prop

Return ONLY valid JSON:
{
  "tools": [
    { "name": "...", "slug": "...", "description": "...", "inputs_schema": [...], "prompt_template": "...", "seo_title": "...", "seo_description": "..." }
  ]
}

Generate all 10 tools. Use the exact slugs provided. Do not skip any.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 12000,
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You are a product designer. Return only valid JSON with a 'tools' array of exactly 10 objects. Use exact slugs provided." },
      { role: "user", content: prompt },
    ],
  });

  const raw = completion.choices[0].message.content ?? "{}";
  const parsed = JSON.parse(raw);
  return parsed.tools ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Process one toolkit
// ─────────────────────────────────────────────────────────────────────────────
async function processToolkit(toolkit) {
  console.log(`\n${"─".repeat(70)}`);
  console.log(`🔧 [${toolkit.slug}] ${toolkit.name} — generating ${toolkit.tools.length} tools`);

  // Fetch toolkit row
  const { data: tkRow, error: tkErr } = await supabase
    .from("toolkits")
    .select("id, slug")
    .eq("slug", toolkit.slug)
    .single();

  if (tkErr || !tkRow) {
    console.error(`  ❌ Toolkit not found in DB: ${toolkit.slug}`);
    return { ok: 0, fail: toolkit.tools.length };
  }

  // Fetch existing tool names + slugs to avoid conflicts
  const { data: existingTools } = await supabase
    .from("tools")
    .select("slug, name")
    .eq("toolkit_id", tkRow.id);

  const existingSlugs = new Set((existingTools ?? []).map(t => t.slug));
  const existingNames = (existingTools ?? []).map(t => t.name);

  console.log(`  📊 Currently ${existingTools?.length ?? 0} tools in this toolkit`);

  // Filter out any tool whose slug already exists
  const toolsToGenerate = toolkit.tools.filter(t => {
    if (existingSlugs.has(t.slug)) {
      console.log(`  ⏭  Skipping (slug exists): ${t.slug}`);
      return false;
    }
    return true;
  });

  if (toolsToGenerate.length === 0) {
    console.log("  ✅ All tools already exist, skipping.");
    return { ok: 0, fail: 0 };
  }

  // Generate via GPT-4o
  let generatedTools;
  try {
    generatedTools = await generateToolBatch(toolkit, toolsToGenerate, existingNames);
    console.log(`  ✅ GPT-4o returned ${generatedTools.length} tools`);
  } catch (err) {
    console.error(`  ❌ GPT-4o failed: ${err.message}`);
    return { ok: 0, fail: toolsToGenerate.length };
  }

  // Upsert tools
  let ok = 0, fail = 0;

  for (let i = 0; i < toolsToGenerate.length; i++) {
    const predefined = toolsToGenerate[i];
    const generated = generatedTools.find(g => g.slug === predefined.slug) ?? generatedTools[i] ?? {};

    // Validate schema
    const schema = generated.inputs_schema;
    const schemaOk = Array.isArray(schema) && schema.length > 0 && schema.every(f => f.name && f.label && f.type);
    const promptOk = (generated.prompt_template ?? "").length > 100;

    const payload = {
      toolkit_id: tkRow.id,
      slug: predefined.slug,
      name: predefined.name,
      description: generated.description ?? `AI-powered ${predefined.name}`,
      tool_type: "template",
      inputs_schema: schemaOk ? schema : [
        { name: "input", label: "Your Input", type: "textarea", placeholder: "Describe your request in detail...", required: true }
      ],
      prompt_template: promptOk ? generated.prompt_template : `You are an expert assistant. Help the user with: {input}`,
      output_format: "markdown",
      seo_title: generated.seo_title ?? null,
      seo_description: generated.seo_description ?? null,
      auto_generated: true,
      is_active: true,
      sort_order: (existingTools?.length ?? 0) + i + 1,
    };

    const { error: upsertErr } = await supabase
      .from("tools")
      .upsert(payload, { onConflict: "slug", ignoreDuplicates: false });

    if (upsertErr) {
      // Slug OK but name conflict — retry with slightly modified name
      if (upsertErr.message.includes("tools_name_unique")) {
        const { error: retryErr } = await supabase
          .from("tools")
          .upsert({ ...payload, name: `${predefined.name} (${toolkit.slug})` }, { onConflict: "slug" });
        if (retryErr) {
          console.log(`  ❌ [${i + 1}/${toolsToGenerate.length}] ${predefined.name} — ${retryErr.message}`);
          fail++;
        } else {
          console.log(`  ✅ [${i + 1}/${toolsToGenerate.length}] ${predefined.name} (renamed)`);
          ok++;
        }
      } else {
        console.log(`  ❌ [${i + 1}/${toolsToGenerate.length}] ${predefined.name} — ${upsertErr.message}`);
        fail++;
      }
    } else {
      console.log(`  ✅ [${i + 1}/${toolsToGenerate.length}] ${predefined.name}`);
      ok++;
    }
  }

  // Final count
  const { count: finalCount } = await supabase
    .from("tools")
    .select("id", { count: "exact", head: true })
    .eq("toolkit_id", tkRow.id);

  console.log(`  📊 Final tool count: ${finalCount} (added ${ok}, failed ${fail})`);
  return { ok, fail };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  const targetSlug = process.argv[2]; // optional: run single toolkit

  const toolkitsToRun = targetSlug
    ? TOOLKITS.filter(t => t.slug === targetSlug)
    : TOOLKITS;

  if (toolkitsToRun.length === 0) {
    console.error(`No toolkit found with slug: ${targetSlug}`);
    process.exit(1);
  }

  console.log(`🚀 Adding 10 tools to ${toolkitsToRun.length} toolkit(s)\n`);

  let totalOk = 0, totalFail = 0;

  for (const toolkit of toolkitsToRun) {
    const { ok, fail } = await processToolkit(toolkit);
    totalOk += ok;
    totalFail += fail;
  }

  console.log(`\n${"═".repeat(70)}`);
  console.log(`✅ Total: ${totalOk} tools added  |  ❌ ${totalFail} failed`);
  console.log(`\nA-class tools to register in DOC_TOOL_CONFIG (app/tools/[slug]/page.tsx):`);

  const aClassTools = TOOLKITS.flatMap(t => t.tools.filter(tool => tool.aClass))
    .filter(t => targetSlug ? TOOLKITS.find(tk => tk.slug === targetSlug)?.tools.includes(t) : true);

  for (const t of TOOLKITS.flatMap(tk => tk.tools.filter(t => t.aClass))) {
    console.log(`  • "${t.slug}"`);
  }
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
