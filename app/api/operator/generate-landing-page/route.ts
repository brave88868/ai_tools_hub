import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { admin } = auth;
  const body = await req.json();
  const { idea_id } = body as { idea_id: string };

  if (!idea_id) {
    return NextResponse.json({ error: "idea_id is required" }, { status: 400 });
  }

  const { data: idea } = await admin
    .from("startup_ideas")
    .select("id, product_name, slug, tagline, description, features, target_users")
    .eq("id", idea_id)
    .single();

  if (!idea) return NextResponse.json({ error: "Idea not found" }, { status: 404 });

  const featuresStr = Array.isArray(idea.features)
    ? (idea.features as string[]).join(", ")
    : String(idea.features ?? "");

  const prompt = `Write a complete SaaS landing page for:
Product: ${idea.product_name}
Tagline: ${idea.tagline ?? ""}
Description: ${idea.description ?? ""}
Features: ${featuresStr}
Target Users: ${idea.target_users ?? ""}

Return ONLY JSON:
{
  "hero_headline": "compelling H1 max 10 words",
  "hero_subheadline": "subheadline max 20 words",
  "how_it_works": ["step1", "step2", "step3"],
  "use_cases": ["use case 1", "use case 2", "use case 3"],
  "faq": [
    {"question": "q1", "answer": "a1"},
    {"question": "q2", "answer": "a2"},
    {"question": "q3", "answer": "a3"}
  ],
  "seo_title": "max 60 chars",
  "seo_description": "max 155 chars"
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  let landingPage: Record<string, unknown>;
  try {
    landingPage = JSON.parse(completion.choices[0].message.content ?? "{}");
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }

  // Update saas_projects meta field with landing page content
  await admin
    .from("saas_projects")
    .update({
      tagline: String(landingPage.hero_subheadline ?? idea.tagline ?? ""),
      meta: landingPage,
    })
    .eq("slug", idea.slug);

  // Update startup_ideas status
  await admin
    .from("startup_ideas")
    .update({ status: "building" })
    .eq("id", idea_id);

  return NextResponse.json({ success: true, landing_page: landingPage });
}
