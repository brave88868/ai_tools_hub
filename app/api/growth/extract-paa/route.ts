import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 100);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const count: number = Math.min(parseInt(body.count ?? "10", 10), 30);
  let keywords: string[] = body.keywords ?? [];

  const { admin } = auth;

  // 没传 keywords，从 growth_keywords 取 pending 状态的词
  if (keywords.length === 0) {
    const { data: pendingKws } = await admin
      .from("growth_keywords")
      .select("keyword")
      .eq("status", "pending")
      .limit(count);
    keywords = (pendingKws ?? []).map((r: { keyword: string }) => r.keyword);
  }

  if (keywords.length === 0) {
    return NextResponse.json({ extracted: 0, questions: [] });
  }

  // 取已存在的 slug 用于去重
  const { data: existingQs } = await admin.from("growth_questions").select("slug");
  const existingSlugSet = new Set((existingQs ?? []).map((r: { slug: string }) => r.slug));

  const allExtracted: string[] = [];
  const errors: string[] = [];

  for (const keyword of keywords.slice(0, count)) {
    try {
      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: `Generate 5 "People Also Ask" style questions that Google would show for the keyword: "${keyword}"
These should be real questions users would search for.
Return JSON: { "questions": ["question 1", "question 2", "question 3", "question 4", "question 5"] }`,
        }],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const { questions = [] } = JSON.parse(res.choices[0].message.content ?? "{}");

      for (const question of questions as string[]) {
        if (!question || typeof question !== "string") continue;
        const slug = toSlug(question);
        if (!slug || existingSlugSet.has(slug)) continue;

        const { error } = await admin.from("growth_questions").insert({
          question: question.trim(),
          slug,
          source_keyword: keyword,
          intent: "guide",
          status: "pending",
        });

        if (!error) {
          allExtracted.push(question);
          existingSlugSet.add(slug);
        }
      }

      // 更新该关键词状态为 processing
      await admin
        .from("growth_keywords")
        .update({ status: "processing" })
        .eq("keyword", keyword);

    } catch (err) {
      const msg = (err as Error).message;
      console.error(`[extract-paa] error for "${keyword}":`, msg);
      errors.push(`${keyword}: ${msg}`);
    }
  }

  return NextResponse.json({
    extracted: allExtracted.length,
    questions: allExtracted,
    errors: errors.slice(0, 5),
  });
}
