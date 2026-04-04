import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf-8");
const vars = Object.fromEntries(
  env.split("\n").filter(l => l.includes("=")).map(l => {
    const idx = l.indexOf("=");
    return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
  })
);

const supabase = createClient(vars.NEXT_PUBLIC_SUPABASE_URL, vars.SUPABASE_SERVICE_ROLE_KEY);

const updates = [
  {
    slug: "nda-analyzer",
    description: "Generate a reference NDA template based on common legal frameworks. For informational purposes only — not legal advice."
  },
  {
    slug: "contract-risk-analyzer",
    description: "Identify potentially unfavorable clauses in contracts using AI analysis of common legal patterns. For informational purposes only — not legal advice."
  },
  {
    slug: "terms-of-service-generator",
    description: "Generate a reference Terms of Service template based on common legal frameworks. For informational purposes only — not legal advice."
  },
  {
    slug: "privacy-policy-generator",
    description: "Generate a reference Privacy Policy template based on common legal frameworks and regulations. For informational purposes only — not legal advice."
  },
  {
    slug: "legal-doc-summarizer",
    description: "Summarize legal documents in plain English to help you understand key terms and obligations. For informational purposes only — not legal advice."
  },
  {
    slug: "employment-contract-generator",
    description: "Generate a reference Employment Contract template based on common legal frameworks. For informational purposes only — not legal advice."
  },
  {
    slug: "freelance-agreement-generator",
    description: "Generate a reference Freelance Services Agreement template based on common legal frameworks. For informational purposes only — not legal advice."
  },
  {
    slug: "partnership-agreement-generator",
    description: "Generate a reference Business Partnership Agreement template based on common legal frameworks. For informational purposes only — not legal advice."
  },
  {
    slug: "non-compete-agreement-generator",
    description: "Generate a reference Non-Compete and Non-Solicitation Agreement template. Enforceability varies by jurisdiction. For informational purposes only — not legal advice."
  },
  {
    slug: "contract-clause-explainer",
    description: "Explain contract clauses in plain English to help you understand legal language and implications. For informational purposes only — not legal advice."
  }
];

let success = 0;
let errors = 0;

for (const { slug, description } of updates) {
  const { error } = await supabase
    .from("tools")
    .update({ description })
    .eq("slug", slug);

  if (error) {
    console.error(`❌ ${slug}: ${error.message}`);
    errors++;
  } else {
    console.log(`✅ ${slug}`);
    success++;
  }
}

console.log(`\nDone: ${success} updated, ${errors} errors`);
