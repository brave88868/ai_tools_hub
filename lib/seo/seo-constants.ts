// Shared SEO content generation constants
// Used by API routes, cron jobs, and scripts

export const COMPETITOR_TOOLS = [
  "Jasper", "Copy.ai", "Grammarly", "ChatGPT", "Notion AI",
  "Resume.io", "Canva", "Midjourney", "Claude", "Gemini",
  "Perplexity", "Writesonic", "Rytr", "Surfer SEO", "Frase",
  "Semrush", "Ahrefs", "Clearscope", "Loom", "Otter.ai",
  "Descript", "Synthesia", "HeyGen", "Pictory", "Murf",
  "ElevenLabs", "Runway", "Pika", "Invideo AI", "Opus Clip",
];

export const COMPETITOR_SLUGS = COMPETITOR_TOOLS.map((t) =>
  t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
);

export const PROBLEM_SLUGS = [
  "how-to-write-resume-summary",
  "how-to-write-cover-letter",
  "how-to-write-youtube-script",
  "how-to-write-marketing-email",
  "how-to-create-business-plan",
  "how-to-write-linkedin-profile",
  "how-to-write-blog-post",
  "how-to-create-social-media-content",
  "how-to-write-product-description",
  "how-to-analyze-contract",
  "how-to-write-cold-email",
  "how-to-create-pitch-deck",
  "how-to-write-job-description",
  "how-to-create-youtube-thumbnail",
  "how-to-write-press-release",
  "how-to-create-newsletter",
  "how-to-write-terms-of-service",
  "how-to-create-nda",
  "how-to-write-performance-review",
  "how-to-create-content-calendar",
];

export const WORKFLOW_SLUGS = [
  "ai-resume-writing-workflow",
  "ai-youtube-content-workflow",
  "ai-email-marketing-workflow",
  "ai-social-media-workflow",
  "ai-content-creation-workflow",
  "ai-job-search-workflow",
  "ai-business-plan-workflow",
  "ai-legal-document-workflow",
  "ai-marketing-campaign-workflow",
  "ai-seo-content-workflow",
  "ai-podcast-production-workflow",
  "ai-video-creation-workflow",
  "ai-blog-writing-workflow",
  "ai-linkedin-growth-workflow",
  "ai-sales-outreach-workflow",
];

export const INDUSTRY_SLUGS = [
  "lawyers", "teachers", "marketers", "students", "freelancers",
  "startups", "small-business-owners", "content-creators", "hr-managers",
  "sales-teams", "real-estate-agents", "coaches", "consultants",
  "engineers", "designers", "product-managers", "entrepreneurs",
  "recruiters", "accountants", "healthcare-professionals",
  "e-commerce-sellers", "social-media-managers", "seo-specialists",
  "copywriters", "journalists", "researchers", "developers",
  "finance-professionals", "project-managers", "event-planners",
  "photographers", "videographers", "podcasters", "authors",
  "professors", "nonprofit-managers", "virtual-assistants",
  "customer-support-teams", "data-analysts", "investors",
];

export function slugToTitle(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
