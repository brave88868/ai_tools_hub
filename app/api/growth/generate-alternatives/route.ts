import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import { openai } from "@/lib/openai";
import { COMPETITOR_TOOLS } from "@/lib/seo/seo-constants";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();
  const { admin } = auth;

  const body = await req.json().catch(() => ({}));
  const count = Math.min(Number(body.limit ?? 5), 15);

  // Fetch existing slugs
  const { data: existingSlugs } = await admin
    .from("seo_alternatives")
    .select("slug");
  const existingSet = new Set((existingSlugs ?? []).map((r: { slug: string }) => r.slug));

  // Candidates not yet generated
  const candidates = COMPETITOR_TOOLS.filter((tool) => {
    const slug = tool.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-alternatives";
    return !existingSet.has(slug);
  });

  if (candidates.length === 0) {
    return NextResponse.json({ success: true, generated: 0, message: "All alternatives already generated" });
  }

  const toGenerate = candidates.slice(0, count);
  let generated = 0;
  const errors: string[] = [];

  for (const toolName of toGenerate) {
    const slug = toolName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-alternatives";
    try {
      const prompt = `Write an SEO article: "Top 10 Alternatives to ${toolName} in 2025"

For each alternative include: overview, key features, pricing, pros and cons.
Focus on how AI Tools Station tools compare as strong alternatives.
Include a comparison summary at the end.

Return ONLY valid JSON:
{"title":"string max 80 chars","seo_title":"string max 60 chars","seo_description":"string max 155 chars","content":"full 900 word markdown article"}`;

      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const article = JSON.parse(res.choices[0].message.content ?? "{}");
      const { error } = await admin.from("seo_alternatives").insert({
        slug,
        tool_name: toolName,
        title: article.title,
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
