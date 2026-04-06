/**
 * scripts/generate-work-life-templates.mjs
 *
 * 1. Upserts 'work-life-templates' toolkit
 * 2. Generates 109 tools across 12 categories via GPT-4o
 * 3. Activates toolkit + tools
 *
 * Run: node scripts/generate-work-life-templates.mjs
 * Run single category: node scripts/generate-work-life-templates.mjs sales
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
// TOOL DEFINITIONS — 109 tools across 12 categories
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    key: "sales",
    label: "Sales Templates",
    context: "B2B/B2C sales, cold outreach, pipeline management, customer success, deal closing, and sales communication",
    tools: [
      { name: "Cold Outreach Email Template",        slug: "cold-outreach-email-template",        inputs: "target company, industry, pain point, your product/solution" },
      { name: "Follow-Up Email Template",             slug: "follow-up-email-template",            inputs: "prospect name, previous interaction, next step" },
      { name: "Demo Request Email Template",          slug: "demo-request-email-template",         inputs: "product name, prospect company, value proposition" },
      { name: "Partnership Proposal Email Template",  slug: "partnership-proposal-email-template", inputs: "your company, partner company, partnership type, mutual benefits" },
      { name: "Sales Call Script Template",           slug: "sales-call-script-template",          inputs: "product name, target customer, key objections" },
      { name: "Discovery Call Questions Template",    slug: "discovery-call-questions-template",   inputs: "industry, product category, customer pain points" },
      { name: "Product Demo Script Template",         slug: "product-demo-script-template-wlt",    inputs: "product name, key features, demo duration, audience" },
      { name: "Closing Script Template",              slug: "closing-script-template",             inputs: "product name, deal value, customer concern" },
      { name: "Sales Pipeline Tracker Template",      slug: "sales-pipeline-tracker-template",     inputs: "company name, deal stages, team size, reporting period" },
      { name: "Lead Qualification Template",          slug: "lead-qualification-template",         inputs: "product type, ideal customer profile, qualification criteria" },
      { name: "Lead Follow-Up Schedule Template",     slug: "lead-followup-schedule-template",     inputs: "lead name, deal stage, timeline, next actions" },
      { name: "Customer Success Check-In Template",   slug: "customer-success-checkin-template",   inputs: "customer name, product used, account health, review period" },
      { name: "Renewal Reminder Template",            slug: "renewal-reminder-template",           inputs: "customer name, subscription end date, renewal offer" },
    ],
  },
  {
    key: "marketing",
    label: "Marketing Templates",
    context: "Digital marketing, content marketing, advertising copy, social media, SEO, and brand messaging",
    tools: [
      { name: "Google Ads Copy Template",       slug: "google-ads-copy-template-wlt",     inputs: "product/service, target audience, key benefit, CTA" },
      { name: "Facebook Ads Copy Template",     slug: "facebook-ads-copy-template",       inputs: "product, audience, pain point, offer" },
      { name: "LinkedIn Ads Copy Template",     slug: "linkedin-ads-copy-template",       inputs: "product, professional audience, value proposition" },
      { name: "Blog Outline Template",          slug: "blog-outline-template",            inputs: "topic, target audience, SEO keyword, blog length" },
      { name: "LinkedIn Post Template",         slug: "linkedin-post-template-wlt",       inputs: "topic, key insight, professional context, CTA" },
      { name: "Twitter Thread Template",        slug: "twitter-thread-template",          inputs: "topic, main argument, number of tweets, target audience" },
      { name: "YouTube Video Script Template",  slug: "youtube-video-script-template-wlt",inputs: "video topic, target audience, video length, key points" },
      { name: "Newsletter Template",            slug: "newsletter-template-wlt",          inputs: "newsletter name, edition topic, audience, key sections" },
      { name: "SEO Article Outline Template",   slug: "seo-article-outline-template",     inputs: "target keyword, audience intent, article length, competitors" },
      { name: "Keyword Research Sheet Template",slug: "keyword-research-sheet-template",  inputs: "main topic, industry, target market" },
      { name: "Content Brief Template",         slug: "content-brief-template-wlt",       inputs: "content topic, target audience, SEO goal, word count" },
      { name: "Marketing Plan Template",        slug: "marketing-plan-template",          inputs: "product/service, market, budget, timeline, goals" },
      { name: "Campaign Plan Template",         slug: "campaign-plan-template-wlt",       inputs: "campaign goal, channels, budget, duration, KPIs" },
      { name: "Brand Messaging Template",       slug: "brand-messaging-template",         inputs: "brand name, target audience, core values, unique positioning" },
    ],
  },
  {
    key: "operations",
    label: "Operations Templates",
    context: "Project management, process documentation, operations reporting, team tracking, and workflow management",
    tools: [
      { name: "Project Plan Template",               slug: "project-plan-template-wlt",           inputs: "project name, goal, team, timeline, key milestones" },
      { name: "Sprint Planning Template",             slug: "sprint-planning-template",            inputs: "sprint goal, team members, duration, backlog items" },
      { name: "Task Tracker Template",                slug: "task-tracker-template",               inputs: "project name, team members, task categories, deadline" },
      { name: "Kanban Board Template",                slug: "kanban-board-template",               inputs: "project name, workflow stages, team size" },
      { name: "Standard Operating Procedure Template",slug: "sop-template-wlt",                   inputs: "process name, department, steps, responsible roles" },
      { name: "Process Documentation Template",       slug: "process-documentation-template",      inputs: "process name, trigger, steps, output, owner" },
      { name: "Workflow Checklist Template",          slug: "workflow-checklist-template",         inputs: "workflow name, steps, responsible party, completion criteria" },
      { name: "Team KPI Tracker Template",            slug: "team-kpi-tracker-template-wlt",       inputs: "team name, KPIs, targets, review period" },
      { name: "OKR Planning Template",                slug: "okr-planning-template-wlt",           inputs: "team/department, quarter, strategic priorities" },
      { name: "Performance Review Template",          slug: "performance-review-template-wlt",     inputs: "employee role, review period, performance dimensions" },
      { name: "Weekly Operations Report Template",    slug: "weekly-operations-report-template",   inputs: "team name, week dates, key metrics, blockers, next steps" },
      { name: "Operations Dashboard Template",        slug: "operations-dashboard-template",       inputs: "department, key metrics, reporting frequency, stakeholders" },
    ],
  },
  {
    key: "analytics",
    label: "Business Analytics Templates",
    context: "Business analysis, ROI calculation, data reporting, strategic decision-making, and market research",
    tools: [
      { name: "Business Case Template",              slug: "business-case-template-wlt",            inputs: "initiative name, problem, proposed solution, budget, timeline" },
      { name: "ROI Analysis Template",               slug: "roi-analysis-template",                 inputs: "investment cost, expected benefits, timeline, risk factors" },
      { name: "Cost-Benefit Analysis Template",      slug: "cost-benefit-analysis-template",        inputs: "project name, costs, benefits, time horizon" },
      { name: "Data Analysis Report Template",       slug: "data-analysis-report-template-wlt",     inputs: "analysis topic, data source, key findings, audience" },
      { name: "Dashboard Requirement Template",      slug: "dashboard-requirement-template",        inputs: "dashboard purpose, stakeholders, key metrics, data sources" },
      { name: "Insights Summary Template",           slug: "insights-summary-template",             inputs: "data topic, key findings, business implications, recommendations" },
      { name: "Decision Matrix Template",            slug: "decision-matrix-template-wlt",          inputs: "decision to make, options, evaluation criteria, weights" },
      { name: "Trade-Off Analysis Template",         slug: "tradeoff-analysis-template",            inputs: "decision context, options, key trade-offs" },
      { name: "Scenario Planning Template",          slug: "scenario-planning-template",            inputs: "strategic question, time horizon, key uncertainties" },
      { name: "SWOT Analysis Template",              slug: "swot-analysis-template-wlt",            inputs: "company/product name, industry, market position" },
      { name: "PESTLE Analysis Template",            slug: "pestle-analysis-template",              inputs: "company/industry, geographic market, time horizon" },
      { name: "Market Analysis Template",            slug: "market-analysis-template-wlt",          inputs: "market name, target segment, geographic scope" },
      { name: "Strategic Options Comparison Template",slug: "strategic-options-comparison-template",inputs: "strategic goal, options to compare, evaluation criteria" },
    ],
  },
  {
    key: "product",
    label: "Product Management Templates",
    context: "Product discovery, roadmapping, requirements, user research, prioritization, and product metrics",
    tools: [
      { name: "Product Roadmap Template",              slug: "product-roadmap-template",              inputs: "product name, vision, time horizon, key themes" },
      { name: "Feature Prioritization Template",       slug: "feature-prioritization-template-wlt",   inputs: "product name, feature list, prioritization framework" },
      { name: "Product Requirement Document Template", slug: "prd-template",                          inputs: "feature name, problem statement, user stories, success metrics" },
      { name: "User Story Template",                   slug: "user-story-template",                   inputs: "user role, goal, acceptance criteria, priority" },
      { name: "User Interview Guide Template",         slug: "user-interview-guide-template",         inputs: "research goal, user segment, key topics to explore" },
      { name: "Customer Feedback Template",            slug: "customer-feedback-template-wlt",        inputs: "product/feature, feedback type, customer segment" },
      { name: "Product Discovery Checklist Template",  slug: "product-discovery-checklist-template",  inputs: "product area, discovery stage, team roles" },
      { name: "Product Metrics Dashboard Template",    slug: "product-metrics-dashboard-template",    inputs: "product name, key metrics, reporting period" },
      { name: "Feature Impact Analysis Template",      slug: "feature-impact-analysis-template",      inputs: "feature name, user segment, expected impact, effort estimate" },
    ],
  },
  {
    key: "productivity",
    label: "Productivity Templates",
    context: "Work planning, goal setting, meeting management, task tracking, and personal productivity",
    tools: [
      { name: "Weekly Work Plan Template",       slug: "weekly-work-plan-template-wlt",     inputs: "week dates, key goals, ongoing projects, priorities" },
      { name: "Monthly Goals Template",          slug: "monthly-goals-template",            inputs: "month, personal/professional goals, success metrics" },
      { name: "Quarterly Planning Template",     slug: "quarterly-planning-template",       inputs: "quarter, key objectives, initiatives, resources" },
      { name: "Task List Template",              slug: "task-list-template",                inputs: "project/context, tasks, priorities, deadlines" },
      { name: "Priority Matrix Template",        slug: "priority-matrix-template",          inputs: "task list, urgency/importance criteria" },
      { name: "Meeting Agenda Template",         slug: "meeting-agenda-template-wlt",       inputs: "meeting purpose, attendees, duration, topics" },
      { name: "Meeting Notes Template",          slug: "meeting-notes-template",            inputs: "meeting title, date, attendees, discussion points" },
      { name: "Action Items Tracker Template",   slug: "action-items-tracker-template",     inputs: "project name, action items, owners, deadlines" },
    ],
  },
  {
    key: "scheduling",
    label: "Scheduling Templates",
    context: "Personal scheduling, time management, habit formation, and personal goal planning",
    tools: [
      { name: "Daily Schedule Template",        slug: "daily-schedule-template",       inputs: "date, work hours, key tasks, personal commitments" },
      { name: "Weekly Planner Template",        slug: "weekly-planner-template",       inputs: "week start date, work goals, personal goals, key events" },
      { name: "Time Blocking Schedule Template",slug: "time-blocking-schedule-template",inputs: "work hours, key tasks, energy levels, focus blocks" },
      { name: "Goal Planning Template",         slug: "goal-planning-template",        inputs: "goal statement, timeline, milestones, obstacles" },
      { name: "Habit Tracker Template",         slug: "habit-tracker-template",        inputs: "habits to track, frequency, tracking period, reward" },
      { name: "Personal OKR Template",          slug: "personal-okr-template",         inputs: "time period, life/career areas, key objectives" },
    ],
  },
  {
    key: "finance",
    label: "Finance Templates",
    context: "Personal and business finance, budgeting, investment tracking, financial projections, and startup valuation",
    tools: [
      { name: "Budget Planner Template",       slug: "budget-planner-template-wlt",   inputs: "period, income sources, expense categories, savings goal" },
      { name: "Expense Tracker Template",      slug: "expense-tracker-template",      inputs: "tracking period, expense categories, budget limits" },
      { name: "Profit & Loss Template",        slug: "profit-loss-template",          inputs: "business name, period, revenue streams, expense categories" },
      { name: "Cash Flow Forecast Template",   slug: "cash-flow-forecast-template",   inputs: "business type, forecast period, revenue/expense categories" },
      { name: "Investment Tracker Template",   slug: "investment-tracker-template",   inputs: "portfolio name, asset classes, tracking period" },
      { name: "Financial Projection Template", slug: "financial-projection-template", inputs: "business name, projection period, key assumptions" },
      { name: "Investment Analysis Template",  slug: "investment-analysis-template",  inputs: "investment name, type, expected returns, risk profile" },
      { name: "Startup Valuation Template",    slug: "startup-valuation-template",    inputs: "startup name, stage, revenue, market size, comparable companies" },
    ],
  },
  {
    key: "hr",
    label: "HR Templates",
    context: "Hiring, onboarding, candidate evaluation, career development, and employee management",
    tools: [
      { name: "Job Description Template",               slug: "job-description-template-wlt",          inputs: "job title, department, responsibilities, required skills, level" },
      { name: "Interview Evaluation Form Template",     slug: "interview-evaluation-template",         inputs: "job role, evaluation criteria, scoring scale" },
      { name: "Employee Onboarding Checklist Template", slug: "employee-onboarding-checklist-template-wlt", inputs: "job role, department, onboarding duration, key systems" },
      { name: "Candidate Scoring Template",             slug: "candidate-scoring-template-wlt",        inputs: "job role, evaluation dimensions, scoring criteria" },
      { name: "Career Development Plan Template",       slug: "career-development-plan-template",      inputs: "employee role, career goal, current skills, development timeline" },
    ],
  },
  {
    key: "study",
    label: "Study Templates",
    context: "Academic study planning, revision, exam preparation, and learning note-taking",
    tools: [
      { name: "Study Planner Template",      slug: "study-planner-template",      inputs: "subject/exam, study period, topics to cover, daily hours" },
      { name: "Revision Schedule Template",  slug: "revision-schedule-template",  inputs: "exam date, subjects, revision weeks, priority topics" },
      { name: "Exam Preparation Template",   slug: "exam-preparation-template-wlt",inputs: "exam name, date, key topics, past paper analysis" },
      { name: "Flashcard Template",          slug: "flashcard-template",           inputs: "subject, topic, key concepts to memorize" },
      { name: "Learning Notes Template",     slug: "learning-notes-template-wlt",  inputs: "subject, topic, learning objectives, key takeaways" },
    ],
  },
  {
    key: "legal",
    label: "Legal Templates",
    context: "Business contracts, agreements, NDAs, proposals, and service terms",
    tools: [
      { name: "Contract Template",            slug: "contract-template-wlt",            inputs: "contract type, parties involved, services/goods, payment terms" },
      { name: "NDA Template",                 slug: "nda-template-wlt",                 inputs: "parties, confidential information scope, duration, jurisdiction" },
      { name: "Partnership Agreement Template",slug: "partnership-agreement-template",   inputs: "partner names, business purpose, profit sharing, responsibilities" },
      { name: "Proposal Template",            slug: "proposal-template-wlt",            inputs: "proposal title, client name, scope, timeline, pricing" },
      { name: "Service Agreement Template",   slug: "service-agreement-template",       inputs: "service provider, client, services, fees, terms" },
    ],
  },
  {
    key: "ai-prompts",
    label: "AI Prompt Templates",
    context: "Crafting effective prompts for AI tools across marketing, coding, research, content creation, and business use cases",
    tools: [
      { name: "AI Marketing Prompt Template",       slug: "ai-marketing-prompt-template",       inputs: "product/service, target audience, platform, marketing goal" },
      { name: "AI Coding Prompt Template",          slug: "ai-coding-prompt-template",          inputs: "programming language, task description, constraints, output format" },
      { name: "AI Research Prompt Template",        slug: "ai-research-prompt-template",        inputs: "research topic, depth required, output format, audience" },
      { name: "AI Resume Prompt Template",          slug: "ai-resume-prompt-template",          inputs: "job title, experience level, key skills, target role" },
      { name: "Blog Writing Prompt Template",       slug: "blog-writing-prompt-template",       inputs: "blog topic, target audience, tone, length, SEO keyword" },
      { name: "LinkedIn Post Prompt Template",      slug: "linkedin-post-prompt-template",      inputs: "topic, professional context, key message, engagement goal" },
      { name: "Business Plan Prompt Template",      slug: "business-plan-prompt-template",      inputs: "business idea, industry, target market, stage" },
      { name: "Startup Pitch Prompt Template",      slug: "startup-pitch-prompt-template",      inputs: "startup name, problem solved, solution, market size" },
      { name: "Market Analysis Prompt Template",    slug: "market-analysis-prompt-template",    inputs: "market/industry, geographic scope, analysis depth" },
      { name: "Cover Letter Prompt Template",       slug: "cover-letter-prompt-template",       inputs: "job title, company name, key experience, tone" },
      { name: "Interview Preparation Prompt Template",slug: "interview-preparation-prompt-template",inputs: "job role, company, interview type, key competencies" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// GPT-4o tool generator
// ─────────────────────────────────────────────────────────────────────────────
async function generateTools(categoryLabel, categoryContext, tools) {
  const toolList = tools.map((t, i) =>
    `${i + 1}. name: "${t.name}", slug: "${t.slug}", inputs: "${t.inputs}"`
  ).join("\n");

  const prompt = `You are an expert product designer creating AI-powered template tools for a professional productivity platform.

Category: ${categoryLabel}
Context: ${categoryContext}

Generate complete tool definitions for these ${tools.length} tools:
${toolList}

For EACH tool, create:
1. description (2-3 sentences, explain what the template generates and its key value)
2. inputs_schema (array of input fields matching the given inputs)
3. prompt_template (a detailed, expert-level system prompt that generates a ready-to-use professional template)

CRITICAL prompt_template requirements:
- Start with expert role definition: "You are an expert [role] with [X] years of experience in [domain]..."
- List all inputs using {variable_name} placeholders
- Include STEP 1 — INTERNAL ANALYSIS (do not output): for planning the template structure
- Output a COMPLETE, READY-TO-USE template with:
  * Clear section headings (## Section Name)
  * Actual placeholder variables in [BRACKETS] format for users to fill in (e.g., [Company Name], [Date], [Amount])
  * Professional formatting with tables where appropriate
  * Specific, actionable content in each section (not vague descriptions)
- The template should be directly copyable and usable with minimal editing

For inputs_schema, each field should be:
{ "name": "field_name", "label": "Field Label", "type": "text|textarea|select", "placeholder": "example...", "required": true|false }
Use select type only when there are clear categorical options.

Return a JSON object with this structure:
{
  "tools": [
    {
      "slug": "exact-slug-from-list",
      "description": "...",
      "inputs_schema": [...],
      "prompt_template": "..."
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: 16000,
    temperature: 0.7,
  });

  return JSON.parse(response.choices[0].message.content);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  const filterCategory = process.argv[2]; // optional: run single category

  // ── Step 1: Upsert toolkit ──────────────────────────────────────────────
  console.log("\n📋 Upserting Work & Life Templates toolkit...");
  const { data: tk, error: tkErr } = await supabase
    .from("toolkits")
    .upsert({
      slug: "work-life-templates",
      name: "Work & Life Templates",
      description: "Ready-to-use AI-powered templates for sales, marketing, operations, business analysis, productivity, HR, finance, and more",
      price_monthly: 19,
      icon: "📋",
      is_active: false,
      sort_order: 26,
    }, { onConflict: "slug" })
    .select("id, slug")
    .single();

  if (tkErr) { console.error("❌ Toolkit upsert failed:", tkErr.message); process.exit(1); }
  const toolkitId = tk.id;
  console.log(`✅ Toolkit ready: ${tk.slug} (${toolkitId})`);

  // ── Step 2: Get existing slugs to avoid duplicates ──────────────────────
  const { data: allExisting } = await supabase
    .from("tools")
    .select("slug")
    .eq("toolkit_id", toolkitId);
  const existingSlugs = new Set((allExisting || []).map(t => t.slug));

  let totalAdded = 0;
  let totalFailed = 0;

  const categoriesToRun = filterCategory
    ? CATEGORIES.filter(c => c.key === filterCategory)
    : CATEGORIES;

  if (filterCategory && categoriesToRun.length === 0) {
    console.error(`❌ Category '${filterCategory}' not found. Available: ${CATEGORIES.map(c=>c.key).join(', ')}`);
    process.exit(1);
  }

  // ── Step 3: Generate tools per category ────────────────────────────────
  for (const category of categoriesToRun) {
    console.log(`\n${"─".repeat(70)}`);
    console.log(`🔧 [${category.key}] ${category.label} — ${category.tools.length} tools`);

    // Filter out already-existing tools
    const toolsToGenerate = category.tools.filter(t => !existingSlugs.has(t.slug));
    if (toolsToGenerate.length === 0) {
      console.log(`  ⏭  All tools already exist, skipping`);
      continue;
    }
    if (toolsToGenerate.length < category.tools.length) {
      console.log(`  ⏭  Skipping ${category.tools.length - toolsToGenerate.length} existing tools`);
    }

    let generated;
    try {
      console.log(`  🤖 Calling GPT-4o for ${toolsToGenerate.length} tools...`);
      generated = await generateTools(category.label, category.context, toolsToGenerate);
    } catch (err) {
      console.error(`  ❌ GPT-4o failed for ${category.label}:`, err.message);
      totalFailed += toolsToGenerate.length;
      continue;
    }

    const generatedTools = generated.tools || [];
    console.log(`  ✅ GPT-4o returned ${generatedTools.length} tools`);

    // Build a map by slug for matching
    const genMap = {};
    for (const g of generatedTools) {
      if (g.slug) genMap[g.slug] = g;
    }

    // Insert in order
    let catAdded = 0;
    let catFailed = 0;
    for (let i = 0; i < toolsToGenerate.length; i++) {
      const toolDef = toolsToGenerate[i];
      const gen = genMap[toolDef.slug] || generatedTools[i]; // fallback to positional match
      if (!gen) {
        console.error(`  ❌ [${i+1}/${toolsToGenerate.length}] No data for: ${toolDef.name}`);
        catFailed++; continue;
      }

      // Ensure name uniqueness by adding (wlt) suffix if needed
      let finalName = toolDef.name;
      const { data: nameCheck } = await supabase.from("tools").select("id").eq("name", finalName).single();
      if (nameCheck) finalName = `${toolDef.name} (WLT)`;

      const { error } = await supabase.from("tools").insert({
        toolkit_id: toolkitId,
        slug: toolDef.slug,
        name: finalName,
        description: gen.description || `Generate a professional ${toolDef.name.toLowerCase()}.`,
        tool_type: "template",
        inputs_schema: gen.inputs_schema || [],
        prompt_template: gen.prompt_template || "",
        output_format: "markdown",
        auto_generated: true,
        is_active: true,
        sort_order: i + 1,
      });

      if (error) {
        if (error.message.includes("tools_name_unique") || error.message.includes("duplicate key")) {
          // Try with category suffix
          const retryName = `${toolDef.name} — ${category.label}`;
          const { error: err2 } = await supabase.from("tools").insert({
            toolkit_id: toolkitId,
            slug: toolDef.slug,
            name: retryName,
            description: gen.description || `Generate a professional ${toolDef.name.toLowerCase()}.`,
            tool_type: "template",
            inputs_schema: gen.inputs_schema || [],
            prompt_template: gen.prompt_template || "",
            output_format: "markdown",
            auto_generated: true,
            is_active: true,
            sort_order: i + 1,
          });
          if (err2) {
            console.error(`  ❌ [${i+1}] ${toolDef.name}: ${err2.message}`);
            catFailed++;
          } else {
            console.log(`  ✅ [${i+1}/${toolsToGenerate.length}] ${retryName} (renamed)`);
            catAdded++;
          }
        } else {
          console.error(`  ❌ [${i+1}] ${toolDef.name}: ${error.message}`);
          catFailed++;
        }
      } else {
        console.log(`  ✅ [${i+1}/${toolsToGenerate.length}] ${finalName}`);
        catAdded++;
      }
    }

    totalAdded += catAdded;
    totalFailed += catFailed;

    // Verify count
    const { count } = await supabase
      .from("tools")
      .select("id", { count: "exact", head: true })
      .eq("toolkit_id", toolkitId);
    console.log(`  📊 Category done: +${catAdded} added, ${catFailed} failed | Total in toolkit: ${count}`);
  }

  // ── Step 4: Activate toolkit ────────────────────────────────────────────
  if (!filterCategory) {
    console.log("\n✨ Activating toolkit and all tools...");
    await supabase.from("toolkits").update({ is_active: true }).eq("id", toolkitId);
    await supabase.from("tools").update({ is_active: true }).eq("toolkit_id", toolkitId);

    const { count: finalCount } = await supabase
      .from("tools")
      .select("id", { count: "exact", head: true })
      .eq("toolkit_id", toolkitId)
      .eq("is_active", true);

    console.log(`\n${"═".repeat(70)}`);
    console.log(`✅ Total added: ${totalAdded} | ❌ Failed: ${totalFailed}`);
    console.log(`📊 Active tools in Work & Life Templates: ${finalCount}`);
    console.log(`\n⚠️  Don't forget:`);
    console.log(`  • Add STRIPE_Work_Life_Template_PRICE_ID to Vercel env`);
    console.log(`  • lib/stripe.ts already has the mapping`);
  }
}

main().catch(console.error);
