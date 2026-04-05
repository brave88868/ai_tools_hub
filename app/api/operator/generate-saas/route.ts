import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { admin } = auth;
  const body = await req.json();
  const { keyword, template = "standard" } = body as { keyword: string; template?: string };

  if (!keyword?.trim()) {
    return NextResponse.json({ error: "keyword is required" }, { status: 400 });
  }

  // Step 1: Generate SaaS info with GPT-4o-mini
  const prompt = `You are a SaaS product expert.
Based on this keyword: "${keyword.trim()}"

Generate a micro-SaaS product. Return ONLY JSON:
{
  "name": "product name (e.g. YouTube Title AI)",
  "slug": "url-slug (e.g. youtube-title-ai)",
  "domain": "suggested domain (e.g. youtubetitleai.com)",
  "tagline": "one-line tagline (max 10 words)",
  "description": "2-sentence product description",
  "template": "standard"
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  let generated: Record<string, string>;
  try {
    generated = JSON.parse(completion.choices[0].message.content ?? "{}");
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }

  const { name, slug, domain, tagline, description } = generated;
  if (!name || !slug) {
    return NextResponse.json({ error: "AI returned incomplete data" }, { status: 500 });
  }

  // Step 2: Insert into saas_projects
  const { data: project, error: insertError } = await admin
    .from("saas_projects")
    .insert({
      name,
      slug,
      domain: domain ?? null,
      template: template ?? "standard",
      keyword: keyword.trim(),
      description: description ?? null,
      tagline: tagline ?? null,
      status: "draft",
    })
    .select("id, name, slug, domain, tagline")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Step 3: Trigger SEO pages generation (fire-and-forget with auth forwarded)
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const token = req.headers.get("authorization") ?? "";
  try {
    void fetch(`${APP_URL}/api/operator/generate-saas-pages`, {
      method: "POST",
      headers: { "Authorization": token, "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: project.id, count: 20 }),
    });
  } catch {
    // non-critical
  }

  return NextResponse.json({ success: true, project });
}
