/**
 * fix-tools-db.mjs
 * Fixes all broken tool configurations in Supabase:
 * 1. Convert 17 config tools → template + set prompt_file
 * 2. Fix wrong prompt_file paths (meeting-summary-gen, product-description-generator)
 * 3. Set inputs_schema for 22 template tools with null inputs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf-8");
const vars = {};
for (const line of env.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) vars[m[1].trim()] = m[2].trim();
}

const supabase = createClient(vars.NEXT_PUBLIC_SUPABASE_URL, vars.SUPABASE_SERVICE_ROLE_KEY);

// ── Helper ─────────────────────────────────────────────────────────────────
function field(name, type, label, placeholder, required = true, options = null) {
  const f = { name, type, label, placeholder, required };
  if (options) f.options = options;
  return f;
}

// ── Fix 1: Config tools → Template + set prompt_file ──────────────────────
const CONFIG_TO_TEMPLATE = [
  { slug: "behavioral-interview-coach",  prompt_file: "jobseeker/behavioral_interview.txt" },
  { slug: "business-plan-generator",     prompt_file: "business/business_plan_generator.txt" },
  { slug: "business-proposal-gen",       prompt_file: "business/business_proposal_gen.txt" },
  { slug: "contract-risk-analyzer",      prompt_file: "legal/contract_analyzer.txt" },
  { slug: "employment-contract-gen",     prompt_file: "legal/employment_contract.txt" },
  { slug: "freelance-agreement-gen",     prompt_file: "legal/freelance_agreement.txt" },
  { slug: "landing-page-copy",           prompt_file: "marketing/landing_page.txt" },
  { slug: "nda-analyzer",               prompt_file: "legal/nda_analyzer.txt" },
  { slug: "non-compete-agreement-gen",   prompt_file: "legal/non_compete.txt" },
  { slug: "partnership-agreement-gen",   prompt_file: "legal/partnership_agreement.txt" },
  { slug: "pitch-deck-outline",          prompt_file: "business/pitch_deck.txt" },
  { slug: "podcast-script-generator",    prompt_file: "creator/podcast_script.txt" },
  { slug: "privacy-policy-gen",          prompt_file: "legal/privacy_policy.txt" },
  { slug: "seo-content-generator",       prompt_file: "creator/seo_content_generator.txt" },
  { slug: "swot-analysis-generator",     prompt_file: "business/swot_analysis.txt" },
  { slug: "terms-of-service-gen",        prompt_file: "legal/terms_of_service.txt" },
  { slug: "youtube-script-generator",    prompt_file: "creator/youtube_script.txt" },
];

// ── Fix 2: Wrong prompt_file paths ─────────────────────────────────────────
const WRONG_PATHS = [
  { slug: "meeting-summary-gen",           prompt_file: "business/meeting_summary.txt" },
  { slug: "product-description-generator", prompt_file: "marketing/product_description_generator.txt" },
];

// ── Fix 3: inputs_schema for template tools with null inputs ───────────────
const INPUTS_FIX = [
  {
    slug: "assignment-planner",
    inputs: [
      field("subject", "text", "Subject", "e.g. History, Biology"),
      field("assignment", "textarea", "Assignment Description", "Describe the assignment or paste the instructions..."),
      field("start_date", "text", "Start Date", "e.g. Today, Monday"),
      field("due_date", "text", "Due Date", "e.g. Friday, March 20"),
    ],
  },
  {
    slug: "citation-helper",
    inputs: [
      field("source_type", "select", "Source Type", "", true, ["Book", "Website", "Journal Article", "Newspaper", "Video"]),
      field("source_info", "textarea", "Source Information", "Paste all available details: author, title, publisher, URL, date..."),
      field("citation_style", "select", "Citation Style", "", true, ["APA", "MLA", "Chicago", "Harvard", "Vancouver"]),
    ],
  },
  {
    slug: "concept-explainer",
    inputs: [
      field("concept", "text", "Concept to Explain", "e.g. Quantum entanglement, Supply and demand"),
      field("subject", "text", "Subject", "e.g. Physics, Economics"),
      field("level", "select", "Explanation Level", "", true, ["Beginner (ELI5)", "High School", "University", "Expert"]),
    ],
  },
  {
    slug: "employment-contract-generator",
    inputs: [
      field("employer_name", "text", "Employer / Company Name", "e.g. Acme Corp Pty Ltd"),
      field("employee_name", "text", "Employee Full Name", "e.g. Jane Smith"),
      field("job_title", "text", "Job Title", "e.g. Software Engineer"),
      field("salary", "text", "Salary / Pay Rate", "e.g. $80,000 AUD per annum"),
      field("start_date", "text", "Start Date", "e.g. 1 April 2025"),
    ],
  },
  {
    slug: "essay-outline-generator",
    inputs: [
      field("essay_topic", "text", "Essay Topic", "e.g. The impact of social media on democracy"),
      field("subject", "text", "Subject / Course", "e.g. Political Science"),
      field("essay_type", "select", "Essay Type", "", true, ["Argumentative", "Analytical", "Expository", "Narrative", "Compare & Contrast"]),
      field("word_count", "text", "Target Word Count", "e.g. 1500 words"),
      field("sources_or_arguments", "textarea", "Key Arguments or Sources", "List your main arguments or sources (optional)...", false),
    ],
  },
  {
    slug: "exam-question-generator",
    inputs: [
      field("subject", "text", "Subject", "e.g. Biology, World History"),
      field("content", "textarea", "Study Content / Topic", "Paste notes or describe the topic to generate questions from..."),
      field("question_types", "select", "Question Types", "", true, ["Multiple Choice", "Short Answer", "True/False", "Essay", "Mixed"]),
      field("num_questions", "text", "Number of Questions", "e.g. 10"),
    ],
  },
  {
    slug: "flashcard-generator",
    inputs: [
      field("topic_or_text", "textarea", "Topic or Study Text", "Enter a topic or paste your notes to create flashcards from..."),
      field("num_cards", "text", "Number of Flashcards", "e.g. 10"),
      field("difficulty", "select", "Difficulty Level", "", true, ["Easy", "Medium", "Hard"]),
    ],
  },
  {
    slug: "freelance-agreement-generator",
    inputs: [
      field("freelancer_name", "text", "Freelancer Full Name", "e.g. Alex Johnson"),
      field("client_name", "text", "Client / Company Name", "e.g. TechStart Pty Ltd"),
      field("project_description", "textarea", "Project Description", "Describe the scope of work and deliverables..."),
      field("payment_terms", "text", "Payment Terms", "e.g. $5,000 — 50% upfront, 50% on completion"),
    ],
  },
  {
    slug: "instagram-caption-generator",
    inputs: [
      field("post_topic", "textarea", "Post Topic / Description", "Describe the photo or what the post is about..."),
      field("brand_tone", "select", "Brand Tone", "", true, ["Professional", "Casual & Friendly", "Inspirational", "Humorous", "Luxury"]),
    ],
  },
  {
    slug: "meeting-summary-generator",
    inputs: [
      field("meeting_title", "text", "Meeting Title", "e.g. Q1 Planning Session"),
      field("meeting_notes", "textarea", "Raw Meeting Notes", "Paste your messy meeting notes here..."),
    ],
  },
  {
    slug: "mnemonic-generator",
    inputs: [
      field("subject", "text", "Subject", "e.g. Chemistry, History"),
      field("content", "textarea", "Content to Memorise", "e.g. The first 10 elements, Dates of WWII events..."),
      field("style", "select", "Mnemonic Style", "", true, ["Acronym", "Acrostic", "Rhyme", "Story / Journey", "Visual Association"]),
    ],
  },
  {
    slug: "non-compete-agreement-generator",
    inputs: [
      field("employer_name", "text", "Employer / Company Name", "e.g. Acme Corp"),
      field("employee_name", "text", "Employee Full Name", "e.g. John Smith"),
      field("restriction_period", "text", "Restriction Period", "e.g. 12 months after termination"),
      field("geographic_area", "text", "Geographic Restriction", "e.g. Australia, within 50km of Sydney CBD"),
    ],
  },
  {
    slug: "partnership-agreement-generator",
    inputs: [
      field("business_name", "text", "Business / Partnership Name", "e.g. Smith & Jones Consulting"),
      field("equity_split", "text", "Equity Split", "e.g. 50/50, Partner A 60% / Partner B 40%"),
    ],
  },
  {
    slug: "privacy-policy-generator",
    inputs: [
      field("company_name", "text", "Company / App Name", "e.g. Acme SaaS Inc."),
      field("website_url", "text", "Website URL", "e.g. https://example.com"),
      field("data_collected", "textarea", "Data You Collect", "e.g. Email address, name, payment info, usage analytics..."),
    ],
  },
  {
    slug: "product-description-generator",
    inputs: [
      field("product_name", "text", "Product Name", "e.g. UltraGrip Pro Running Shoes"),
      field("features", "textarea", "Key Features & Benefits", "List the main features and benefits..."),
      field("audience", "text", "Target Audience", "e.g. Recreational runners aged 25–45"),
    ],
  },
  {
    slug: "proposal-generator",
    inputs: [
      field("client_name", "text", "Client Name", "e.g. TechStart Inc."),
      field("project_title", "text", "Project Title", "e.g. Website Redesign"),
      field("project_description", "textarea", "Project Description", "Describe the project scope and objectives..."),
      field("timeline", "text", "Proposed Timeline", "e.g. 4 weeks"),
      field("budget", "text", "Proposed Budget", "e.g. $8,000"),
    ],
  },
  {
    slug: "quiz-generator",
    inputs: [
      field("subject", "text", "Subject", "e.g. Biology, World History"),
      field("study_material", "textarea", "Study Material", "Paste your notes or describe the topic..."),
      field("num_questions", "text", "Number of Questions", "e.g. 10"),
      field("difficulty", "select", "Difficulty Level", "", true, ["Easy", "Medium", "Hard"]),
    ],
  },
  {
    slug: "study-guide-creator",
    inputs: [
      field("subject", "text", "Subject", "e.g. Organic Chemistry"),
      field("notes", "textarea", "Your Notes / Syllabus", "Paste your notes, topics, or syllabus content..."),
      field("exam_date", "text", "Exam Date", "e.g. 15 April 2025"),
    ],
  },
  {
    slug: "terms-of-service-generator",
    inputs: [
      field("company_name", "text", "Company / App Name", "e.g. Acme SaaS Inc."),
      field("website_url", "text", "Website URL", "e.g. https://example.com"),
      field("service_description", "textarea", "Service Description", "Briefly describe what your service does..."),
    ],
  },
  {
    slug: "thesis-statement-generator",
    inputs: [
      field("subject", "text", "Subject / Course", "e.g. Political Science"),
      field("essay_topic", "text", "Essay Topic", "e.g. The impact of social media on democracy"),
      field("essay_type", "select", "Essay Type", "", true, ["Argumentative", "Analytical", "Expository", "Compare & Contrast"]),
      field("key_arguments", "textarea", "Key Arguments (optional)", "List 2–3 main points you want to make...", false),
    ],
  },
  {
    slug: "value-proposition-generator",
    inputs: [
      field("product", "text", "Product / Service Name", "e.g. AI Tools Station"),
      field("customer_problem", "textarea", "Customer Problem", "What pain point or challenge does your product solve?"),
      field("key_benefit", "text", "Key Benefit", "e.g. Saves 2 hours per day on content creation"),
    ],
  },
  {
    slug: "youtube-description-generator",
    inputs: [
      field("title", "text", "Video Title", "e.g. 10 Morning Habits That Changed My Life"),
      field("topic", "textarea", "Video Topic / Summary", "Briefly describe what the video covers..."),
      field("keywords", "text", "Target Keywords", "e.g. morning routine, productivity, habits"),
    ],
  },
];

// ── Execute fixes ──────────────────────────────────────────────────────────
console.log("🔧 Starting tool configuration fixes...\n");

let fixed = 0;
let failed = 0;

// Fix 1: config → template
console.log("=== Fix 1: Converting config tools to template ===");
for (const { slug, prompt_file } of CONFIG_TO_TEMPLATE) {
  const { error } = await supabase
    .from("tools")
    .update({ tool_type: "template", prompt_file })
    .eq("slug", slug);
  if (error) {
    console.log(`❌ ${slug}: ${error.message}`);
    failed++;
  } else {
    console.log(`✅ ${slug} → template (${prompt_file})`);
    fixed++;
  }
}

// Fix 2: wrong prompt_file paths
console.log("\n=== Fix 2: Fixing wrong prompt_file paths ===");
for (const { slug, prompt_file } of WRONG_PATHS) {
  const { error } = await supabase
    .from("tools")
    .update({ prompt_file })
    .eq("slug", slug);
  if (error) {
    console.log(`❌ ${slug}: ${error.message}`);
    failed++;
  } else {
    console.log(`✅ ${slug} → ${prompt_file}`);
    fixed++;
  }
}

// Fix 3: inputs_schema
console.log("\n=== Fix 3: Setting inputs_schema ===");
for (const { slug, inputs } of INPUTS_FIX) {
  const { error } = await supabase
    .from("tools")
    .update({ inputs_schema: inputs })
    .eq("slug", slug);
  if (error) {
    console.log(`❌ ${slug}: ${error.message}`);
    failed++;
  } else {
    console.log(`✅ ${slug} (${inputs.length} fields)`);
    fixed++;
  }
}

console.log(`\n✅ Done: ${fixed} fixed, ${failed} failed.`);
