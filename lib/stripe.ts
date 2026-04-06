import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

// Toolkit slug → Stripe Price ID mapping
// Values come from env vars — if undefined at runtime, checkout redirects to /pricing
// Add the env var in Vercel when a Stripe price is created for that toolkit
export const TOOLKIT_PRICE_IDS: Record<string, string | undefined> = {
  // ── Original toolkits (Price IDs configured) ──────────────────────────────
  jobseeker: process.env.STRIPE_JOBSEEKER_PRICE_ID,
  creator:   process.env.STRIPE_CREATOR_PRICE_ID,
  marketing: process.env.STRIPE_MARKETING_PRICE_ID,
  business:  process.env.STRIPE_BUSINESS_PRICE_ID,
  legal:     process.env.STRIPE_LEGAL_PRICE_ID,
  exam:      process.env.STRIPE_EXAM_PRICE_ID,
  bundle:    process.env.STRIPE_BUNDLE_PRICE_ID,

  // ── New toolkits (create Stripe prices + set env vars to activate) ─────────
  "presentation-toolkit":        process.env.STRIPE_PRESENTATION_PRICE_ID,
  "workflow-automation-toolkit": process.env.STRIPE_WORKFLOW_PRICE_ID,
  "compliance-toolkit":          process.env.STRIPE_COMPLIANCE_PRICE_ID,
  "customer-support":            process.env.STRIPE_CUSTOMER_SUPPORT_PRICE_ID,
  "hr-hiring":                   process.env.STRIPE_HR_HIRING_PRICE_ID,
  "email-marketing":             process.env.STRIPE_EMAIL_MARKETING_PRICE_ID,
  "meeting":                     process.env.STRIPE_MEETING_PRICE_ID,
  "knowledge":                   process.env.STRIPE_KNOWLEDGE_PRICE_ID,
  "seo-content":                 process.env.STRIPE_SEO_CONTENT_PRICE_ID,

  // ── 6 new toolkits (2026-04-07) ───────────────────────────────────────────
  "data-analytics":              process.env.STRIPE_PRICE_DATA_ANALYTICS,
  "sales":                       process.env.STRIPE_PRICE_SALES,
  "social-media":                process.env.STRIPE_PRICE_SOCIAL_MEDIA,
  "document":                    process.env.STRIPE_PRICE_DOCUMENT,
  "productivity":                process.env.STRIPE_PRICE_PRODUCTIVITY,
  "ai-prompts":                  process.env.STRIPE_PRICE_AI_PROMPTS,
};
