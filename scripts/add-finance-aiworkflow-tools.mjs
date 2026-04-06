/**
 * Adds 20 tools to finance toolkit + 20 tools to ai-workflow toolkit
 * Run: node scripts/add-finance-aiworkflow-tools.mjs
 * Optional: node scripts/add-finance-aiworkflow-tools.mjs finance
 *           node scripts/add-finance-aiworkflow-tools.mjs ai-workflow
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

// ─── Finance Toolkit — 20 new tools ──────────────────────────────────────────

const FINANCE_TOOLS = [
  // ── A-class (text optimization, dual-panel) ────────────────────────────────
  {
    name: "Financial Report Optimizer",
    slug: "financial-report-optimizer",
    description: "Optimize existing financial reports for clarity, structure, and executive-readiness",
    isAClass: true,
    inputs: [
      { name: "financial_report", type: "textarea", label: "Existing Financial Report (paste or upload)", placeholder: "Paste your financial report text here, or upload a PDF/DOCX file..." },
      { name: "audience", type: "text", label: "Target Audience", placeholder: "e.g. Board of Directors, Investors, Management team" },
      { name: "tone", type: "text", label: "Preferred Tone", placeholder: "e.g. Formal executive summary, Investor-friendly, Analytical" },
    ],
  },
  {
    name: "Investment Proposal Optimizer",
    slug: "investment-proposal-optimizer",
    description: "Refine investment proposals to improve persuasiveness, structure, and credibility for investors",
    isAClass: true,
    inputs: [
      { name: "proposal_content", type: "textarea", label: "Existing Investment Proposal (paste or upload)", placeholder: "Paste your investment proposal here, or upload a PDF/DOCX file..." },
      { name: "investor_type", type: "text", label: "Target Investor Type", placeholder: "e.g. Angel investor, VC firm, Private equity, Family office" },
      { name: "funding_stage", type: "text", label: "Funding Stage", placeholder: "e.g. Pre-seed, Seed, Series A, Growth stage" },
    ],
  },
  {
    name: "Financial Summary Rewriter",
    slug: "financial-summary-rewriter",
    description: "Rewrite financial summaries for greater clarity, conciseness, and stakeholder impact",
    isAClass: true,
    inputs: [
      { name: "original_summary", type: "textarea", label: "Existing Financial Summary (paste or upload)", placeholder: "Paste your financial summary here, or upload a PDF/DOCX file..." },
      { name: "purpose", type: "text", label: "Summary Purpose", placeholder: "e.g. Quarterly earnings call, Annual report, Board briefing, Investor update" },
      { name: "word_limit", type: "text", label: "Target Length", placeholder: "e.g. 200 words, 1 page, Executive brief (3 paragraphs)" },
    ],
  },

  // ── C-class (analysis tools) ───────────────────────────────────────────────
  {
    name: "Financial Statement Analyzer",
    slug: "financial-statement-analyzer",
    description: "Analyze financial statements to extract key insights, ratios, trends, and risk indicators",
    isAClass: false,
    inputs: [
      { name: "financial_statement", type: "textarea", label: "Financial Statement (paste or upload)", placeholder: "Paste your income statement, balance sheet, or cash flow data here..." },
      { name: "company_context", type: "text", label: "Company Context", placeholder: "e.g. B2B SaaS startup, 3 years old, $2M ARR" },
      { name: "analysis_focus", type: "text", label: "Analysis Focus", placeholder: "e.g. Profitability, Liquidity, Growth, Overall health" },
    ],
  },
  {
    name: "Investment Risk Analyzer",
    slug: "investment-risk-analyzer",
    description: "Assess investment risks with structured risk scoring, factor analysis, and mitigation strategies",
    isAClass: false,
    inputs: [
      { name: "investment_description", type: "textarea", label: "Investment Description", placeholder: "Describe the investment: type, asset, market, size, expected returns, and any known risks..." },
      { name: "investment_type", type: "text", label: "Investment Type", placeholder: "e.g. Equity (startup), Real estate, Stock portfolio, Crypto, Private debt" },
      { name: "risk_tolerance", type: "text", label: "Investor Risk Tolerance", placeholder: "e.g. Conservative, Moderate, Aggressive" },
    ],
  },
  {
    name: "Cash Flow Analyzer",
    slug: "cash-flow-analyzer",
    description: "Analyze cash flow data to identify patterns, risks, and optimization opportunities",
    isAClass: false,
    inputs: [
      { name: "cash_flow_data", type: "textarea", label: "Cash Flow Data (paste or upload)", placeholder: "Paste your cash flow statement or describe monthly inflows/outflows by category..." },
      { name: "business_context", type: "text", label: "Business Context", placeholder: "e.g. Retail business with seasonal peaks, SaaS with monthly subscriptions" },
      { name: "period", type: "text", label: "Period Covered", placeholder: "e.g. Q1 2025, Full year 2024, Last 12 months" },
    ],
  },
  {
    name: "Portfolio Performance Analyzer",
    slug: "portfolio-performance-analyzer",
    description: "Analyze investment portfolio performance including returns, risk metrics, and rebalancing needs",
    isAClass: false,
    inputs: [
      { name: "portfolio_data", type: "textarea", label: "Portfolio Holdings & Performance (paste or upload)", placeholder: "List assets, allocations, purchase prices, current values, and any dividends received..." },
      { name: "benchmark", type: "text", label: "Benchmark to Compare Against", placeholder: "e.g. S&P 500, 60/40 portfolio, Custom benchmark" },
      { name: "investment_goals", type: "text", label: "Investment Goals", placeholder: "e.g. Capital growth, Income generation, Wealth preservation, Retirement" },
    ],
  },
  {
    name: "Business Valuation Analyzer",
    slug: "business-valuation-analyzer",
    description: "Estimate business valuation using multiple methods with comparative analysis and justification",
    isAClass: false,
    inputs: [
      { name: "business_financials", type: "textarea", label: "Business Financials & Description (paste or upload)", placeholder: "Revenue, EBITDA, growth rate, market size, competitive position, assets, team size..." },
      { name: "industry", type: "text", label: "Industry", placeholder: "e.g. B2B SaaS, E-commerce, Manufacturing, Healthcare services" },
      { name: "valuation_purpose", type: "text", label: "Valuation Purpose", placeholder: "e.g. Fundraising, M&A, ESOPs, Annual review" },
    ],
  },
  {
    name: "Break-Even Analysis Generator",
    slug: "break-even-analysis-generator",
    description: "Calculate and explain break-even point with visual breakdowns, scenarios, and margin analysis",
    isAClass: false,
    inputs: [
      { name: "fixed_costs", type: "text", label: "Total Fixed Monthly Costs", placeholder: "e.g. $15,000/month (rent, salaries, software, insurance)" },
      { name: "variable_cost_per_unit", type: "text", label: "Variable Cost Per Unit / Sale", placeholder: "e.g. $12 per product sold, or 30% of revenue" },
      { name: "price_per_unit", type: "text", label: "Selling Price Per Unit / Sale", placeholder: "e.g. $49 per product, $299 per subscription" },
      { name: "business_context", type: "text", label: "Business Context", placeholder: "e.g. E-commerce, SaaS, Service business, Restaurant" },
    ],
  },
  {
    name: "Financial KPI Dashboard Generator",
    slug: "financial-kpi-dashboard-generator",
    description: "Generate a structured financial KPI dashboard template with metric definitions and targets",
    isAClass: false,
    inputs: [
      { name: "company_name", type: "text", label: "Company Name", placeholder: "e.g. Acme Corp" },
      { name: "industry", type: "text", label: "Industry", placeholder: "e.g. B2B SaaS, E-commerce, Professional services" },
      { name: "key_metrics", type: "textarea", label: "Key Financial Metrics You Track", placeholder: "e.g. MRR, CAC, LTV, Gross margin, Burn rate, Runway..." },
      { name: "dashboard_audience", type: "text", label: "Dashboard Audience", placeholder: "e.g. Founders, CFO, Board of Directors, Investors" },
    ],
  },

  // ── B-class (generation tools) ─────────────────────────────────────────────
  {
    name: "Financial Forecast Generator",
    slug: "financial-forecast-generator",
    description: "Generate a structured financial forecast with revenue, expense, and profit projections by scenario",
    isAClass: false,
    inputs: [
      { name: "historical_data", type: "textarea", label: "Historical Financial Data (optional)", placeholder: "Describe past 12 months performance: revenue, growth rate, expenses..." },
      { name: "growth_assumptions", type: "textarea", label: "Key Growth Assumptions", placeholder: "e.g. Revenue grows 15%/month, Headcount doubles by Q3, CAC stays at $200" },
      { name: "forecast_period", type: "text", label: "Forecast Period", placeholder: "e.g. Next 12 months, 3-year plan, Q2–Q4 2025" },
      { name: "business_model", type: "text", label: "Business Model", placeholder: "e.g. SaaS subscription, E-commerce, Services, Marketplace" },
    ],
  },
  {
    name: "Investment Thesis Generator Pro",
    slug: "investment-thesis-generator-pro",
    description: "Generate a detailed, research-grade investment thesis with bull/bear cases and catalyst analysis",
    isAClass: false,
    inputs: [
      { name: "investment_target", type: "text", label: "Investment Target", placeholder: "e.g. Company name + ticker, Sector, Asset class" },
      { name: "sector", type: "text", label: "Sector / Industry", placeholder: "e.g. Cloud infrastructure, Consumer health, Real estate" },
      { name: "investment_rationale", type: "textarea", label: "Your Investment Rationale & Research Notes", placeholder: "Key facts, competitive advantages, market opportunity, valuation observations..." },
      { name: "time_horizon", type: "text", label: "Investment Time Horizon", placeholder: "e.g. 12–18 months, 3–5 years, Long-term hold" },
    ],
  },
  {
    name: "Startup Financial Model Generator",
    slug: "startup-financial-model-generator",
    description: "Generate a startup financial model framework with revenue drivers, unit economics, and funding runway",
    isAClass: false,
    inputs: [
      { name: "business_type", type: "text", label: "Business Type", placeholder: "e.g. SaaS, Marketplace, D2C E-commerce, Agency" },
      { name: "revenue_model", type: "text", label: "Revenue Model", placeholder: "e.g. Monthly subscription, Transaction fees, One-time purchase + upsell" },
      { name: "key_assumptions", type: "textarea", label: "Key Business Assumptions", placeholder: "Pricing, target customers, acquisition channel, monthly growth rate, team costs..." },
      { name: "funding_stage", type: "text", label: "Current Funding Stage", placeholder: "e.g. Bootstrapped, Pre-seed, Seed, Series A" },
    ],
  },
  {
    name: "Monthly Financial Report Generator",
    slug: "monthly-financial-report-generator",
    description: "Generate a professional monthly financial report with performance summary and forward-looking commentary",
    isAClass: false,
    inputs: [
      { name: "month_year", type: "text", label: "Reporting Month & Year", placeholder: "e.g. March 2025" },
      { name: "revenue_data", type: "textarea", label: "Revenue & Key Metrics", placeholder: "Revenue, growth vs last month, top revenue sources, key wins..." },
      { name: "expense_data", type: "textarea", label: "Expense Data", placeholder: "Total expenses, main cost categories, any unusual items..." },
      { name: "key_events", type: "text", label: "Key Events or Milestones This Month", placeholder: "e.g. Launched new product, Lost major client, Hired 3 engineers" },
    ],
  },
  {
    name: "Fundraising Pitch Financial Section Generator",
    slug: "fundraising-pitch-financial-generator",
    description: "Generate the financial section of a fundraising pitch deck with projections, use of funds, and unit economics",
    isAClass: false,
    inputs: [
      { name: "funding_stage", type: "text", label: "Funding Stage", placeholder: "e.g. Pre-seed, Seed, Series A" },
      { name: "amount_raising", type: "text", label: "Amount Raising", placeholder: "e.g. $500K, $2M, $10M" },
      { name: "use_of_funds", type: "textarea", label: "Use of Funds", placeholder: "How will the capital be allocated? e.g. 40% Product, 35% Sales, 25% Operations" },
      { name: "financial_projections", type: "textarea", label: "Financial Projections Summary", placeholder: "Revenue targets, growth assumptions, path to profitability..." },
    ],
  },
  {
    name: "Tax Planning Strategy Generator",
    slug: "tax-planning-strategy-generator",
    description: "Generate tax planning strategies and optimization opportunities for your business or personal finances",
    isAClass: false,
    inputs: [
      { name: "business_type", type: "text", label: "Entity Type", placeholder: "e.g. LLC, S-Corp, C-Corp, Sole proprietor, Individual investor" },
      { name: "annual_revenue", type: "text", label: "Annual Revenue / Income", placeholder: "e.g. $250,000, $2M, $10M+" },
      { name: "jurisdiction", type: "text", label: "Tax Jurisdiction", placeholder: "e.g. US (California), UK, Singapore, Australia" },
      { name: "tax_concerns", type: "textarea", label: "Key Tax Concerns or Goals", placeholder: "e.g. Reduce self-employment tax, Optimize deductions, R&D credits, International structure" },
    ],
  },
  {
    name: "Dividend Policy Recommendation Generator",
    slug: "dividend-policy-recommendation-generator",
    description: "Generate a tailored dividend policy recommendation based on financial health, growth stage, and shareholder profile",
    isAClass: false,
    inputs: [
      { name: "company_financials", type: "textarea", label: "Company Financials & Context", placeholder: "Revenue, profit, cash reserves, debt levels, growth rate, capex needs..." },
      { name: "growth_stage", type: "text", label: "Growth Stage", placeholder: "e.g. Early growth, Mature/stable, Decline, Turnaround" },
      { name: "shareholder_profile", type: "text", label: "Shareholder Profile", placeholder: "e.g. Institutional investors seeking income, Founder-led with growth focus" },
    ],
  },
  {
    name: "Working Capital Optimization Plan",
    slug: "working-capital-optimization-plan",
    description: "Generate a working capital optimization plan to improve cash conversion cycle and liquidity",
    isAClass: false,
    inputs: [
      { name: "current_position", type: "textarea", label: "Current Working Capital Position", placeholder: "Current assets, current liabilities, receivables aging, inventory levels, payables terms..." },
      { name: "industry", type: "text", label: "Industry", placeholder: "e.g. Manufacturing, Retail, Professional services, Construction" },
      { name: "business_model", type: "text", label: "Business Model", placeholder: "e.g. B2B with 60-day terms, B2C cash upfront, Subscription SaaS" },
    ],
  },
  {
    name: "Cost Reduction Analysis Generator",
    slug: "cost-reduction-analysis-generator",
    description: "Analyze cost structure and generate prioritized cost reduction opportunities with implementation guidance",
    isAClass: false,
    inputs: [
      { name: "cost_categories", type: "textarea", label: "Current Cost Categories & Amounts", placeholder: "List cost categories and monthly/annual spend: payroll, software, marketing, office, COGS..." },
      { name: "business_context", type: "text", label: "Business Context", placeholder: "e.g. Post-funding runway optimization, Pre-profitability, Turnaround situation" },
      { name: "reduction_target", type: "text", label: "Cost Reduction Target", placeholder: "e.g. Reduce by 20%, Save $50K/month, Extend runway by 6 months" },
    ],
  },
  {
    name: "M&A Due Diligence Checklist Generator",
    slug: "ma-due-diligence-checklist-generator",
    description: "Generate a comprehensive M&A due diligence checklist tailored to deal type, target industry, and deal size",
    isAClass: false,
    inputs: [
      { name: "deal_type", type: "text", label: "Deal Type", placeholder: "e.g. Acquisition, Merger, Asset purchase, Strategic investment" },
      { name: "target_company_type", type: "text", label: "Target Company Type", placeholder: "e.g. SaaS startup, Manufacturing company, Professional services firm" },
      { name: "industry", type: "text", label: "Target Industry", placeholder: "e.g. Technology, Healthcare, Financial services, Retail" },
      { name: "deal_size", type: "text", label: "Approximate Deal Size", placeholder: "e.g. $500K micro-acquisition, $10M, $100M+" },
    ],
  },
];

// ─── AI Workflow Toolkit — 20 new tools ───────────────────────────────────────

const AI_WORKFLOW_TOOLS = [
  // ── A-class (text optimization, dual-panel) ────────────────────────────────
  {
    name: "AI Prompt Optimizer Pro",
    slug: "ai-prompt-optimizer-pro",
    description: "Analyze and optimize AI prompts for clarity, specificity, and output quality improvement",
    isAClass: true,
    inputs: [
      { name: "original_prompt", type: "textarea", label: "Prompt to Optimize (paste or upload)", placeholder: "Paste your existing prompt here — we'll analyze and significantly improve it..." },
      { name: "ai_model", type: "text", label: "Target AI Model", placeholder: "e.g. GPT-4o, Claude Sonnet, Gemini Pro, Mistral" },
      { name: "use_case", type: "text", label: "Intended Use Case", placeholder: "e.g. Customer support automation, Content creation, Code review, Data analysis" },
    ],
  },
  {
    name: "AI Workflow Documentation Optimizer",
    slug: "ai-workflow-doc-optimizer",
    description: "Optimize AI workflow documentation for clarity, completeness, and team usability",
    isAClass: true,
    inputs: [
      { name: "workflow_document", type: "textarea", label: "Existing Workflow Document (paste or upload)", placeholder: "Paste your AI workflow documentation here, or upload a PDF/DOCX file..." },
      { name: "target_audience", type: "text", label: "Target Audience", placeholder: "e.g. Technical team, Non-technical operators, New team members" },
      { name: "workflow_type", type: "text", label: "Workflow Type", placeholder: "e.g. Customer support automation, Content pipeline, Data processing, Sales workflow" },
    ],
  },
  {
    name: "AI Use Case Document Optimizer",
    slug: "ai-use-case-doc-optimizer",
    description: "Refine AI use case documents to improve stakeholder buy-in, clarity, and implementation readiness",
    isAClass: true,
    inputs: [
      { name: "use_case_document", type: "textarea", label: "Existing Use Case Document (paste or upload)", placeholder: "Paste your AI use case document here, or upload a PDF/DOCX file..." },
      { name: "stakeholder_audience", type: "text", label: "Primary Stakeholder Audience", placeholder: "e.g. C-suite executives, Technical leads, Finance/budget holders" },
      { name: "document_purpose", type: "text", label: "Document Purpose", placeholder: "e.g. Get budget approval, Align stakeholders, Guide implementation team" },
    ],
  },

  // ── C-class (analysis tools) ───────────────────────────────────────────────
  {
    name: "AI Readiness Assessment Tool",
    slug: "ai-readiness-assessment-tool",
    description: "Assess your organization's AI readiness across people, process, data, and technology dimensions",
    isAClass: false,
    inputs: [
      { name: "company_profile", type: "textarea", label: "Company Profile & AI Context", placeholder: "Company size, industry, current tech stack, existing automation, data practices, AI goals..." },
      { name: "department", type: "text", label: "Department or Scope of Assessment", placeholder: "e.g. Whole company, Marketing team, Customer support, R&D" },
      { name: "ai_maturity", type: "text", label: "Current AI Maturity Level", placeholder: "e.g. No AI tools yet, Basic tools (ChatGPT), Some automation, Advanced AI users" },
    ],
  },
  {
    name: "AI ROI Calculator Generator",
    slug: "ai-roi-calculator-generator",
    description: "Calculate and explain the ROI of an AI implementation with time savings, cost analysis, and payback period",
    isAClass: false,
    inputs: [
      { name: "ai_use_case", type: "text", label: "AI Use Case", placeholder: "e.g. AI customer support chatbot, Automated content generation, AI code review" },
      { name: "implementation_cost", type: "text", label: "Implementation Cost (one-time + monthly)", placeholder: "e.g. $5,000 setup + $500/month" },
      { name: "expected_benefits", type: "textarea", label: "Expected Benefits", placeholder: "Time saved per week, reduced headcount, faster turnaround, quality improvement..." },
      { name: "timeline", type: "text", label: "Evaluation Timeline", placeholder: "e.g. 12 months, 3 years" },
    ],
  },
  {
    name: "AI Risk Assessment Generator",
    slug: "ai-risk-assessment-generator",
    description: "Generate a structured AI risk assessment covering technical, ethical, regulatory, and operational risks",
    isAClass: false,
    inputs: [
      { name: "ai_use_case", type: "textarea", label: "AI Use Case Description", placeholder: "What is the AI system doing? What decisions does it influence? Who does it affect?" },
      { name: "deployment_context", type: "text", label: "Deployment Context", placeholder: "e.g. Customer-facing chatbot, Internal HR tool, Medical diagnosis aid, Financial decisions" },
      { name: "industry", type: "text", label: "Industry", placeholder: "e.g. Healthcare, Finance, Education, Retail, Government" },
    ],
  },
  {
    name: "Prompt Quality Analyzer",
    slug: "prompt-quality-analyzer",
    description: "Analyze prompt quality across multiple dimensions with detailed scoring and improvement recommendations",
    isAClass: false,
    inputs: [
      { name: "prompt_to_analyze", type: "textarea", label: "Prompt to Analyze (paste or upload)", placeholder: "Paste the prompt you want analyzed for quality, clarity, and effectiveness..." },
      { name: "ai_model", type: "text", label: "Target AI Model", placeholder: "e.g. GPT-4o, Claude Sonnet, Gemini, Llama" },
      { name: "task_type", type: "text", label: "Task Type", placeholder: "e.g. Text generation, Code writing, Data analysis, Image creation, Question answering" },
    ],
  },
  {
    name: "AI Tool Stack Analyzer",
    slug: "ai-tool-stack-analyzer",
    description: "Audit your current AI tool stack to identify redundancies, gaps, and optimization opportunities",
    isAClass: false,
    inputs: [
      { name: "current_tools", type: "textarea", label: "Current AI Tools & Software Stack", placeholder: "List all AI tools and software in use, their cost, and what tasks they perform..." },
      { name: "team_workflows", type: "textarea", label: "Key Workflows & Use Cases", placeholder: "Describe your main business workflows and what AI tools are used for each..." },
      { name: "budget", type: "text", label: "Monthly AI Tool Budget", placeholder: "e.g. $500/month, $3,000/month" },
    ],
  },

  // ── B-class (generation tools) ─────────────────────────────────────────────
  {
    name: "AI Implementation Roadmap Generator",
    slug: "ai-implementation-roadmap-generator",
    description: "Generate a phased AI implementation roadmap with milestones, resource requirements, and success metrics",
    isAClass: false,
    inputs: [
      { name: "company_type", type: "text", label: "Company Type & Size", placeholder: "e.g. 50-person SaaS company, 200-person retail chain, 10-person agency" },
      { name: "ai_goals", type: "textarea", label: "AI Implementation Goals", placeholder: "What do you want to achieve? Which processes to automate? Expected outcomes?" },
      { name: "timeline", type: "text", label: "Desired Timeline", placeholder: "e.g. 6 months, 1 year, 18 months" },
      { name: "budget", type: "text", label: "Budget Range", placeholder: "e.g. $10K startup budget, $100K mid-market, Enterprise (unlimited)" },
    ],
  },
  {
    name: "AI Training Data Requirements Generator",
    slug: "ai-training-data-requirements-generator",
    description: "Generate comprehensive AI training data requirements specifications for custom model development",
    isAClass: false,
    inputs: [
      { name: "model_type", type: "text", label: "AI Model Type", placeholder: "e.g. Text classifier, Image recognition, Chatbot, Recommendation engine" },
      { name: "use_case", type: "textarea", label: "Use Case Description", placeholder: "What should the AI model do? What inputs will it receive? What outputs should it produce?" },
      { name: "data_sources", type: "text", label: "Available Data Sources", placeholder: "e.g. CRM records, Customer emails, Product reviews, Internal documents" },
    ],
  },
  {
    name: "AI Governance Policy Generator",
    slug: "ai-governance-policy-generator",
    description: "Generate a comprehensive AI governance policy covering ethics, accountability, oversight, and compliance",
    isAClass: false,
    inputs: [
      { name: "company_size", type: "text", label: "Company Size", placeholder: "e.g. Startup (< 50), Mid-market (50–500), Enterprise (500+)" },
      { name: "ai_use_cases", type: "textarea", label: "Current and Planned AI Use Cases", placeholder: "List the AI tools and systems being used or planned across the organization..." },
      { name: "regulatory_requirements", type: "text", label: "Regulatory Requirements", placeholder: "e.g. GDPR, HIPAA, EU AI Act, SOC2, Financial regulations" },
      { name: "industry", type: "text", label: "Industry", placeholder: "e.g. Healthcare, Finance, Education, Technology" },
    ],
  },
  {
    name: "AI Change Management Plan Generator",
    slug: "ai-change-management-plan-generator",
    description: "Create a structured change management plan for AI adoption initiatives to ensure team buy-in and adoption",
    isAClass: false,
    inputs: [
      { name: "ai_initiative", type: "textarea", label: "AI Initiative Description", placeholder: "What AI system or workflow change is being introduced? What will change for employees?" },
      { name: "team_size", type: "text", label: "Affected Team Size", placeholder: "e.g. 5-person team, 50 employees, Company-wide 200 people" },
      { name: "timeline", type: "text", label: "Implementation Timeline", placeholder: "e.g. 60 days, 6 months, Phased over 1 year" },
      { name: "change_scope", type: "text", label: "Scope of Change", placeholder: "e.g. Minor process improvement, Major workflow overhaul, Role redefinition" },
    ],
  },
  {
    name: "AI Vendor Evaluation Framework Generator",
    slug: "ai-vendor-evaluation-framework-generator",
    description: "Generate a structured AI vendor evaluation framework with weighted criteria, scoring rubrics, and RFP questions",
    isAClass: false,
    inputs: [
      { name: "use_case_requirements", type: "textarea", label: "Use Case Requirements", placeholder: "What does the AI tool need to do? Key functional requirements and must-haves..." },
      { name: "budget", type: "text", label: "Budget Constraint", placeholder: "e.g. Under $500/month, Up to $5,000/month, Enterprise pricing" },
      { name: "evaluation_criteria", type: "text", label: "Key Evaluation Criteria", placeholder: "e.g. Accuracy, Data privacy, Integration with existing tools, Support, Scalability" },
      { name: "team_size", type: "text", label: "Team Size Using the Tool", placeholder: "e.g. 3 users, 25 users, 100+ users" },
    ],
  },
  {
    name: "AI Workflow Integration Plan Generator",
    slug: "ai-workflow-integration-plan-generator",
    description: "Generate a detailed AI workflow integration plan with step-by-step implementation, testing, and rollout phases",
    isAClass: false,
    inputs: [
      { name: "current_workflow", type: "textarea", label: "Current Workflow Description", placeholder: "Describe the workflow as it exists today — steps, tools, who does what, pain points..." },
      { name: "ai_tool", type: "text", label: "AI Tool Being Integrated", placeholder: "e.g. ChatGPT API, Claude API, Custom ML model, Zapier AI, HubSpot AI" },
      { name: "team_role", type: "text", label: "Team Role Affected", placeholder: "e.g. Content writers, Sales reps, Customer support agents, Data analysts" },
      { name: "integration_goal", type: "text", label: "Integration Goal", placeholder: "e.g. Automate first draft, Speed up review process, Reduce manual data entry" },
    ],
  },
  {
    name: "System Prompt Template Generator",
    slug: "system-prompt-template-generator",
    description: "Generate professional system prompt templates for AI assistants with role definition, constraints, and output formatting",
    isAClass: false,
    inputs: [
      { name: "ai_role", type: "text", label: "AI Assistant Role", placeholder: "e.g. Customer support agent, Code reviewer, Marketing copy writer, Financial analyst" },
      { name: "task_type", type: "text", label: "Primary Task Type", placeholder: "e.g. Answer questions, Generate content, Analyze data, Assist with decisions" },
      { name: "constraints", type: "textarea", label: "Constraints & Guardrails", placeholder: "What should the AI never do or say? What topics are off-limits? Any compliance requirements?" },
      { name: "output_format", type: "text", label: "Desired Output Format", placeholder: "e.g. Bullet points, JSON, Markdown, Plain conversational text" },
    ],
  },
  {
    name: "Chain-of-Thought Prompt Generator Pro",
    slug: "chain-of-thought-prompt-generator-pro",
    description: "Generate structured chain-of-thought prompts that guide AI through complex multi-step reasoning tasks",
    isAClass: false,
    inputs: [
      { name: "problem_type", type: "text", label: "Problem Type", placeholder: "e.g. Mathematical reasoning, Legal analysis, Business strategy, Debugging, Decision making" },
      { name: "complexity_level", type: "text", label: "Complexity Level", placeholder: "e.g. Simple (2-3 steps), Moderate (4-6 steps), Complex (7+ steps)" },
      { name: "domain_context", type: "textarea", label: "Domain Context & Specific Problem", placeholder: "Describe the specific problem or task you want the AI to reason through step by step..." },
    ],
  },
  {
    name: "Few-Shot Example Generator Pro",
    slug: "few-shot-example-generator-pro",
    description: "Generate high-quality few-shot examples to train AI models and improve prompt consistency",
    isAClass: false,
    inputs: [
      { name: "task_description", type: "textarea", label: "Task Description", placeholder: "Describe the task: what input will the AI receive, what output should it produce?" },
      { name: "input_format", type: "text", label: "Input Format", placeholder: "e.g. Customer email, Product description, SQL query, User question" },
      { name: "output_format", type: "text", label: "Expected Output Format", placeholder: "e.g. Sentiment label (positive/negative), JSON object, Summary paragraph" },
      { name: "quality_criteria", type: "text", label: "Quality Criteria", placeholder: "e.g. Concise (under 50 words), Formal tone, Always include a recommendation" },
    ],
  },
  {
    name: "AI Team Upskilling Plan Generator",
    slug: "ai-team-upskilling-plan-generator",
    description: "Generate a structured AI upskilling curriculum for specific team roles with learning modules and milestones",
    isAClass: false,
    inputs: [
      { name: "team_roles", type: "text", label: "Team Roles", placeholder: "e.g. Marketing team (copywriters + PMs), Customer support agents, Sales reps" },
      { name: "current_ai_skills", type: "text", label: "Current AI Skill Level", placeholder: "e.g. No experience, Basic ChatGPT users, Intermediate — using AI daily" },
      { name: "target_capabilities", type: "textarea", label: "Target AI Capabilities", placeholder: "What should the team be able to do after training? Specific tools or workflows?" },
      { name: "timeline", type: "text", label: "Training Timeline", placeholder: "e.g. 30-day sprint, 8-week program, 3 months" },
    ],
  },
  {
    name: "AI Project Requirements Document Generator",
    slug: "ai-project-requirements-doc-generator",
    description: "Generate a complete AI project requirements document (AI-PRD) with scope, success metrics, and technical specs",
    isAClass: false,
    inputs: [
      { name: "project_name", type: "text", label: "Project Name", placeholder: "e.g. Customer Support Chatbot V2, AI-Powered Lead Scorer" },
      { name: "problem_statement", type: "textarea", label: "Problem Statement", placeholder: "What problem does this AI project solve? What is the current pain point and its business impact?" },
      { name: "stakeholders", type: "text", label: "Key Stakeholders", placeholder: "e.g. Head of Customer Success, CTO, Finance team" },
      { name: "success_metrics", type: "text", label: "Success Metrics", placeholder: "e.g. 40% reduction in support tickets, CSAT > 4.5, < 500ms response time" },
    ],
  },
  {
    name: "Prompt Engineering Best Practices Generator",
    slug: "prompt-engineering-best-practices-generator",
    description: "Generate domain-specific prompt engineering guidelines and best practices for your use case and AI model",
    isAClass: false,
    inputs: [
      { name: "use_case_domain", type: "text", label: "Use Case Domain", placeholder: "e.g. Marketing copy, Legal document review, Code generation, Customer support, Data analysis" },
      { name: "model_type", type: "text", label: "AI Model Type", placeholder: "e.g. GPT-4o, Claude Sonnet 3.7, Gemini 2.0, Open-source LLM" },
      { name: "specific_challenges", type: "textarea", label: "Specific Challenges or Goals", placeholder: "What problems are you facing with prompting? What outputs are inconsistent or low quality?" },
    ],
  },
];

// ─── Prompt Generator ─────────────────────────────────────────────────────────

async function generatePrompt(tool) {
  const inputNames = tool.inputs.map((f) => `{${f.name}}`).join(", ");
  const inputDescriptions = tool.inputs.map((f) => `  - {${f.name}}: ${f.label}`).join("\n");

  const aClassNote = tool.isAClass
    ? `\nIMPORTANT: This is a text optimization tool. Structure your output EXACTLY as:
=== OPTIMIZED CONTENT ===
[Complete optimized document here]

=== CHANGES MADE ===
[Bullet list of changes and rationale]`
    : "";

  const systemMsg = `You are an expert prompt engineer creating a production-quality system prompt for an AI productivity tool.

Requirements:
1. Start with expert role: "You are an expert [role] with 15+ years of experience..."
2. List input variables clearly: ${inputNames}
3. STEP 1 — INTERNAL ANALYSIS (do not output this): 3–5 internal planning steps the AI should complete silently
4. Output a COMPLETE, PROFESSIONAL result:
   - Clear section headings (## Section Name)
   - Structured tables or bullet lists where appropriate
   - Specific, actionable content (not vague)
   - 6–8 distinct sections for analysis/generation tools
   - Minimum 800 words in the final prompt
5. End with 2–3 expert pro tips
6. Return ONLY the prompt text. No JSON, no extra explanation.${aClassNote}`;

  const userMsg = `Tool name: ${tool.name}
Purpose: ${tool.description}
Input variables:
${inputDescriptions}

Write the complete system prompt for this tool.`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemMsg },
      { role: "user", content: userMsg },
    ],
    max_tokens: 2500,
    temperature: 0.7,
  });
  return res.choices[0].message.content.trim();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function insertTool(toolkitId, tool, sortOrder) {
  const prompt = await generatePrompt(tool);
  const { error } = await supabase.from("tools").insert({
    toolkit_id: toolkitId,
    name: tool.name,
    slug: tool.slug,
    description: tool.description,
    tool_type: "template",
    inputs_schema: tool.inputs,
    prompt_template: prompt,
    is_active: true,
    auto_generated: true,
    sort_order: sortOrder,
  });

  if (error) {
    if (error.message.includes("duplicate") || error.message.includes("unique")) {
      console.log(`  ⏭  Skip (already exists): ${tool.slug}`);
      return "skip";
    }
    console.error(`  ❌ Failed: ${tool.slug} — ${error.message}`);
    return "fail";
  }
  console.log(`  ✅ ${tool.isAClass ? "[A]" : "[B/C]"} ${tool.slug} (${prompt.length} chars)`);
  return "ok";
}

async function main() {
  const filter = process.argv[2]; // optional: "finance" | "ai-workflow"

  const { data: toolkits } = await supabase.from("toolkits").select("id,slug");
  const tkMap = Object.fromEntries(toolkits.map((t) => [t.slug, t.id]));

  const batches = [
    { slug: "finance", tools: FINANCE_TOOLS },
    { slug: "ai-workflow", tools: AI_WORKFLOW_TOOLS },
  ].filter((b) => !filter || b.slug === filter);

  for (const { slug, tools } of batches) {
    const tkId = tkMap[slug];
    if (!tkId) { console.error(`Toolkit not found: ${slug}`); continue; }

    // Get current max sort_order
    const { data: existing } = await supabase.from("tools").select("sort_order").eq("toolkit_id", tkId).order("sort_order", { ascending: false }).limit(1);
    let so = existing?.[0]?.sort_order ?? 10;

    console.log(`\n📦 Adding ${tools.length} tools to ${slug}...\n`);
    let ok = 0, skip = 0, fail = 0;
    for (const tool of tools) {
      so++;
      const r = await insertTool(tkId, tool, so);
      if (r === "ok") ok++;
      else if (r === "skip") skip++;
      else fail++;
    }
    console.log(`\n📊 ${slug}: ${ok} added, ${skip} skipped, ${fail} failed`);
  }

  const { count } = await supabase.from("tools").select("*", { count: "exact", head: true }).eq("is_active", true);
  console.log(`\n🎉 Total active tools: ${count}`);
}

main().catch(console.error);
