import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

// Toolkit slug → Stripe Price ID mapping
export const TOOLKIT_PRICE_IDS: Record<string, string> = {
  jobseeker: process.env.STRIPE_JOBSEEKER_PRICE_ID!,
  creator:   process.env.STRIPE_CREATOR_PRICE_ID!,
  marketing: process.env.STRIPE_MARKETING_PRICE_ID!,
  business:  process.env.STRIPE_BUSINESS_PRICE_ID!,
  legal:     process.env.STRIPE_LEGAL_PRICE_ID!,
  exam:      process.env.STRIPE_EXAM_PRICE_ID!,
  bundle:    process.env.STRIPE_BUNDLE_PRICE_ID!,
};
