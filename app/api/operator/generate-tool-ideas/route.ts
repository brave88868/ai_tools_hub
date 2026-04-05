import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TOOLKITS = ["jobseeker", "creator", "marketing", "business", "legal", "exam"];

async function generateIdeasForToolkit(toolkit: string, existingSlugs: Set<string>) {
  const prompt = `Generate 3 new AI tool ideas for the "${toolkit}" toolkit on an AI tools SaaS platform.
Each tool should be practical, focused, and different from: ${[...existingSlugs].slice(0, 10).join(", ")}.

Return ONLY valid JSON array with no markdown:
[
  {
    "tool_name": "Human readable name",
    "tool_slug": "kebab-case-slug",
    "description": "One sentence description",
    "prompt_template": "You are an AI assistant helping with {input}. Provide detailed assistance.",
    "seo_title": "SEO title max 60 chars",
    "seo_description": "SEO description max 155 chars"
  }
]`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.9,
    response_format: { type: "json_object" },
  });

  const parsed = JSON.parse(res.choices[0].message.content ?? "{}");
  return Array.isArray(parsed) ? parsed : (parsed.tools ?? parsed.ideas ?? Object.values(parsed)[0] ?? []);
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: rec } = await admin.from("users").select("role").eq("id", user.id).single();
  if (rec?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: existingTools } = await admin.from("tools").select("slug");
  const { data: existingIdeas } = await admin.from("tool_ideas").select("tool_slug");
  const existingSlugs = new Set([
    ...(existingTools ?? []).map((t: { slug: string }) => t.slug),
    ...(existingIdeas ?? []).map((i: { tool_slug: string }) => i.tool_slug),
  ]);

  let total = 0;
  for (const toolkit of TOOLKITS) {
    try {
      const ideas = await generateIdeasForToolkit(toolkit, existingSlugs);
      for (const idea of ideas) {
        if (!idea.tool_slug || existingSlugs.has(idea.tool_slug)) continue;
        await admin.from("tool_ideas").insert({ ...idea, toolkit_slug: toolkit, status: "pending" });
        existingSlugs.add(idea.tool_slug);
        total++;
      }
    } catch (err) {
      console.error(`[generate-tool-ideas] ${toolkit}:`, err);
    }
  }

  return NextResponse.json({ success: true, generated: total });
}
