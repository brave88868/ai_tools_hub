import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import { openai } from "@/lib/openai";
import { PROBLEM_SLUGS, slugToTitle } from "@/lib/seo/seo-constants";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();
  const { admin } = auth;

  const body = await req.json().catch(() => ({}));
  const count = Math.min(Number(body.limit ?? 5), 15);

  const { data: existingSlugs } = await admin
    .from("seo_problems")
    .select("slug");
  const existingSet = new Set((existingSlugs ?? []).map((r: { slug: string }) => r.slug));

  const candidates = PROBLEM_SLUGS.filter((slug) => !existingSet.has(slug));

  if (candidates.length === 0) {
    return NextResponse.json({ success: true, generated: 0, message: "All problem pages already generated" });
  }

  const toGenerate = candidates.slice(0, count);
  let generated = 0;
  const errors: string[] = [];

  for (const problemSlug of toGenerate) {
    const problemTitle = slugToTitle(problemSlug);
    try {
      const prompt = `Write a comprehensive how-to guide: "${problemTitle}"

Include:
1. Understanding the problem and why it matters
2. Step-by-step solution (5-7 clear steps)
3. AI tools that help with each step
4. Real examples with before/after
5. Common mistakes to avoid

Return ONLY valid JSON:
{"seo_title":"string max 60 chars","seo_description":"string max 155 chars","content":"full 800 word markdown guide"}`;

      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const article = JSON.parse(res.choices[0].message.content ?? "{}");
      const { error } = await admin.from("seo_problems").insert({
        slug: problemSlug,
        problem: problemTitle,
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
