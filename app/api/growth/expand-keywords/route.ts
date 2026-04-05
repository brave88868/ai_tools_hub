import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const count: number = Math.min(parseInt(body.count ?? "20", 10), 50);
  let keyword: string = body.keyword ?? "";

  const { admin } = auth;

  // 没传关键词，从 growth_keywords 取一条 pending 的
  if (!keyword) {
    const { data } = await admin
      .from("growth_keywords")
      .select("id, keyword")
      .eq("status", "pending")
      .limit(1)
      .single();
    keyword = data?.keyword ?? "";
  }

  if (!keyword) {
    return NextResponse.json({ expanded: 0, keywords: [], message: "No pending keywords found" });
  }

  // 取已存在关键词用于去重
  const { data: existingKws } = await admin.from("growth_keywords").select("keyword");
  const existingSet = new Set((existingKws ?? []).map((r: { keyword: string }) => r.keyword.toLowerCase()));

  let expanded = 0;
  const expandedKeywords: string[] = [];

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "user",
        content: `You are an SEO expert. Expand this keyword into ${count} related search queries.
Seed keyword: "${keyword}"

Generate variations including:
- modifier variants (free, online, ai, best, top, tool)
- audience variants (for students, for professionals, for beginners)
- intent variants (examples, template, guide, generator, maker)
- question variants (how to, what is, why)

Return JSON: { "keywords": ["variant 1", "variant 2", ...] }`,
      }],
      temperature: 0.8,
      response_format: { type: "json_object" },
    });

    const { keywords: variants = [] } = JSON.parse(res.choices[0].message.content ?? "{}");

    const filtered = (variants as string[]).filter(
      (v) => typeof v === "string" && v.trim().length > 5 && !existingSet.has(v.toLowerCase().trim())
    );

    for (const variant of filtered) {
      const { error } = await admin.from("growth_keywords").insert({
        keyword: variant.toLowerCase().trim(),
        source: "expansion",
        status: "pending",
      });
      if (!error) {
        expandedKeywords.push(variant);
        existingSet.add(variant.toLowerCase().trim());
        expanded++;
      }
    }

    // 更新原关键词状态为 done
    await admin.from("growth_keywords").update({ status: "done" }).eq("keyword", keyword);

  } catch (err) {
    console.error("[expand-keywords] error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  return NextResponse.json({ seed_keyword: keyword, expanded, keywords: expandedKeywords });
}
