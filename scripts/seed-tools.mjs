import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf-8");
env.split("\n").forEach((line) => {
  const eq = line.indexOf("=");
  if (eq > 0) process.env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
});

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const tools = [
  // Jobseeker
  { ts: "jobseeker", slug: "ats-resume-checker", name: "ATS Resume Checker", desc: "Check resume ATS compatibility score", pf: "jobseeker/ats_resume_checker.txt", so: 4 },
  { ts: "jobseeker", slug: "resume-bullet-generator", name: "Resume Bullet Generator", desc: "Generate strong resume bullet points", pf: "jobseeker/resume_bullet_generator.txt", so: 5 },
  { ts: "jobseeker", slug: "linkedin-profile-optimizer", name: "LinkedIn Profile Optimizer", desc: "Optimize LinkedIn profile for visibility", pf: "jobseeker/linkedin_optimizer.txt", so: 6 },
  { ts: "jobseeker", slug: "job-description-analyzer", name: "Job Description Analyzer", desc: "Analyze job requirements and keywords", pf: "jobseeker/job_description_analyzer.txt", so: 7 },
  { ts: "jobseeker", slug: "resume-keyword-scanner", name: "Resume Keyword Scanner", desc: "Scan resume for missing keywords", pf: "jobseeker/resume_keyword_scanner.txt", so: 8 },
  { ts: "jobseeker", slug: "behavioral-interview-coach", name: "Behavioral Interview Coach", desc: "Practice behavioral interview answers", pf: "jobseeker/behavioral_interview.txt", so: 9 },
  { ts: "jobseeker", slug: "salary-negotiation-script", name: "Salary Negotiation Script Generator", desc: "Generate salary negotiation talking points", pf: "jobseeker/salary_negotiation.txt", so: 10 },
  // Creator
  { ts: "creator", slug: "youtube-description-generator", name: "YouTube Description Generator", desc: "Generate SEO-optimized video descriptions", pf: "creator/youtube_description.txt", so: 3 },
  { ts: "creator", slug: "youtube-script-generator", name: "YouTube Script Generator", desc: "Generate full video scripts", pf: "creator/youtube_script.txt", so: 4 },
  { ts: "creator", slug: "blog-topic-generator", name: "Blog Topic Generator", desc: "Generate trending blog topic ideas", pf: "creator/blog_topic.txt", so: 5 },
  { ts: "creator", slug: "article-outline-generator", name: "Article Outline Generator", desc: "Generate structured article outlines", pf: "creator/article_outline.txt", so: 6 },
  { ts: "creator", slug: "newsletter-writer", name: "AI Newsletter Writer", desc: "Write engaging email newsletters", pf: "creator/newsletter.txt", so: 7 },
  { ts: "creator", slug: "podcast-script-generator", name: "Podcast Script Generator", desc: "Generate podcast episode scripts", pf: "creator/podcast_script.txt", so: 8 },
  { ts: "creator", slug: "tiktok-caption-generator", name: "TikTok Caption Generator", desc: "Generate viral TikTok captions", pf: "creator/tiktok_caption.txt", so: 9 },
  { ts: "creator", slug: "instagram-caption-generator", name: "Instagram Caption Generator", desc: "Generate engaging Instagram captions", pf: "creator/instagram_caption.txt", so: 10 },
  // Marketing
  { ts: "marketing", slug: "cold-email-generator", name: "Cold Email Generator", desc: "Generate personalized cold outreach emails", pf: "marketing/cold_email.txt", so: 4 },
  { ts: "marketing", slug: "facebook-ad-copy", name: "Facebook Ad Copy Generator", desc: "Generate high-converting Facebook ad copy", pf: "marketing/facebook_ad.txt", so: 5 },
  { ts: "marketing", slug: "google-ads-copy", name: "Google Ads Copy Generator", desc: "Generate Google search ad copy", pf: "marketing/google_ads.txt", so: 6 },
  { ts: "marketing", slug: "landing-page-copy", name: "Landing Page Copy Generator", desc: "Generate conversion-focused landing page copy", pf: "marketing/landing_page.txt", so: 7 },
  { ts: "marketing", slug: "brand-voice-generator", name: "Brand Voice Generator", desc: "Define and generate consistent brand voice", pf: "marketing/brand_voice.txt", so: 8 },
  { ts: "marketing", slug: "headline-generator", name: "Headline Generator", desc: "Generate attention-grabbing headlines", pf: "marketing/headline.txt", so: 9 },
  { ts: "marketing", slug: "value-proposition-generator", name: "Value Proposition Generator", desc: "Generate compelling value propositions", pf: "marketing/value_proposition.txt", so: 10 },
  // Business
  { ts: "business", slug: "invoice-email-generator", name: "Invoice Email Generator", desc: "Generate professional invoice follow-up emails", pf: "business/invoice_email.txt", so: 3 },
  { ts: "business", slug: "customer-support-reply", name: "Customer Support Reply Generator", desc: "Generate professional customer support responses", pf: "business/customer_support.txt", so: 4 },
  { ts: "business", slug: "meeting-summary-generator", name: "Meeting Summary Generator", desc: "Generate structured meeting summaries", pf: "business/meeting_summary.txt", so: 5 },
  { ts: "business", slug: "swot-analysis-generator", name: "SWOT Analysis Generator", desc: "Generate business SWOT analysis", pf: "business/swot_analysis.txt", so: 6 },
  { ts: "business", slug: "company-bio-generator", name: "Company Bio Generator", desc: "Generate professional company bios", pf: "business/company_bio.txt", so: 7 },
  { ts: "business", slug: "pitch-deck-outline", name: "Pitch Deck Outline Generator", desc: "Generate investor pitch deck outlines", pf: "business/pitch_deck.txt", so: 8 },
  { ts: "business", slug: "client-followup-email", name: "Client Follow-up Email Generator", desc: "Generate professional client follow-up emails", pf: "business/client_followup.txt", so: 9 },
  { ts: "business", slug: "faq-generator", name: "FAQ Generator", desc: "Generate FAQ content for products and services", pf: "business/faq.txt", so: 10 },
  // Legal
  { ts: "legal", slug: "terms-of-service-generator", name: "Terms of Service Generator", desc: "Generate website terms of service", pf: "legal/terms_of_service.txt", so: 3 },
  { ts: "legal", slug: "privacy-policy-generator", name: "Privacy Policy Generator", desc: "Generate GDPR-compliant privacy policies", pf: "legal/privacy_policy.txt", so: 4 },
  { ts: "legal", slug: "legal-doc-summarizer", name: "Legal Document Summarizer", desc: "Summarize complex legal documents", pf: "legal/legal_summarizer.txt", so: 5 },
  { ts: "legal", slug: "employment-contract-generator", name: "Employment Contract Generator", desc: "Generate employment contract templates", pf: "legal/employment_contract.txt", so: 6 },
  { ts: "legal", slug: "freelance-agreement-generator", name: "Freelance Agreement Generator", desc: "Generate freelance service agreements", pf: "legal/freelance_agreement.txt", so: 7 },
  { ts: "legal", slug: "partnership-agreement-generator", name: "Partnership Agreement Generator", desc: "Generate business partnership agreements", pf: "legal/partnership_agreement.txt", so: 8 },
  { ts: "legal", slug: "non-compete-agreement-generator", name: "Non-Compete Agreement Generator", desc: "Generate non-compete agreement templates", pf: "legal/non_compete.txt", so: 9 },
  { ts: "legal", slug: "contract-clause-explainer", name: "Contract Clause Explainer", desc: "Explain complex contract clauses in plain English", pf: "legal/contract_clause.txt", so: 10 },
];

const { data: kits } = await sb.from("toolkits").select("id,slug");
const kitMap = Object.fromEntries(kits.map((k) => [k.slug, k.id]));

let inserted = 0, skipped = 0, errors = 0;

for (const t of tools) {
  const row = {
    toolkit_id: kitMap[t.ts],
    slug: t.slug,
    name: t.name,
    description: t.desc,
    tool_type: "template",
    prompt_file: t.pf,
    output_format: "markdown",
    sort_order: t.so,
    is_active: true,
  };
  const { error } = await sb.from("tools").insert(row);
  if (!error) {
    inserted++;
  } else if (error.code === "23505") {
    skipped++;
  } else {
    errors++;
    console.error("ERROR", t.slug, error.message);
  }
}

const { count } = await sb.from("tools").select("*", { count: "exact", head: true });
console.log(`Done. inserted: ${inserted} | skipped (already exist): ${skipped} | errors: ${errors}`);
console.log(`Total tools in DB: ${count}`);
