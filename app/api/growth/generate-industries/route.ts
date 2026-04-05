import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import { openai } from "@/lib/openai";
import { INDUSTRY_SLUGS, slugToTitle } from "@/lib/seo/seo-constants";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();
  const { admin } = auth;

  const body = await req.json().catch(() => ({}));
  const count = Math.min(Number(body.limit ?? 5), 15);

  const { data: existingSlugs } = await admin
    .from("seo_industries")
    .select("slug");
  const existingSet = new Set((existingSlugs ?? []).map((r: { slug: string }) => r.slug));

  const candidates = INDUSTRY_SLUGS.filter((slug) => !existingSet.has(slug));

  if (candidates.length === 0) {
    return NextResponse.json({ success: true, generated: 0, message: "All industry pages already generated" });
  }

  const toGenerate = candidates.slice(0, count);
  let generated = 0;
  const errors: string[] = [];

  for (const industrySlug of toGenerate) {
    const industryName = slugToTitle(industrySlug);
    try {
      const prompt = `Write an SEO landing page: "Best AI Tools for ${industryName} in 2025"

Include:
1. Common challenges faced by ${industryName}
2. How AI tools solve these problems
3. Top 5 recommended AI tools with specific use cases
4. Getting started guide (3-5 steps)
5. FAQ section (3 questions)

Return ONLY valid JSON:
{"seo_title":"string max 60 chars","seo_description":"string max 155 chars","content":"full 800 word markdown page"}`;

      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const article = JSON.parse(res.choices[0].message.content ?? "{}");
      const { error } = await admin.from("seo_industries").insert({
        slug: industrySlug,
        industry: industryName,
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

  return NextResponse.json({ success: true, generated, errors });
}
