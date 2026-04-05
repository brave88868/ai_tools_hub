import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import OpenAI from "openai";
import { INTENT_SLUGS } from "@/lib/seo/seo-constants";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const count = Math.min(parseInt(body.count ?? "5", 10), 15);

  const { admin } = auth;
  const { data: existing } = await admin.from("seo_intents").select("slug");
  const existingSet = new Set((existing ?? []).map((r: { slug: string }) => r.slug));

  const candidates = INTENT_SLUGS.filter((i) => !existingSet.has(i.slug)).slice(0, count);

  let generated = 0;
  const errors: string[] = [];

  for (const item of candidates) {
    try {
      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: `Write an SEO page: "Best AI Tools for ${item.intent} in 2025"

Include:
1. Why AI tools are essential for ${item.intent}
2. Top 5 recommended tools with specific use cases
3. How to choose the right tool
4. Getting started (3 quick steps)
5. FAQ (3 questions)

Return ONLY valid JSON:
{"seo_title":"string max 60 chars","seo_description":"string max 155 chars","content":"full 800 word markdown page"}`,
        }],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const article = JSON.parse(res.choices[0].message.content ?? "{}");
      const { error } = await admin.from("seo_intents").insert({
        intent: item.intent,
        slug: item.slug,
        category: item.category,
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
