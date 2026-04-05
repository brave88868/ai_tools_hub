import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function uniqueSlug(
  admin: ReturnType<typeof import("@/lib/supabase").createAdminClient>,
  base: string
): Promise<string> {
  let slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  let attempt = 0;
  while (true) {
    const candidate = attempt === 0 ? slug : `${slug}-${attempt + 1}`;
    const [{ data: inIdeas }, { data: inProjects }] = await Promise.all([
      admin.from("startup_ideas").select("id").eq("slug", candidate).limit(1),
      admin.from("saas_projects").select("id").eq("slug", candidate).limit(1),
    ]);
    if (!inIdeas?.length && !inProjects?.length) return candidate;
    attempt++;
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { admin } = auth;
  const body = await req.json();
  const { opportunity_id } = body as { opportunity_id: string };

  if (!opportunity_id) {
    return NextResponse.json({ error: "opportunity_id is required" }, { status: 400 });
  }

  // Get opportunity + analysis
  const { data: opp } = await admin
    .from("startup_opportunities")
    .select("id, keyword")
    .eq("id", opportunity_id)
    .single();

  if (!opp) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });

  const { data: analysis } = await admin
    .from("startup_analysis")
    .select("ai_summary, score, recommended_product_name, target_users")
    .eq("opportunity_id", opportunity_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const prompt = `Generate a complete micro-SaaS product idea for:
Keyword: ${opp.keyword}
Market Analysis: ${analysis?.ai_summary ?? "High-potential market with clear monetization."}

Return ONLY JSON:
{
  "product_name": "Name (e.g. MeetingNotes AI)",
  "slug": "url-slug (e.g. meetingnotes-ai)",
  "tagline": "One-line tagline max 10 words",
  "description": "2-sentence product description",
  "features": ["feature1", "feature2", "feature3", "feature4", "feature5"],
  "target_users": "Primary target user description",
  "pricing_model": "freemium"
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  let idea: Record<string, unknown>;
  try {
    idea = JSON.parse(completion.choices[0].message.content ?? "{}");
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }

  const slug = await uniqueSlug(admin, String(idea.slug ?? idea.product_name ?? opp.keyword));

  // Insert startup_idea
  const { data: inserted, error: ideaError } = await admin
    .from("startup_ideas")
    .insert({
      opportunity_id,
      product_name: idea.product_name,
      slug,
      tagline: idea.tagline ?? null,
      description: idea.description ?? null,
      features: idea.features ?? [],
      target_users: idea.target_users ?? analysis?.target_users ?? null,
      pricing_model: idea.pricing_model ?? "freemium",
      status: "idea",
    })
    .select("id, product_name, slug")
    .single();

  if (ideaError) return NextResponse.json({ error: ideaError.message }, { status: 500 });

  // Insert into saas_projects (upsert by slug)
  const { data: saasProject } = await admin
    .from("saas_projects")
    .upsert(
      {
        name: String(idea.product_name),
        slug,
        keyword: opp.keyword,
        tagline: String(idea.tagline ?? ""),
        description: String(idea.description ?? ""),
        status: "draft",
        template: "standard",
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  // Mark opportunity as converted
  await admin
    .from("startup_opportunities")
    .update({ status: "converted" })
    .eq("id", opportunity_id);

  return NextResponse.json({
    success: true,
    idea: inserted,
    saas_project_id: saasProject?.id ?? null,
  });
}
