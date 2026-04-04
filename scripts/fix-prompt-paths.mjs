import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf-8");
const vars = {};
for (const line of env.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) vars[m[1].trim()] = m[2].trim();
}

const supabase = createClient(vars.NEXT_PUBLIC_SUPABASE_URL, vars.SUPABASE_SERVICE_ROLE_KEY);

const PATH_FIXES = [
  { slug: "linkedin-profile-optimizer",  prompt_file: "jobseeker/linkedin_optimizer.txt" },
  { slug: "salary-negotiation-script",   prompt_file: "jobseeker/salary_negotiation.txt" },
  { slug: "blog-topic-generator",        prompt_file: "creator/blog_topic.txt" },
  { slug: "article-outline-generator",   prompt_file: "creator/article_outline.txt" },
  { slug: "newsletter-writer",           prompt_file: "creator/newsletter.txt" },
  { slug: "tiktok-caption-generator",    prompt_file: "creator/tiktok_caption.txt" },
  { slug: "instagram-caption-gen",       prompt_file: "creator/instagram_caption.txt" },
  { slug: "cold-email-generator",        prompt_file: "marketing/cold_email.txt" },
  { slug: "facebook-ad-copy",            prompt_file: "marketing/facebook_ad.txt" },
  { slug: "google-ads-copy",             prompt_file: "marketing/google_ads.txt" },
  { slug: "brand-voice-generator",       prompt_file: "marketing/brand_voice.txt" },
  { slug: "headline-generator",          prompt_file: "marketing/headline.txt" },
  { slug: "value-proposition-gen",       prompt_file: "marketing/value_proposition.txt" },
  { slug: "invoice-email-generator",     prompt_file: "business/invoice_email.txt" },
  { slug: "customer-support-reply",      prompt_file: "business/customer_support.txt" },
  { slug: "company-bio-generator",       prompt_file: "business/company_bio.txt" },
  { slug: "client-followup-email",       prompt_file: "business/client_followup.txt" },
  { slug: "faq-generator",               prompt_file: "business/faq.txt" },
  { slug: "contract-clause-explainer",   prompt_file: "legal/contract_clause.txt" },
];

console.log("🔧 Fixing prompt_file paths...\n");
let fixed = 0, failed = 0;

for (const { slug, prompt_file } of PATH_FIXES) {
  const { error } = await supabase.from("tools").update({ prompt_file }).eq("slug", slug);
  if (error) { console.log(`❌ ${slug}: ${error.message}`); failed++; }
  else { console.log(`✅ ${slug} → ${prompt_file}`); fixed++; }
}

console.log(`\nDone: ${fixed} fixed, ${failed} failed.`);
