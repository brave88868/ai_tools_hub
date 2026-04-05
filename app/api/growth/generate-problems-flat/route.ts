import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import { openai } from "@/lib/openai";

const PROBLEMS = [
  "how-to-write-resume-summary", "how-to-write-cover-letter",
  "how-to-write-youtube-script", "how-to-write-marketing-email",
  "how-to-create-business-plan", "how-to-write-linkedin-summary",
  "how-to-write-blog-post", "how-to-create-social-media-content",
  "how-to-write-product-description", "how-to-analyze-contract",
  "how-to-write-cold-email", "how-to-create-pitch-deck",
  "how-to-write-job-description", "how-to-write-press-release",
  "how-to-create-newsletter", "how-to-write-terms-of-service",
  "how-to-write-performance-review", "how-to-create-content-calendar",
  "how-to-write-nda", "how-to-write-executive-summary",
  "how-to-write-resignation-letter", "how-to-write-recommendation-letter",
  "how-to-create-elevator-pitch", "how-to-write-case-study",
  "how-to-write-white-paper", "how-to-create-landing-page-copy",
  "how-to-write-ad-copy", "how-to-write-email-subject-line",
  "how-to-create-youtube-thumbnail-text", "how-to-write-podcast-script",
  "how-to-write-video-description", "how-to-write-instagram-caption",
  "how-to-write-twitter-bio", "how-to-create-linkedin-post",
  "how-to-write-sales-proposal", "how-to-create-employee-handbook",
  "how-to-write-grant-proposal", "how-to-write-research-summary",
  "how-to-create-meeting-agenda", "how-to-write-project-brief",
  "how-to-create-style-guide", "how-to-write-faq-page",
  "how-to-write-about-us-page", "how-to-create-brand-voice-guide",
  "how-to-write-affiliate-disclosure", "how-to-create-privacy-policy",
  "how-to-write-refund-policy", "how-to-create-onboarding-email",
  "how-to-write-follow-up-email", "how-to-create-drip-campaign",
];

function problemTitle(slug: string): string {
  return slug
    .replace(/^how-to-/, "How to ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();
  const { admin } = auth;

  const body = await req.json().catch(() => ({}));
  const count = Math.min(Number(body.count ?? 5), 20);

  // Fetch existing flat_slugs
  const { data: existing } = await admin
    .from("seo_problems")
    .select("flat_slug");
  const existingSet = new Set(
    (existing ?? []).map((r: { flat_slug: string | null }) => r.flat_slug).filter(Boolean)
  );

  const remaining = PROBLEMS.filter((p) => !existingSet.has(p));

  if (remaining.length === 0) {
    return NextResponse.json({ generated: 0, message: "All problems already generated" });
  }

  let generated = 0;
  const toProcess = remaining.slice(0, count);

  for (const flatSlug of toProcess) {
    const title = problemTitle(flatSlug);

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: `Write a comprehensive guide: "${title}"

Include:
1. Why this skill matters (2 paragraphs)
2. Step-by-step guide (5-7 numbered steps)
3. AI-powered approach: how to do this with AI tools
4. Real example (before/after)
5. Common mistakes to avoid
6. Pro tips

Return JSON: { "seo_title": "string (max 60 chars)", "seo_description": "string (max 155 chars)", "content": "string (markdown)" }`,
          },
        ],
        max_tokens: 1400,
      });

      const raw = completion.choices[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(raw) as {
        seo_title?: string;
        seo_description?: string;
        content?: string;
      };

      await admin.from("seo_problems").insert({
        slug: flatSlug,
        flat_slug: flatSlug,
        problem: title,
        seo_title: parsed.seo_title ?? `${title} | AI Tools Hub`,
        seo_description: parsed.seo_description ?? `A complete guide: ${title}. Step-by-step with AI tools.`,
        content: parsed.content ?? "",
      });

      generated++;
    } catch {
      // continue on error
    }
  }

  return NextResponse.json({ generated });
}
