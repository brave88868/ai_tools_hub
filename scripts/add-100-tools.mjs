/**
 * 100-Tool Expansion Plan — adds 50 net-new tools across 8 existing toolkits + 2 new toolkits
 * Run: node scripts/add-100-tools.mjs
 * Optional: node scripts/add-100-tools.mjs finance     (only that toolkit)
 *           node scripts/add-100-tools.mjs existing    (only existing toolkit additions)
 *           node scripts/add-100-tools.mjs new         (only new toolkits)
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

// ─── Tool Definitions ─────────────────────────────────────────────────────────

const TOOLS_EXISTING_TOOLKITS = [
  // ── jobseeker (4 new) ──────────────────────────────────────────────────────
  {
    toolkitSlug: "jobseeker",
    name: "LinkedIn Summary Generator",
    slug: "linkedin-summary-generator",
    description: "Generate a compelling LinkedIn About section that showcases your expertise and attracts recruiters",
    inputs: [
      { name: "current_role", type: "text", label: "Current Job Title", placeholder: "e.g. Senior Software Engineer at Google" },
      { name: "experience_summary", type: "textarea", label: "Career Background & Achievements", placeholder: "Briefly describe your career history, key achievements, and areas of expertise..." },
      { name: "target_role", type: "text", label: "Target Role or Industry", placeholder: "e.g. Product Manager at a tech startup" },
      { name: "key_skills", type: "text", label: "Key Skills & Tools", placeholder: "e.g. Python, Leadership, Product Strategy, Agile" },
    ],
  },
  {
    toolkitSlug: "jobseeker",
    name: "Interview Question Generator",
    slug: "interview-question-generator",
    description: "Generate role-specific interview questions so you can practice and walk in fully prepared",
    inputs: [
      { name: "job_title", type: "text", label: "Job Title Applying For", placeholder: "e.g. Marketing Manager" },
      { name: "job_description", type: "textarea", label: "Job Description (optional)", placeholder: "Paste the job posting to generate targeted questions..." },
      { name: "experience_level", type: "text", label: "Experience Level", placeholder: "e.g. Entry-level, 3 years mid-level, Senior" },
      { name: "interview_type", type: "text", label: "Interview Type", placeholder: "e.g. Behavioral, Technical, Case Study, General" },
    ],
  },
  {
    toolkitSlug: "jobseeker",
    name: "Career Change Plan Generator",
    slug: "career-change-plan-generator",
    description: "Create a structured roadmap for transitioning into a new career, including skill gaps, milestones, and action steps",
    inputs: [
      { name: "current_career", type: "text", label: "Current Career & Years of Experience", placeholder: "e.g. Accountant with 7 years experience" },
      { name: "target_career", type: "text", label: "Target Career / Role", placeholder: "e.g. UX Designer, Data Analyst, Product Manager" },
      { name: "timeline", type: "text", label: "Desired Transition Timeline", placeholder: "e.g. 6 months, 12 months" },
      { name: "transferable_skills", type: "textarea", label: "Transferable Skills", placeholder: "List skills from your current career that apply to the new field..." },
    ],
  },
  {
    toolkitSlug: "jobseeker",
    name: "Professional Bio Generator",
    slug: "professional-bio-generator",
    description: "Create a polished professional bio for your website, speaker profile, or conference introduction",
    inputs: [
      { name: "name", type: "text", label: "Full Name", placeholder: "e.g. Sarah Johnson" },
      { name: "current_role", type: "text", label: "Current Role & Company", placeholder: "e.g. Head of Product at TechCo" },
      { name: "background", type: "textarea", label: "Career Background & Key Achievements", placeholder: "Key roles, accomplishments, and milestones in your career..." },
      { name: "bio_length", type: "text", label: "Desired Bio Length", placeholder: "e.g. Short (50 words), Medium (150 words), Long (250 words)" },
      { name: "tone", type: "text", label: "Tone", placeholder: "e.g. Formal, Conversational, Third-person narrative" },
    ],
  },

  // ── marketing (3 new) ──────────────────────────────────────────────────────
  {
    toolkitSlug: "marketing",
    name: "Blog Article Generator",
    slug: "blog-article-generator",
    description: "Generate a complete, SEO-optimized blog article with introduction, structured sections, and conclusion",
    inputs: [
      { name: "topic", type: "text", label: "Blog Topic", placeholder: "e.g. How to improve team productivity with AI tools" },
      { name: "target_audience", type: "text", label: "Target Audience", placeholder: "e.g. Small business owners, HR managers, Startup founders" },
      { name: "tone", type: "text", label: "Tone & Style", placeholder: "e.g. Professional, Conversational, Educational, Authoritative" },
      { name: "word_count", type: "text", label: "Approximate Word Count", placeholder: "e.g. 800, 1200, 2000" },
      { name: "keywords", type: "text", label: "Target Keywords (optional)", placeholder: "e.g. AI productivity tools, team efficiency software" },
    ],
  },
  {
    toolkitSlug: "marketing",
    name: "Sales Page Copy Generator",
    slug: "sales-page-copy-generator",
    description: "Generate high-converting sales page copy with compelling headlines, benefit bullets, objection handling, and CTAs",
    inputs: [
      { name: "product_name", type: "text", label: "Product or Service Name", placeholder: "e.g. ProTrack CRM Software" },
      { name: "product_description", type: "textarea", label: "Product Description", placeholder: "What does it do? Who is it for? What problem does it solve?" },
      { name: "target_audience", type: "text", label: "Target Customer", placeholder: "e.g. Freelancers, SaaS startups, E-commerce brands" },
      { name: "price", type: "text", label: "Price Point", placeholder: "e.g. $49/month, $299 one-time payment" },
      { name: "key_benefits", type: "textarea", label: "Key Benefits (3–5)", placeholder: "List the main outcomes/benefits your product delivers..." },
    ],
  },
  {
    toolkitSlug: "marketing",
    name: "Brand Slogan Generator",
    slug: "brand-slogan-generator",
    description: "Generate memorable, impactful brand slogans and taglines that capture your brand essence",
    inputs: [
      { name: "brand_name", type: "text", label: "Brand Name", placeholder: "e.g. Lumio" },
      { name: "product_service", type: "text", label: "Product or Service", placeholder: "e.g. Smart home lighting system" },
      { name: "brand_values", type: "text", label: "Brand Values / Personality", placeholder: "e.g. Innovative, sustainable, premium quality" },
      { name: "target_audience", type: "text", label: "Target Audience", placeholder: "e.g. Tech-savvy homeowners, design enthusiasts" },
    ],
  },

  // ── business (6 new) ───────────────────────────────────────────────────────
  {
    toolkitSlug: "business",
    name: "Market Analysis Generator",
    slug: "market-analysis-generator",
    description: "Generate a comprehensive market analysis report including market size, trends, opportunities, and entry strategy",
    inputs: [
      { name: "industry", type: "text", label: "Industry or Market", placeholder: "e.g. Electric vehicle charging, B2B SaaS project management" },
      { name: "geography", type: "text", label: "Target Geography", placeholder: "e.g. North America, Global, Southeast Asia" },
      { name: "business_context", type: "textarea", label: "Business Context", placeholder: "Describe your business, product, or why you need this analysis..." },
    ],
  },
  {
    toolkitSlug: "business",
    name: "Business Idea Generator",
    slug: "business-idea-generator",
    description: "Generate validated business ideas based on your skills, interests, and market opportunities with feasibility notes",
    inputs: [
      { name: "skills", type: "text", label: "Your Skills & Expertise", placeholder: "e.g. Marketing, Software development, Finance, Design" },
      { name: "interests", type: "text", label: "Interests or Passions", placeholder: "e.g. Health & fitness, Travel, Education, Sustainability" },
      { name: "budget", type: "text", label: "Starting Budget", placeholder: "e.g. Under $1,000, $5,000–$20,000, $50,000+" },
      { name: "business_model", type: "text", label: "Preferred Business Model", placeholder: "e.g. SaaS, E-commerce, Consulting, Marketplace, Agency" },
    ],
  },
  {
    toolkitSlug: "business",
    name: "Pricing Strategy Generator",
    slug: "pricing-strategy-generator",
    description: "Generate a data-driven pricing strategy with pricing models, tier recommendations, and positioning guidance",
    inputs: [
      { name: "product_service", type: "text", label: "Product or Service", placeholder: "e.g. B2B SaaS project management tool" },
      { name: "target_market", type: "text", label: "Target Market", placeholder: "e.g. SMBs, Enterprise companies, Freelancers" },
      { name: "cost_structure", type: "textarea", label: "Cost Structure (optional)", placeholder: "Your main costs: hosting, support, marketing, COGS, team..." },
      { name: "competitors", type: "text", label: "Key Competitors & Their Pricing", placeholder: "e.g. Competitor A $50/user/mo, Competitor B $200/mo flat fee" },
    ],
  },
  {
    toolkitSlug: "business",
    name: "Go-to-Market Strategy Generator",
    slug: "go-to-market-strategy-generator",
    description: "Create a comprehensive GTM plan with target segment, channels, messaging, launch milestones, and success metrics",
    inputs: [
      { name: "product_name", type: "text", label: "Product or Service Name", placeholder: "e.g. DataSync Pro" },
      { name: "description", type: "textarea", label: "Product Description & Value Prop", placeholder: "What it does, who it is for, key value proposition..." },
      { name: "target_segment", type: "text", label: "Target Customer Segment", placeholder: "e.g. Mid-market B2B SaaS companies, 50–500 employees" },
      { name: "launch_timeline", type: "text", label: "Launch Timeline", placeholder: "e.g. 90 days, 6 months" },
    ],
  },
  {
    toolkitSlug: "business",
    name: "Startup Name Generator",
    slug: "startup-name-generator",
    description: "Generate creative, memorable startup names with domain availability guidance and brand fit rationale",
    inputs: [
      { name: "description", type: "text", label: "What Does Your Startup Do?", placeholder: "e.g. AI-powered inventory management for small retailers" },
      { name: "industry", type: "text", label: "Industry", placeholder: "e.g. FinTech, HealthTech, E-commerce, EdTech" },
      { name: "name_style", type: "text", label: "Name Style Preference", placeholder: "e.g. Short/punchy, Descriptive, Invented/coined word, Metaphorical" },
      { name: "keywords", type: "text", label: "Keywords to Emphasize or Avoid", placeholder: "e.g. Include: smart, fast — Avoid: traditional industry jargon" },
    ],
  },
  {
    toolkitSlug: "business",
    name: "Business Model Canvas Generator",
    slug: "business-model-canvas-generator",
    description: "Generate a complete Business Model Canvas covering all 9 building blocks for your business idea",
    inputs: [
      { name: "business_name", type: "text", label: "Business Name", placeholder: "e.g. EduLearn Platform" },
      { name: "description", type: "textarea", label: "Business Description", placeholder: "What does your business do? What problem does it solve? Who are your customers?" },
      { name: "target_customers", type: "text", label: "Target Customers", placeholder: "e.g. College students, Corporate training departments, SMBs" },
    ],
  },

  // ── productivity (1 new) ───────────────────────────────────────────────────
  {
    toolkitSlug: "productivity",
    name: "Email Reply Generator",
    slug: "email-reply-generator",
    description: "Generate professional, context-aware email replies quickly to maintain inbox efficiency and communication quality",
    inputs: [
      { name: "original_email", type: "textarea", label: "Original Email (paste here)", placeholder: "Paste the email you need to reply to..." },
      { name: "reply_intent", type: "text", label: "Your Reply Intent", placeholder: "e.g. Accept the meeting, Decline politely, Request more info, Apologize" },
      { name: "tone", type: "text", label: "Tone", placeholder: "e.g. Professional, Friendly, Brief, Formal" },
      { name: "additional_points", type: "textarea", label: "Additional Points to Include (optional)", placeholder: "Any specific information or talking points to add..." },
    ],
  },

  // ── data-analytics (6 new) ─────────────────────────────────────────────────
  {
    toolkitSlug: "data-analytics",
    name: "KPI Recommendation Generator",
    slug: "kpi-recommendation-generator",
    description: "Generate relevant KPIs and success metrics tailored to your team function, stage, and business goals",
    inputs: [
      { name: "department", type: "text", label: "Department or Team", placeholder: "e.g. Marketing, Sales, Product, Customer Success, Operations" },
      { name: "business_goals", type: "textarea", label: "Business Goals", placeholder: "What are you trying to achieve? e.g. Increase revenue, Reduce churn, Improve NPS" },
      { name: "current_metrics", type: "text", label: "Metrics You Currently Track (optional)", placeholder: "e.g. MRR, CAC, Monthly active users, Support ticket volume" },
    ],
  },
  {
    toolkitSlug: "data-analytics",
    name: "Root Cause Analysis Generator",
    slug: "root-cause-analysis-generator",
    description: "Perform structured root cause analysis using 5 Whys and Fishbone frameworks to identify and address core issues",
    inputs: [
      { name: "problem", type: "textarea", label: "Problem Statement", placeholder: "Clearly describe the issue. Include when it started, what changed, symptoms, and business impact..." },
      { name: "contributing_factors", type: "textarea", label: "Known Contributing Factors (optional)", placeholder: "List any factors you suspect may have contributed to the problem..." },
      { name: "context", type: "text", label: "Business Context", placeholder: "e.g. SaaS product, Manufacturing line, Customer support team, Marketing campaign" },
    ],
  },
  {
    toolkitSlug: "data-analytics",
    name: "Trend Analysis Generator",
    slug: "trend-analysis-generator",
    description: "Analyze data trends and generate narrative insights with pattern explanations and strategic recommendations",
    inputs: [
      { name: "data_summary", type: "textarea", label: "Data or Trend Description", placeholder: "Describe or paste the data/trend you want analyzed. Include numbers, time periods, context..." },
      { name: "metric", type: "text", label: "Metric Being Analyzed", placeholder: "e.g. Monthly active users, Revenue, Conversion rate, Customer churn rate" },
      { name: "time_period", type: "text", label: "Time Period", placeholder: "e.g. Q1 2024 to Q1 2025, Last 12 months" },
      { name: "business_context", type: "text", label: "Business Context", placeholder: "e.g. E-commerce startup, B2B SaaS, Retail chain, 3 years in market" },
    ],
  },
  {
    toolkitSlug: "data-analytics",
    name: "Decision Support Summary Generator",
    slug: "decision-support-summary-generator",
    description: "Generate a structured decision brief that synthesizes data, options, and recommendations for executive decision-making",
    inputs: [
      { name: "decision", type: "text", label: "Decision to Be Made", placeholder: "e.g. Should we expand to the EU market? Should we acquire this company?" },
      { name: "context", type: "textarea", label: "Background & Context", placeholder: "Relevant data, current situation, constraints, and key stakeholders..." },
      { name: "options", type: "textarea", label: "Options Being Considered", placeholder: "List 2–4 options you are weighing..." },
      { name: "criteria", type: "text", label: "Key Decision Criteria", placeholder: "e.g. Cost, Speed to market, Risk level, Strategic alignment" },
    ],
  },
  {
    toolkitSlug: "data-analytics",
    name: "Scenario Analysis Generator",
    slug: "scenario-analysis-generator",
    description: "Model best/base/worst case scenarios for business decisions with outcome estimates and strategic implications",
    inputs: [
      { name: "situation", type: "textarea", label: "Business Situation / Decision", placeholder: "Describe the key decision, project, or initiative you want to model scenarios for..." },
      { name: "key_variables", type: "text", label: "Key Variables", placeholder: "e.g. Conversion rate, Pricing, Market growth rate, Churn rate" },
      { name: "time_horizon", type: "text", label: "Time Horizon", placeholder: "e.g. 6 months, 1 year, 3 years" },
    ],
  },
  {
    toolkitSlug: "data-analytics",
    name: "Trade-off Analysis Generator",
    slug: "tradeoff-analysis-tool",
    description: "Analyze competing options with structured trade-off frameworks to support better-informed strategic decisions",
    inputs: [
      { name: "decision", type: "text", label: "Decision or Problem", placeholder: "e.g. Build vs. Buy for a new CRM system, Hire vs. Outsource engineering" },
      { name: "options", type: "textarea", label: "Options to Compare (2–4)", placeholder: "Describe each option being considered..." },
      { name: "criteria", type: "textarea", label: "Evaluation Criteria & Priority", placeholder: "e.g. Cost (high priority), Implementation time (medium), Scalability (high)" },
      { name: "constraints", type: "text", label: "Hard Constraints", placeholder: "e.g. Budget < $50k, Must integrate with Salesforce, 3-month deadline" },
    ],
  },

  // ── legal (1 new) ──────────────────────────────────────────────────────────
  {
    toolkitSlug: "legal",
    name: "NDA Generator",
    slug: "nda-generator",
    description: "Generate a comprehensive Non-Disclosure Agreement tailored to your parties, purpose, and jurisdiction",
    inputs: [
      { name: "disclosing_party", type: "text", label: "Disclosing Party", placeholder: "e.g. ABC Corp (company) or John Smith (individual)" },
      { name: "receiving_party", type: "text", label: "Receiving Party", placeholder: "e.g. XYZ Ltd (company) or Jane Doe (consultant)" },
      { name: "purpose", type: "text", label: "Purpose of Disclosure", placeholder: "e.g. Evaluating a business partnership, Software development project" },
      { name: "duration", type: "text", label: "Confidentiality Duration", placeholder: "e.g. 2 years, 5 years, indefinitely" },
      { name: "jurisdiction", type: "text", label: "Governing Law Jurisdiction", placeholder: "e.g. State of California, England and Wales, Singapore" },
    ],
  },

  // ── exam (2 new) ───────────────────────────────────────────────────────────
  {
    toolkitSlug: "exam",
    name: "Learning Roadmap Generator",
    slug: "learning-roadmap-generator",
    description: "Create a personalized learning roadmap with phases, milestones, resources, and timelines for mastering any skill",
    inputs: [
      { name: "skill", type: "text", label: "Skill or Subject to Learn", placeholder: "e.g. Machine Learning, Spanish language, Digital Marketing" },
      { name: "current_level", type: "text", label: "Current Level", placeholder: "e.g. Complete beginner, Intermediate, Have basic knowledge" },
      { name: "goal", type: "text", label: "Learning Goal", placeholder: "e.g. Get a job as data analyst, Pass AWS certification exam, Build side project" },
      { name: "time_available", type: "text", label: "Time Available per Week", placeholder: "e.g. 5 hours/week, 2 hours/day" },
      { name: "timeline", type: "text", label: "Target Timeline", placeholder: "e.g. 3 months, 6 months, 1 year" },
    ],
  },
  {
    toolkitSlug: "exam",
    name: "Academic Abstract Generator",
    slug: "academic-abstract-generator",
    description: "Generate a well-structured academic abstract for research papers, theses, and journal submissions",
    inputs: [
      { name: "title", type: "text", label: "Paper Title", placeholder: "e.g. The Impact of Remote Work on Employee Productivity in Tech Firms" },
      { name: "research_summary", type: "textarea", label: "Research Summary", placeholder: "Describe your research: background/problem, methodology, key findings, and conclusions..." },
      { name: "field", type: "text", label: "Academic Field", placeholder: "e.g. Psychology, Computer Science, Business Management, Medicine" },
      { name: "word_limit", type: "text", label: "Abstract Word Limit", placeholder: "e.g. 150, 250, 300 words" },
    ],
  },

  // ── creator (7 new) ────────────────────────────────────────────────────────
  {
    toolkitSlug: "creator",
    name: "Story Idea Generator",
    slug: "story-idea-generator",
    description: "Generate compelling story ideas with premise, central conflict, and character hooks for any genre",
    inputs: [
      { name: "genre", type: "text", label: "Genre", placeholder: "e.g. Thriller, Romance, Sci-fi, Literary fiction, Fantasy" },
      { name: "medium", type: "text", label: "Medium", placeholder: "e.g. Short story, Novel, Screenplay, Podcast narrative series" },
      { name: "themes", type: "text", label: "Themes or Elements to Include", placeholder: "e.g. Betrayal, Redemption, AI ethics, Family secrets" },
      { name: "count", type: "text", label: "Number of Ideas", placeholder: "e.g. 5, 10" },
    ],
  },
  {
    toolkitSlug: "creator",
    name: "Story Plot Generator",
    slug: "story-plot-generator",
    description: "Develop a full story plot with three-act structure, key turning points, and scene-by-scene breakdown",
    inputs: [
      { name: "story_premise", type: "textarea", label: "Story Premise or Concept", placeholder: "Describe your story concept, protagonist, and central conflict..." },
      { name: "genre", type: "text", label: "Genre", placeholder: "e.g. Fantasy adventure, Psychological thriller, Contemporary romance" },
      { name: "length", type: "text", label: "Story Length", placeholder: "e.g. Short story (~3000 words), Feature film, Full novel" },
    ],
  },
  {
    toolkitSlug: "creator",
    name: "Character Generator",
    slug: "character-generator",
    description: "Create detailed, three-dimensional characters with backstory, personality, motivations, and distinctive voice",
    inputs: [
      { name: "character_role", type: "text", label: "Character Role", placeholder: "e.g. Protagonist, Villain, Mentor, Supporting character" },
      { name: "story_context", type: "textarea", label: "Story Context", placeholder: "Brief description of your story world, genre, and plot..." },
      { name: "traits", type: "text", label: "Key Traits to Include", placeholder: "e.g. Ambitious but insecure, Former soldier, Secret past" },
      { name: "genre", type: "text", label: "Genre", placeholder: "e.g. Contemporary fiction, Fantasy, Sci-fi, Historical drama" },
    ],
  },
  {
    toolkitSlug: "creator",
    name: "Video Idea Generator",
    slug: "video-idea-generator",
    description: "Generate high-engagement video content ideas with titles, hooks, and key talking points for your channel",
    inputs: [
      { name: "channel_topic", type: "text", label: "Channel Topic / Niche", placeholder: "e.g. Personal finance for millennials, Fitness for beginners" },
      { name: "platform", type: "text", label: "Platform", placeholder: "e.g. YouTube, TikTok, Instagram Reels, LinkedIn Video" },
      { name: "target_audience", type: "text", label: "Target Audience", placeholder: "e.g. Young professionals 25–35, Beginner investors" },
      { name: "count", type: "text", label: "Number of Ideas", placeholder: "e.g. 10, 20" },
    ],
  },
  {
    toolkitSlug: "creator",
    name: "Podcast Topic Generator",
    slug: "podcast-topic-generator",
    description: "Generate engaging podcast episode topics with titles, hook statements, and key discussion questions",
    inputs: [
      { name: "podcast_niche", type: "text", label: "Podcast Niche / Focus Area", placeholder: "e.g. Entrepreneurship, True crime, Tech trends, Mental health" },
      { name: "target_listener", type: "text", label: "Target Listener", placeholder: "e.g. Early-stage founders, Gen Z professionals, Parents" },
      { name: "format", type: "text", label: "Episode Format", placeholder: "e.g. Solo commentary, Guest interviews, Co-host discussion" },
      { name: "count", type: "text", label: "Number of Topics", placeholder: "e.g. 10, 20" },
    ],
  },
  {
    toolkitSlug: "creator",
    name: "Meme Caption Generator",
    slug: "meme-caption-generator",
    description: "Generate witty, relatable meme captions that resonate with your audience and drive social media engagement",
    inputs: [
      { name: "topic", type: "text", label: "Topic or Context", placeholder: "e.g. Working from home, Startup life, Monday mornings, Developer struggles" },
      { name: "audience", type: "text", label: "Target Audience", placeholder: "e.g. Software developers, Marketers, Remote workers, Entrepreneurs" },
      { name: "tone", type: "text", label: "Humor Style", placeholder: "e.g. Dry wit, Relatable, Self-deprecating, Corporate satire, Absurdist" },
      { name: "count", type: "text", label: "Number of Captions", placeholder: "e.g. 5, 10" },
    ],
  },
  {
    toolkitSlug: "creator",
    name: "Creative Writing Prompt Generator",
    slug: "creative-writing-prompt-generator",
    description: "Generate unique creative writing prompts that spark imagination and help overcome writer's block",
    inputs: [
      { name: "genre", type: "text", label: "Genre", placeholder: "e.g. Fantasy, Horror, Romance, Literary fiction, Sci-fi, Mystery" },
      { name: "type", type: "text", label: "Prompt Type", placeholder: "e.g. Character-focused, Setting-based, Dialogue starter, Opening line, Scenario" },
      { name: "difficulty", type: "text", label: "Complexity Level", placeholder: "e.g. Simple (beginners), Intermediate, Complex (experienced writers)" },
      { name: "count", type: "text", label: "Number of Prompts", placeholder: "e.g. 5, 10, 20" },
    ],
  },
];

// ─── New Toolkits ──────────────────────────────────────────────────────────────

const NEW_TOOLKITS = [
  {
    slug: "finance",
    name: "Finance & Investment Tools",
    description: "AI tools for budgeting, expense analysis, investment planning, and financial strategy",
    price_monthly: 19,
    icon: "💰",
    sort_order: 23,
    tools: [
      {
        name: "Budget Planner Generator",
        slug: "budget-planner-generator",
        description: "Create a personalized budget plan with spending categories, savings allocations, and monthly breakdown",
        inputs: [
          { name: "monthly_income", type: "text", label: "Monthly Take-Home Income", placeholder: "e.g. $5,000" },
          { name: "fixed_expenses", type: "textarea", label: "Fixed Monthly Expenses", placeholder: "List fixed costs: rent $1,500, car payment $300, subscriptions $100..." },
          { name: "financial_goals", type: "textarea", label: "Financial Goals", placeholder: "e.g. Save $10,000 emergency fund in 12 months, Pay off $5,000 credit card" },
          { name: "lifestyle", type: "text", label: "Lifestyle & Priorities", placeholder: "e.g. Dining out often, Gym membership, Family of 4, Travel enthusiast" },
        ],
      },
      {
        name: "Expense Analysis Tool",
        slug: "expense-analysis-tool",
        description: "Analyze your spending data to identify patterns, overspending categories, and savings opportunities",
        inputs: [
          { name: "expense_data", type: "textarea", label: "Expense Data (paste or describe)", placeholder: "Paste your expense list or describe spending by category with amounts..." },
          { name: "period", type: "text", label: "Time Period", placeholder: "e.g. Last month, Q1 2025, January 2025" },
          { name: "monthly_income", type: "text", label: "Monthly Income", placeholder: "e.g. $6,000" },
          { name: "goals", type: "text", label: "Financial Goals", placeholder: "e.g. Reduce spending 20%, Save for home down payment" },
        ],
      },
      {
        name: "Financial Summary Generator",
        slug: "financial-summary-generator",
        description: "Generate a clear financial health summary with key metrics, performance assessment, and actionable recommendations",
        inputs: [
          { name: "financial_data", type: "textarea", label: "Financial Data", placeholder: "Describe your financial situation: income, assets, debts, savings, monthly expenses..." },
          { name: "period", type: "text", label: "Reporting Period", placeholder: "e.g. Q1 2025, Full year 2024, Monthly snapshot" },
          { name: "audience", type: "text", label: "Report Audience", placeholder: "e.g. Personal review, Board presentation, Investor update" },
        ],
      },
      {
        name: "Investment Thesis Generator",
        slug: "investment-thesis-generator",
        description: "Generate a structured investment thesis for stocks, startups, or assets with risk/return analysis",
        inputs: [
          { name: "investment_target", type: "text", label: "Investment Target", placeholder: "e.g. Tesla stock, Series A HealthTech startup, Austin TX real estate" },
          { name: "investment_context", type: "textarea", label: "Research Notes & Context", placeholder: "Key facts, market data, competitive position, financials you have gathered..." },
          { name: "investment_horizon", type: "text", label: "Investment Horizon", placeholder: "e.g. 6–12 months, 3–5 years, Long-term hold (10+ years)" },
          { name: "risk_tolerance", type: "text", label: "Risk Tolerance", placeholder: "e.g. Conservative, Moderate, Aggressive growth" },
        ],
      },
      {
        name: "Startup Valuation Estimator",
        slug: "startup-valuation-estimator",
        description: "Estimate startup valuation using Berkus, Scorecard, and comparable methods with explanations",
        inputs: [
          { name: "startup_name", type: "text", label: "Startup Name", placeholder: "e.g. DataFlow AI" },
          { name: "stage", type: "text", label: "Funding Stage", placeholder: "e.g. Pre-seed, Seed, Series A" },
          { name: "description", type: "textarea", label: "Business Description & Traction", placeholder: "What the startup does, market size, revenue, users, growth metrics..." },
          { name: "financials", type: "textarea", label: "Key Financials (optional)", placeholder: "ARR, MRR, burn rate, runway, team size, number of paying customers..." },
        ],
      },
      {
        name: "ROI Analysis Generator",
        slug: "roi-analysis-generator",
        description: "Generate a comprehensive ROI analysis with cost-benefit breakdown, payback period, and go/no-go recommendation",
        inputs: [
          { name: "investment_name", type: "text", label: "Investment or Project", placeholder: "e.g. New CRM System, Marketing Campaign, Hiring a Sales Rep" },
          { name: "costs", type: "textarea", label: "All Investment Costs", placeholder: "List costs: upfront, recurring, indirect (e.g., team time, training)..." },
          { name: "expected_benefits", type: "textarea", label: "Expected Benefits / Returns", placeholder: "Revenue increase, cost savings, efficiency gains, churn reduction..." },
          { name: "time_horizon", type: "text", label: "Time Horizon", placeholder: "e.g. 12 months, 3 years" },
        ],
      },
      {
        name: "Personal Finance Plan Generator",
        slug: "personal-finance-plan-generator",
        description: "Create a comprehensive personal finance plan covering income, debt, savings, and investment strategy",
        inputs: [
          { name: "current_situation", type: "textarea", label: "Current Financial Situation", placeholder: "Income, expenses, debts, savings, investments, assets..." },
          { name: "goals", type: "textarea", label: "Financial Goals", placeholder: "Short-term (1 year) and long-term (5–10 year) financial goals..." },
          { name: "age", type: "text", label: "Age", placeholder: "e.g. 28" },
          { name: "risk_profile", type: "text", label: "Risk Profile", placeholder: "e.g. Conservative, Balanced, Aggressive" },
        ],
      },
      {
        name: "Savings Strategy Generator",
        slug: "savings-strategy-generator",
        description: "Generate a personalized savings strategy with methods, milestones, and automation recommendations",
        inputs: [
          { name: "income", type: "text", label: "Monthly Take-Home Income", placeholder: "e.g. $4,500" },
          { name: "current_savings", type: "text", label: "Current Savings", placeholder: "e.g. $2,000 checking, $5,000 savings account" },
          { name: "saving_goal", type: "textarea", label: "Savings Goal", placeholder: "What are you saving for? How much? By when?" },
          { name: "current_habits", type: "text", label: "Current Saving Habits", placeholder: "e.g. Save $200/month, No regular savings, Have an emergency fund" },
        ],
      },
      {
        name: "Portfolio Summary Generator",
        slug: "portfolio-summary-generator",
        description: "Generate a professional portfolio summary with allocation analysis, performance review, and rebalancing suggestions",
        inputs: [
          { name: "portfolio_data", type: "textarea", label: "Portfolio Holdings", placeholder: "List investments by type and value: US stocks $30k (40%), Bonds $15k (20%), etc." },
          { name: "investment_goals", type: "text", label: "Investment Goals", placeholder: "e.g. Retirement in 20 years, Capital growth, Income generation" },
          { name: "risk_tolerance", type: "text", label: "Risk Tolerance", placeholder: "e.g. Conservative, Moderate, Aggressive" },
        ],
      },
      {
        name: "Financial Risk Assessment Generator",
        slug: "financial-risk-assessment-generator",
        description: "Assess financial risks for a business, project, or investment with mitigation strategies and risk scoring",
        inputs: [
          { name: "entity", type: "text", label: "Business / Project / Investment", placeholder: "e.g. Expanding to a new market, Launching new product line, Series A fundraise" },
          { name: "description", type: "textarea", label: "Situation Description", placeholder: "Describe the financial situation, key activities, and context in detail..." },
          { name: "known_risks", type: "textarea", label: "Known Risk Factors", placeholder: "List any risks you are already aware of..." },
        ],
      },
    ],
  },
  {
    slug: "ai-workflow",
    name: "AI Workflow Tools",
    description: "AI tools for AI adoption strategy, use case discovery, workflow design, governance, and team readiness",
    price_monthly: 9,
    icon: "🔄",
    sort_order: 24,
    tools: [
      {
        name: "AI Tool Comparison Generator",
        slug: "ai-tool-comparison-generator",
        description: "Compare AI tools side-by-side with structured evaluation on features, pricing, use cases, and limitations",
        inputs: [
          { name: "use_case", type: "text", label: "Your Use Case", placeholder: "e.g. AI writing assistant, AI coding tool, AI customer support chatbot" },
          { name: "tools_to_compare", type: "text", label: "Tools to Compare", placeholder: "e.g. ChatGPT vs Claude vs Gemini, or describe the category" },
          { name: "team_context", type: "text", label: "Team Size & Context", placeholder: "e.g. Startup team of 5, Enterprise 100+ users, Solo freelancer" },
          { name: "budget", type: "text", label: "Budget Constraint", placeholder: "e.g. Under $50/month, Up to $500/month per team" },
        ],
      },
      {
        name: "AI Use Case Generator",
        slug: "ai-use-case-generator",
        description: "Discover high-impact AI use cases tailored to your industry, department, and specific workflow challenges",
        inputs: [
          { name: "industry", type: "text", label: "Industry", placeholder: "e.g. Healthcare, Retail, Financial services, Education, Manufacturing" },
          { name: "department", type: "text", label: "Department or Function", placeholder: "e.g. Marketing, HR, Operations, Customer Service, Finance" },
          { name: "current_pain_points", type: "textarea", label: "Current Pain Points", placeholder: "What are your biggest inefficiencies, bottlenecks, or time-wasting tasks?" },
          { name: "ai_maturity", type: "text", label: "Current AI Maturity", placeholder: "e.g. No AI tools yet, Using a few basic tools, Exploring advanced automation" },
        ],
      },
      {
        name: "AI Adoption Strategy Generator",
        slug: "ai-adoption-strategy-generator",
        description: "Create a phased AI adoption roadmap for your organization with implementation steps and change management guidance",
        inputs: [
          { name: "company_size", type: "text", label: "Company Size", placeholder: "e.g. 10-person startup, 500-person mid-market, Enterprise 5,000+" },
          { name: "industry", type: "text", label: "Industry", placeholder: "e.g. Professional services, Manufacturing, SaaS, Healthcare" },
          { name: "goals", type: "textarea", label: "AI Adoption Goals", placeholder: "What do you want to achieve? Cost reduction, productivity gains, competitive advantage?" },
          { name: "current_state", type: "textarea", label: "Current AI Usage", placeholder: "Describe current tech stack and any AI tools already in use..." },
        ],
      },
      {
        name: "AI ROI Calculator Explainer",
        slug: "ai-roi-calculator-explainer",
        description: "Generate a detailed AI ROI analysis with time-saving estimates, cost-benefit breakdown, and business case for AI investment",
        inputs: [
          { name: "ai_tool_use_case", type: "text", label: "AI Tool or Use Case", placeholder: "e.g. AI-powered customer support chatbot, AI writing assistant for marketing" },
          { name: "team_affected", type: "text", label: "Team Affected", placeholder: "e.g. 5-person customer support team, 3 content marketers" },
          { name: "current_time_spent", type: "text", label: "Current Time on Task", placeholder: "e.g. 4 hours/day per agent on repetitive queries" },
          { name: "tool_cost", type: "text", label: "AI Tool Monthly Cost", placeholder: "e.g. $200/month for team license" },
        ],
      },
      {
        name: "AI Policy Generator",
        slug: "ai-policy-generator",
        description: "Generate an AI usage policy for your organization covering guidelines, acceptable use, data privacy, and governance",
        inputs: [
          { name: "company_name", type: "text", label: "Company Name", placeholder: "e.g. Acme Corp" },
          { name: "industry", type: "text", label: "Industry", placeholder: "e.g. Healthcare, Finance, Technology, Legal services" },
          { name: "ai_tools_used", type: "text", label: "AI Tools Being Used", placeholder: "e.g. ChatGPT, GitHub Copilot, Midjourney, Claude" },
          { name: "key_concerns", type: "textarea", label: "Key Governance Concerns", placeholder: "e.g. Data privacy, IP protection, Accuracy requirements, Bias prevention" },
        ],
      },
      {
        name: "AI Team Training Plan Generator",
        slug: "ai-team-training-plan-generator",
        description: "Create a structured AI upskilling curriculum for your team with modules, resources, and skill milestones",
        inputs: [
          { name: "team_role", type: "text", label: "Team Role or Function", placeholder: "e.g. Marketing team, Customer support reps, Sales team, All-hands" },
          { name: "current_skill_level", type: "text", label: "Current AI Skill Level", placeholder: "e.g. No experience, Beginner ChatGPT users, Intermediate practitioners" },
          { name: "goals", type: "text", label: "Training Goals", placeholder: "e.g. Use AI for daily content creation, Automate reporting, Prompt engineering" },
          { name: "timeline", type: "text", label: "Training Timeline", placeholder: "e.g. 30 days, 8-week program, 3 months" },
        ],
      },
      {
        name: "AI Ethics Review Generator",
        slug: "ai-ethics-review-generator",
        description: "Generate a structured AI ethics review framework covering bias, fairness, transparency, and accountability",
        inputs: [
          { name: "ai_project", type: "text", label: "AI Project or System", placeholder: "e.g. AI hiring screening tool, AI product recommendation engine" },
          { name: "use_case", type: "textarea", label: "Use Case Description", placeholder: "How will the AI be used? Who will it affect? What data will it process?" },
          { name: "industry", type: "text", label: "Industry", placeholder: "e.g. HR, Healthcare, Financial services, Retail, Government" },
        ],
      },
      {
        name: "AI Integration Roadmap Generator",
        slug: "ai-integration-roadmap-generator",
        description: "Create a phased AI integration roadmap for specific workflows with milestones, tools, and success metrics",
        inputs: [
          { name: "business_area", type: "text", label: "Business Area to Integrate AI", placeholder: "e.g. Content creation pipeline, Customer support, Sales prospecting" },
          { name: "current_tools", type: "text", label: "Current Tools in Use", placeholder: "e.g. Salesforce, Slack, Google Workspace, HubSpot, Jira" },
          { name: "team_size", type: "text", label: "Team Size", placeholder: "e.g. 3, 10, 50 people" },
          { name: "timeline", type: "text", label: "Desired Timeline", placeholder: "e.g. 60 days, 6 months, 1 year" },
        ],
      },
      {
        name: "AI Chatbot Design Generator",
        slug: "ai-chatbot-design-generator",
        description: "Design a complete AI chatbot specification with conversation flows, intents, and deployment recommendations",
        inputs: [
          { name: "chatbot_purpose", type: "text", label: "Chatbot Purpose", placeholder: "e.g. Customer support, Lead qualification, Internal HR helpdesk" },
          { name: "platform", type: "text", label: "Deployment Platform", placeholder: "e.g. Website widget, WhatsApp, Slack, Mobile app, Intercom" },
          { name: "user_scenarios", type: "textarea", label: "Key User Scenarios", placeholder: "Describe the top 3–5 conversations users will have with the bot..." },
          { name: "tone", type: "text", label: "Chatbot Tone & Persona", placeholder: "e.g. Professional, Friendly, Brand-specific, Casual" },
        ],
      },
      {
        name: "AI Automation Audit Generator",
        slug: "ai-automation-audit-generator",
        description: "Audit your business processes to identify top AI automation opportunities with priority ranking and tool recommendations",
        inputs: [
          { name: "department", type: "text", label: "Department or Team", placeholder: "e.g. Marketing, Operations, HR, Finance, Customer Support" },
          { name: "current_workflows", type: "textarea", label: "Current Key Workflows", placeholder: "Describe your main recurring tasks, processes, and workflows..." },
          { name: "pain_points", type: "textarea", label: "Biggest Time Wasters", placeholder: "What tasks take the most time? What is manual and repetitive?" },
          { name: "budget", type: "text", label: "Monthly Budget for AI Tools", placeholder: "e.g. $100, $500, $2,000" },
        ],
      },
    ],
  },
];

// ─── Prompt Generator ─────────────────────────────────────────────────────────

async function generatePrompt(tool) {
  const inputNames = tool.inputs.map((f) => `{${f.name}}`).join(", ");
  const inputDescriptions = tool.inputs
    .map((f) => `  - {${f.name}}: ${f.label}`)
    .join("\n");

  const systemMsg = `You are an expert prompt engineer. Create a high-quality system prompt for an AI productivity tool.

Requirements:
1. Start with expert role: "You are an expert [role] with 15+ years of experience helping [audience]..."
2. List all input variables clearly: ${inputNames}
3. STEP 1 — INTERNAL ANALYSIS (do not output this): 3–4 internal planning steps
4. Output a COMPLETE, PROFESSIONAL result with:
   - Clear section headings (## Section Name)
   - Structured tables or bullet lists where appropriate
   - Specific, actionable content (not vague placeholders)
   - 5–8 distinct sections appropriate for this tool type
   - Minimum 600 words in the final prompt
5. End with 2–3 pro tips specific to this tool type
6. Return ONLY the prompt text. No JSON, no explanation.`;

  const userMsg = `Tool name: ${tool.name}
Tool purpose: ${tool.description}
Input variables:
${inputDescriptions}

Write the complete prompt_template for this tool.`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemMsg },
      { role: "user", content: userMsg },
    ],
    max_tokens: 2000,
    temperature: 0.7,
  });
  return res.choices[0].message.content.trim();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function insertTool(toolkitId, tool, sort_order) {
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
    sort_order,
  });

  if (error) {
    if (error.message.includes("duplicate") || error.message.includes("unique")) {
      console.log(`  ⏭ Skip (already exists): ${tool.slug}`);
      return "skip";
    }
    console.error(`  ❌ Failed: ${tool.slug} — ${error.message}`);
    return "fail";
  }
  console.log(`  ✅ Added: ${tool.slug} (${prompt.length} chars)`);
  return "ok";
}

async function main() {
  const filter = process.argv[2]; // optional: toolkit slug or "existing" or "new"

  // ── Load toolkit slugs → IDs ──────────────────────────────────────────────
  const { data: toolkits } = await supabase
    .from("toolkits")
    .select("id, slug");
  const tkMap = Object.fromEntries(toolkits.map((t) => [t.slug, t.id]));

  // ── Existing toolkit tools ─────────────────────────────────────────────────
  if (!filter || filter === "existing" || !["finance", "ai-workflow", "new"].includes(filter)) {
    const toolsToProcess = filter && !["existing", "new"].includes(filter)
      ? TOOLS_EXISTING_TOOLKITS.filter((t) => t.toolkitSlug === filter)
      : TOOLS_EXISTING_TOOLKITS;

    if (toolsToProcess.length > 0) {
      console.log(`\n📦 Adding ${toolsToProcess.length} tools to existing toolkits...\n`);

      // Get current max sort_order per toolkit
      const { data: existing } = await supabase
        .from("tools")
        .select("toolkit_id, sort_order")
        .order("sort_order", { ascending: false });
      const maxOrder = {};
      for (const t of existing ?? []) {
        if (!maxOrder[t.toolkit_id] || t.sort_order > maxOrder[t.toolkit_id]) {
          maxOrder[t.toolkit_id] = t.sort_order ?? 0;
        }
      }

      let ok = 0, skip = 0, fail = 0;
      const byTk = {};
      for (const tool of toolsToProcess) {
        if (!byTk[tool.toolkitSlug]) byTk[tool.toolkitSlug] = [];
        byTk[tool.toolkitSlug].push(tool);
      }

      for (const [tkSlug, tools] of Object.entries(byTk)) {
        const tkId = tkMap[tkSlug];
        if (!tkId) { console.error(`  ❌ Toolkit not found: ${tkSlug}`); continue; }
        console.log(`\n── ${tkSlug} (+${tools.length}) ──`);
        let so = (maxOrder[tkId] ?? 20);
        for (const tool of tools) {
          so++;
          const r = await insertTool(tkId, tool, so);
          if (r === "ok") ok++;
          else if (r === "skip") skip++;
          else fail++;
        }
      }
      console.log(`\n📊 Existing toolkits: ${ok} added, ${skip} skipped, ${fail} failed`);
    }
  }

  // ── New toolkits ───────────────────────────────────────────────────────────
  const newTkToProcess = filter && ["finance", "ai-workflow"].includes(filter)
    ? NEW_TOOLKITS.filter((t) => t.slug === filter)
    : filter === "existing"
    ? []
    : NEW_TOOLKITS;

  for (const tkDef of newTkToProcess) {
    console.log(`\n🏗  Creating toolkit: ${tkDef.slug}...`);

    // Check if toolkit exists
    let tkId = tkMap[tkDef.slug];
    if (!tkId) {
      const { data: newTk, error: tkErr } = await supabase
        .from("toolkits")
        .insert({
          slug: tkDef.slug,
          name: tkDef.name,
          description: tkDef.description,
          price_monthly: tkDef.price_monthly,
          icon: tkDef.icon,
          is_active: true,
          sort_order: tkDef.sort_order,
        })
        .select("id")
        .single();

      if (tkErr) {
        console.error(`  ❌ Failed to create toolkit: ${tkErr.message}`);
        continue;
      }
      tkId = newTk.id;
      console.log(`  ✅ Toolkit created: ${tkDef.slug} (id: ${tkId})`);
    } else {
      console.log(`  ⏭ Toolkit already exists: ${tkDef.slug}`);
    }

    console.log(`  📦 Adding ${tkDef.tools.length} tools...`);
    let ok = 0, skip = 0, fail = 0;
    for (let i = 0; i < tkDef.tools.length; i++) {
      const r = await insertTool(tkId, tkDef.tools[i], i + 1);
      if (r === "ok") ok++;
      else if (r === "skip") skip++;
      else fail++;
    }
    console.log(`  📊 ${tkDef.name}: ${ok} added, ${skip} skipped, ${fail} failed`);
  }

  // ── Final count ────────────────────────────────────────────────────────────
  const { count } = await supabase
    .from("tools")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);
  console.log(`\n🎉 Done! Total active tools: ${count}`);
}

main().catch(console.error);
