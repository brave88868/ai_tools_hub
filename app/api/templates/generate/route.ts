import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { anthropic } from "@/lib/claude";

// tool_slug → category 映射
const TOOL_CATEGORIES: Record<string, string> = {
  "resume-optimizer": "resume",
  "cover-letter-generator": "cover-letter",
  "linkedin-profile-optimizer": "linkedin",
  "email-generator": "email",
  "business-plan-generator": "business-plan",
  "marketing-copy-generator": "marketing",
  "blog-post-generator": "blog",
  "youtube-script-generator": "video-script",
  "meeting-notes-generator": "productivity",
  "social-media-caption-generator": "social-media",
};

// 每个分类的模板变体
const TEMPLATE_VARIANTS: Record<string, string[]> = {
  "resume": ["Software Engineer", "Marketing Manager", "Product Manager", "Data Analyst", "Sales Representative"],
  "cover-letter": ["Tech Industry", "Finance", "Healthcare", "Creative", "Entry Level"],
  "linkedin": ["Software Engineer", "Sales Professional", "Marketing Manager", "Consultant", "Executive"],
  "email": ["Cold Outreach", "Follow-up", "Product Launch", "Customer Onboarding", "Re-engagement"],
  "business-plan": ["SaaS Startup", "E-commerce", "Consulting", "Restaurant", "Mobile App"],
  "marketing": ["Social Media Ad", "Email Campaign", "Landing Page", "Blog Post", "Product Description"],
  "blog": ["How-to Guide", "Listicle", "Case Study", "Opinion Piece", "Product Review"],
  "video-script": ["YouTube Tutorial", "Product Demo", "Interview", "Explainer", "Vlog"],
  "productivity": ["Weekly Review", "Project Kickoff", "Sprint Planning", "Retrospective", "One-on-One"],
  "social-media": ["Instagram Post", "LinkedIn Post", "Twitter Thread", "Facebook Post", "TikTok Caption"],
};

function generateSlug(toolSlug: string, variant: string): string {
  return `${variant.toLowerCase().replace(/\s+/g, "-")}-${toolSlug}-template`;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: tools } = await admin
    .from("tools")
    .select("slug, name")
    .eq("is_active", true);

  if (!tools?.length) {
    return NextResponse.json({ success: true, message: "No tools found" });
  }

  const results = { created: 0, skipped: 0, errors: 0 };

  for (const tool of tools) {
    const category = TOOL_CATEGORIES[tool.slug] || "general";
    const variants =
      TEMPLATE_VARIANTS[category] ||
      ["Professional", "Simple", "Creative", "Modern", "Classic"];

    for (const variant of variants) {
      const slug = generateSlug(tool.slug, variant);

      const { data: existing } = await admin
        .from("tool_templates")
        .select("id")
        .eq("slug", slug)
        .single();

      if (existing) {
        results.skipped++;
        continue;
      }

      try {
        const response = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 800,
          messages: [
            {
              role: "user",
              content: `Create a professional ${variant} ${category.replace(/-/g, " ")} template.

Requirements:
- Ready to use with clear placeholders like [YOUR NAME], [COMPANY NAME], etc.
- Professional and practical
- 200-400 words
- Include all essential sections for a ${variant} ${category}

Output the template content only, no explanation.`,
            },
          ],
        });

        const content =
          response.content[0].type === "text" ? response.content[0].text : "";

        await admin.from("tool_templates").insert({
          tool_slug: tool.slug,
          title: `${variant} ${tool.name} Template`,
          slug,
          content,
          category,
          description: `Free ${variant.toLowerCase()} ${category.replace(/-/g, " ")} template. Ready to use with AI customization.`,
          is_active: true,
        });

        results.created++;
        await new Promise((r) => setTimeout(r, 400));
      } catch (err) {
        console.error(`[templates/generate] error for ${slug}:`, err);
        results.errors++;
      }
    }
  }

  return NextResponse.json({ success: true, results });
}
