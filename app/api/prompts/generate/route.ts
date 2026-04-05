import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import { anthropic } from "@/lib/claude";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// category → 生成变体列表
const PROMPT_CATEGORIES: Record<string, string[]> = {
  resume: [
    "software engineer", "marketing manager", "product manager",
    "data analyst", "sales representative", "graphic designer",
    "teacher", "nurse", "accountant", "project manager",
    "entry level", "career change", "senior executive",
    "remote job", "internship",
  ],
  email: [
    "cold outreach", "follow-up", "product launch", "customer onboarding",
    "re-engagement", "apology", "sales pitch", "networking",
    "job application", "invoice", "partnership proposal", "thank you",
  ],
  marketing: [
    "social media ad", "instagram caption", "linkedin post",
    "google ad copy", "email subject line", "landing page headline",
    "product description", "brand story", "press release", "tagline",
  ],
  "business-plan": [
    "saas startup", "ecommerce store", "restaurant", "consulting firm",
    "mobile app", "freelance business", "nonprofit", "retail shop",
  ],
  "cover-letter": [
    "software developer", "marketing specialist", "finance analyst",
    "healthcare worker", "teacher", "creative professional",
    "entry level graduate", "career switcher",
  ],
  legal: [
    "privacy policy", "terms of service", "nda agreement",
    "freelance contract", "employment contract", "refund policy",
  ],
  youtube: [
    "tutorial video", "product review", "vlog", "educational content",
    "how-to guide", "interview", "reaction video",
  ],
  "meeting-notes": [
    "weekly standup", "project kickoff", "client meeting",
    "performance review", "brainstorming session", "retrospective",
  ],
};

async function generatePromptsForCategory(
  category: string,
  variants: string[],
  supabase: ReturnType<typeof createAdminClient>
): Promise<number> {
  let created = 0;

  for (const variant of variants) {
    const slug = `${variant.replace(/\s+/g, "-")}-${category}-prompt`;

    // 跳过已存在
    const { data: existing } = await supabase
      .from("ai_prompts")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existing) continue;

    try {
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        messages: [
          {
            role: "user",
            content: `Create a detailed, ready-to-use AI prompt for: "${variant} ${category}".

The prompt should:
- Be specific and actionable
- Include placeholders like [YOUR NAME], [COMPANY], [YEARS OF EXPERIENCE]
- Produce professional, high-quality output when used with ChatGPT or Claude
- Be 100-200 words

Also provide:
- A short example output (50-80 words showing what the AI would produce)
- 5 SEO keywords (comma-separated)

Output ONLY valid JSON, no markdown:
{
  "prompt_text": "...",
  "example_output": "...",
  "use_case": "one sentence describing when to use this",
  "keywords": ["kw1", "kw2", "kw3", "kw4", "kw5"]
}`,
          },
        ],
      });

      const raw =
        response.content[0].type === "text" ? response.content[0].text : "{}";
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());

      const { error } = await supabase.from("ai_prompts").insert({
        category,
        title: `${variant.charAt(0).toUpperCase() + variant.slice(1)} ${category.replace(/-/g, " ")} prompt`,
        slug,
        prompt_text: parsed.prompt_text || "",
        example_output: parsed.example_output || null,
        use_case: parsed.use_case || null,
        keywords: parsed.keywords || [],
        difficulty: "beginner",
        is_active: true,
      });

      if (!error) {
        created++;
      } else {
        console.error(`[prompts/generate] insert error for ${slug}:`, error.message);
      }

      await new Promise((r) => setTimeout(r, 300)); // rate limit
    } catch (err) {
      console.error(`[prompts/generate] error for ${slug}:`, err);
    }
  }

  return created;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isCron) {
    const auth = await requireAdmin(req);
    if (!auth) return unauthorized();
  }

  const body = await req.json().catch(() => ({}));
  const targetCategory = body.category as string | undefined;
  const supabase = createAdminClient();

  const results: Record<string, number> = {};

  const categories = targetCategory
    ? { [targetCategory]: PROMPT_CATEGORIES[targetCategory] || [] }
    : PROMPT_CATEGORIES;

  for (const [cat, variants] of Object.entries(categories)) {
    const count = await generatePromptsForCategory(cat, variants, supabase);
    results[cat] = count;
  }

  const total = Object.values(results).reduce((a, b) => a + b, 0);
  return NextResponse.json({ success: true, total, generated: total, results });
}
