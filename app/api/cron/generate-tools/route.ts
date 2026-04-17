import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import OpenAI from "openai";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  const toolkits = ["jobseeker", "creator", "marketing", "business", "legal", "exam"];
  const selected = toolkits[(new Date().getDay() + 1) % toolkits.length];

  // Generate 1 tool idea per invocation
  const { data: existing } = await admin.from("tools").select("slug");
  const { data: existingIdeas } = await admin.from("tool_ideas").select("tool_slug");
  const usedSlugs = new Set([
    ...(existing ?? []).map((t: { slug: string }) => t.slug),
    ...(existingIdeas ?? []).map((i: { tool_slug: string }) => i.tool_slug),
  ]);

  const ideaPrompt = `Generate 1 new AI tool idea for "${selected}" toolkit.
Avoid: ${[...usedSlugs].slice(0, 10).join(", ")}
Return ONLY: {"tools":[{"tool_name":"...","tool_slug":"...","description":"...","prompt_template":"...","seo_title":"...","seo_description":"..."}]}`;

  const ideaRes = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: ideaPrompt }],
    temperature: 0.9,
    max_tokens: 400,
    response_format: { type: "json_object" },
  });

  const { tools: ideas = [] } = JSON.parse(ideaRes.choices[0].message.content ?? "{}");
  let ideasAdded = 0;
  for (const idea of ideas as Array<Record<string, string>>) {
    if (!idea.tool_slug || usedSlugs.has(idea.tool_slug)) continue;
    const { error } = await admin.from("tool_ideas").insert({ ...idea, toolkit_slug: selected, status: "pending" });
    if (!error) ideasAdded++;
  }

  console.log(`[cron/generate-tools] toolkit=${selected} ideas_added=${ideasAdded}`);
  return Response.json({ success: true, toolkit: selected, ideas_added: ideasAdded });
}
