import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const GUIDE_ACTIONS = [
  "write", "create", "generate", "optimize", "improve",
  "build", "draft", "design", "analyze", "automate",
];

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const count = Math.min(parseInt(body.count ?? "10", 10), 30);

  const { admin } = auth;
  const { data: tools } = await admin
    .from("tools")
    .select("slug, name")
    .eq("is_active", true)
    .limit(50);

  if (!tools || tools.length === 0) {
    return NextResponse.json({ error: "No tools found" }, { status: 400 });
  }

  const { data: existing } = await admin.from("seo_guides").select("slug");
  const existingSet = new Set((existing ?? []).map((r: { slug: string }) => r.slug));

  // Generate how-to-{action}-with-{tool} combos
  const candidates: { slug: string; tool_slug: string; action: string; name: string }[] = [];
  for (const tool of tools) {
    for (const action of GUIDE_ACTIONS) {
      const slug = `how-to-${action}-with-${tool.slug}`;
      if (!existingSet.has(slug)) {
        candidates.push({ slug, tool_slug: tool.slug, action, name: tool.name });
      }
    }
  }

  const toGenerate = candidates.sort(() => Math.random() - 0.5).slice(0, count);
  let generated = 0;
  const errors: string[] = [];

  for (const item of toGenerate) {
    const guideTopic = `How to ${item.action} with ${item.name}`;
    try {
      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: `Write a step-by-step guide: "${guideTopic}"

Include:
1. Overview and what you'll achieve
2. Step-by-step instructions (5-7 steps)
3. Tips for best results
4. Common mistakes to avoid
5. FAQ (2 questions)

Return ONLY valid JSON:
{"guide_topic":"string (the guide title)","seo_title":"string max 60 chars","seo_description":"string max 155 chars","content":"full 700 word markdown guide"}`,
        }],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const article = JSON.parse(res.choices[0].message.content ?? "{}");
      const { error } = await admin.from("seo_guides").insert({
        guide_topic: article.guide_topic ?? guideTopic,
        slug: item.slug,
        tool_slug: item.tool_slug,
        seo_title: article.seo_title,
        seo_description: article.seo_description,
        content: article.content,
      });

      if (!error) generated++;
      else errors.push(error.message);
    } catch (err) {
      errors.push((err as Error).message);
    }
  }

  return NextResponse.json({ generated, errors: errors.slice(0, 5) });
}
