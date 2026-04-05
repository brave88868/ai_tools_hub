import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import { openai } from "@/lib/openai";
import { WORKFLOW_SLUGS, slugToTitle } from "@/lib/seo/seo-constants";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();
  const { admin } = auth;

  const body = await req.json().catch(() => ({}));
  const count = Math.min(Number(body.limit ?? 5), 15);

  const { data: existingSlugs } = await admin
    .from("seo_workflows")
    .select("slug");
  const existingSet = new Set((existingSlugs ?? []).map((r: { slug: string }) => r.slug));

  const candidates = WORKFLOW_SLUGS.filter((slug) => !existingSet.has(slug));

  if (candidates.length === 0) {
    return NextResponse.json({ success: true, generated: 0, message: "All workflow pages already generated" });
  }

  const toGenerate = candidates.slice(0, count);
  let generated = 0;
  const errors: string[] = [];

  for (const workflowSlug of toGenerate) {
    const workflowTitle = slugToTitle(workflowSlug);
    try {
      const prompt = `Write a workflow guide: "${workflowTitle}"

Include:
1. Overview of the workflow and what you'll achieve
2. Step-by-step process (5-7 detailed steps with AI tool suggestions)
3. AI tools used in each step and how
4. Time estimates for each step
5. Tips for best results and common pitfalls to avoid

Return ONLY valid JSON:
{"seo_title":"string max 60 chars","seo_description":"string max 155 chars","content":"full 800 word markdown workflow guide"}`;

      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const article = JSON.parse(res.choices[0].message.content ?? "{}");
      const { error } = await admin.from("seo_workflows").insert({
        slug: workflowSlug,
        workflow: workflowTitle,
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
