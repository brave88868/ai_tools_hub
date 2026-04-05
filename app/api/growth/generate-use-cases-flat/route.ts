import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import { openai } from "@/lib/openai";

const PROFESSIONS = [
  "software-engineers", "data-analysts", "product-managers",
  "marketing-managers", "content-creators", "freelancers", "students",
  "teachers", "lawyers", "accountants", "hr-managers", "sales-representatives",
  "business-owners", "entrepreneurs", "designers", "developers",
  "researchers", "journalists", "nurses", "real-estate-agents",
  "project-managers", "consultants", "coaches", "recruiters",
  "social-media-managers", "copywriters", "seo-specialists",
  "finance-professionals", "customer-success-managers", "executives",
  "virtual-assistants", "event-planners", "photographers", "videographers",
  "podcasters", "authors", "professors", "data-scientists", "engineers",
  "architects", "doctors", "pharmacists", "therapists", "non-profit-managers",
  "operations-managers", "supply-chain-managers", "cybersecurity-analysts",
  "ux-designers", "game-developers", "mobile-developers", "devops-engineers",
  "blockchain-developers", "ai-engineers", "investment-bankers",
  "venture-capitalists", "startup-founders", "e-commerce-sellers",
  "amazon-sellers", "dropshippers", "affiliate-marketers", "growth-hackers",
  "performance-marketers", "email-marketers", "pr-specialists",
  "brand-managers", "creative-directors", "art-directors",
  "technical-writers", "grant-writers", "scriptwriters", "translators",
  "life-coaches", "career-coaches", "fitness-trainers", "nutritionists",
];

function professionDisplay(slug: string): string {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();
  const { admin } = auth;

  const body = await req.json().catch(() => ({}));
  const count = Math.min(Number(body.count ?? 20), 50);
  const toolSlugFilter: string | undefined = body.tool_slug;

  // Fetch tools
  const toolsQuery = admin.from("tools").select("slug, name").eq("is_active", true);
  const { data: tools } = toolSlugFilter
    ? await toolsQuery.eq("slug", toolSlugFilter)
    : await toolsQuery.order("sort_order").limit(20);

  if (!tools || tools.length === 0) {
    return NextResponse.json({ error: "No tools found" }, { status: 400 });
  }

  // Fetch already-generated use case slugs
  const { data: existing } = await admin
    .from("seo_use_cases")
    .select("slug");
  const existingSet = new Set((existing ?? []).map((r: { slug: string }) => r.slug));

  let generated = 0;
  let attempts = 0;
  const maxAttempts = count * 8;

  while (generated < count && attempts < maxAttempts) {
    attempts++;
    const tool = tools[Math.floor(Math.random() * tools.length)];
    const profession = PROFESSIONS[Math.floor(Math.random() * PROFESSIONS.length)];
    const slug = `ai-${tool.slug}-for-${profession}`;

    if (existingSet.has(slug)) continue;
    existingSet.add(slug);

    const profDisplay = professionDisplay(profession);

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: `Create an SEO landing page for this use case:
Tool: ${tool.name}
Target user: ${profDisplay}s
URL will be: /ai-${tool.slug}-for-${profession}

Write a 700-word SEO page including:
1. Title: "AI ${tool.name} for ${profDisplay}s"
2. Why ${profDisplay}s need this tool
3. Specific use cases and examples for this profession
4. Step-by-step guide for ${profDisplay}s
5. Results they can expect

Return JSON: { "title": "string", "seo_title": "string (max 60 chars)", "seo_description": "string (max 155 chars)", "content": "string (markdown)" }`,
          },
        ],
        max_tokens: 1200,
      });

      const raw = completion.choices[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(raw) as {
        title?: string;
        seo_title?: string;
        seo_description?: string;
        content?: string;
      };

      await admin.from("seo_use_cases").insert({
        slug,
        tool_slug: tool.slug,
        profession,
        title: parsed.title ?? `AI ${tool.name} for ${profDisplay}s`,
        seo_title: parsed.seo_title ?? `AI ${tool.name} for ${profDisplay}s | AI Tools Hub`,
        seo_description: parsed.seo_description ?? `Use AI-powered ${tool.name} as a ${profDisplay}. Save time, improve results.`,
        content: parsed.content ?? "",
      });

      generated++;
    } catch {
      // continue on error
    }
  }

  return NextResponse.json({ generated });
}
