export const PROFESSIONS = [
  "software engineer", "data analyst", "product manager",
  "marketing manager", "sales manager", "startup founder",
  "student", "freelancer", "consultant", "teacher",
  "lawyer", "recruiter", "designer", "content creator",
  "youtube creator", "blogger", "podcaster",
  "social media manager", "ecommerce seller",
  "small business owner", "hr manager", "accountant",
  "project manager", "business owner", "copywriter",
  "seo specialist", "developer", "entrepreneur",
  "customer success manager", "finance professional",
];

export const COMPETITORS = [
  "jasper", "copy-ai", "grammarly", "chatgpt", "notion-ai",
  "resume-io", "writesonic", "rytr", "surfer-seo",
  "semrush", "loom", "descript", "elevenlabs", "heygen",
  "otter-ai", "pictory", "runway", "opus-clip", "synthesia",
  "canva", "midjourney", "claude", "gemini", "perplexity",
];

export const PROBLEMS = [
  "how-to-write-resume-summary",
  "how-to-write-cover-letter",
  "how-to-write-youtube-script",
  "how-to-write-marketing-email",
  "how-to-create-business-plan",
  "how-to-write-linkedin-summary",
  "how-to-write-blog-post",
  "how-to-write-cold-email",
  "how-to-create-pitch-deck",
  "how-to-write-job-description",
  "how-to-write-product-description",
  "how-to-analyze-contract",
  "how-to-write-press-release",
  "how-to-create-newsletter",
  "how-to-write-performance-review",
  "how-to-create-content-calendar",
  "how-to-write-sales-proposal",
  "how-to-write-executive-summary",
  "how-to-write-resignation-letter",
  "how-to-write-recommendation-letter",
  "how-to-create-elevator-pitch",
  "how-to-write-case-study",
  "how-to-write-ad-copy",
  "how-to-create-landing-page-copy",
  "how-to-write-email-subject-line",
  "how-to-write-instagram-caption",
  "how-to-create-linkedin-post",
  "how-to-write-video-description",
  "how-to-write-podcast-script",
  "how-to-write-grant-proposal",
];

export const MODIFIERS = [
  "ai", "free", "online", "tool", "generator",
  "maker", "builder", "examples", "template",
  "guide", "for-students", "for-professionals",
  "best", "2025",
];

export function toProfessionSlug(profession: string): string {
  return profession.toLowerCase().replace(/\s+/g, "-");
}

export function toPageSlug(toolSlug: string, professionSlug: string): string {
  return `${toolSlug}-for-${professionSlug}`;
}

export function competitorDisplayName(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .replace("Ai", "AI")
    .replace("Seo", "SEO");
}

export function problemTitle(slug: string): string {
  return slug
    .replace(/^how-to-/, "How to ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
