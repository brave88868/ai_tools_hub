import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import OpenAI from "openai";
import { KEYWORD_MODIFIERS } from "@/lib/seo/seo-constants";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const count = Math.min(parseInt(body.count ?? "20", 10), 50);

  const { admin } = auth;
  const { data: tools } = await admin
    .from("tools")
    .select("slug, name")
    .eq("is_active", true)
    .limit(30);

  if (!tools || tools.length === 0) {
    return NextResponse.json({ error: "No tools found" }, { status: 400 });
  }

  const { data: existing } = await admin.from("seo_keyword_pages").select("slug");
  const existingSet = new Set((existing ?? []).map((r: { slug: string }) => r.slug));

  // Generate candidates: tool + modifier combos
  const candidates: { keyword: string; slug: string; tool_slug: string }[] = [];
  for (const tool of tools) {
    for (const mod of KEYWORD_MODIFIERS) {
      const keyword = `${tool.name} ${mod}`;
      const slug = `${tool.slug}-${mod}`;
      if (!existingSet.has(slug)) {
        candidates.push({ keyword, slug, tool_slug: tool.slug });
      }
    }
  }

  const toGenerate = candidates.sort(() => Math.random() - 0.5).slice(0, count);
  let generated = 0;
  const errors: string[] = [];

  for (const item of toGenerate) {
    try {
      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: `Write an SEO landing page about: "${item.keyword}"

Include:
1. What this AI tool does
2. Key features and benefits
3. Who should use it
4. How to get started (3 steps)
5. FAQ (2 questions)

Return ONLY valid JSON:
{"seo_title":"string max 60 chars","seo_description":"string max 155 chars","content":"full 600 word markdown page"}`,
        }],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const article = JSON.parse(res.choices[0].message.content ?? "{}");
      const { error } = await admin.from("seo_keyword_pages").insert({
        keyword: item.keyword,
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
