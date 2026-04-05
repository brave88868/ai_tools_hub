import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

  const { data: existing } = await admin.from("seo_templates").select("slug");
  const existingSet = new Set((existing ?? []).map((r: { slug: string }) => r.slug));

  const candidates = tools
    .map((t) => ({ slug: `${t.slug}-template`, tool_slug: t.slug, name: t.name }))
    .filter((c) => !existingSet.has(c.slug))
    .sort(() => Math.random() - 0.5)
    .slice(0, count);

  let generated = 0;
  const errors: string[] = [];

  for (const item of candidates) {
    try {
      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: `Write an SEO page about the "${item.name} Template".

Include:
1. What this template is used for
2. The template structure (sections/fields with descriptions)
3. Example filled-in template
4. Tips for customizing it
5. How AI can help generate this template automatically

Return ONLY valid JSON:
{"template_name":"descriptive name for this template","seo_title":"string max 60 chars","seo_description":"string max 155 chars","content":"full 700 word markdown page"}`,
        }],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const article = JSON.parse(res.choices[0].message.content ?? "{}");
      const { error } = await admin.from("seo_templates").insert({
        template_name: article.template_name ?? `${item.name} Template`,
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
