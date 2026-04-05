import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import { openai } from "@/lib/openai";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();
  const { admin } = auth;

  // 1. 从 growth_keywords 取最近 done 状态的关键词作为信号源
  const { data: sourceKws } = await admin
    .from("growth_keywords")
    .select("keyword")
    .eq("status", "done")
    .order("created_at", { ascending: false })
    .limit(30);

  const keywords = (sourceKws ?? []).map((r: { keyword: string }) => r.keyword).join(", ");
  const seedKeywords = keywords || "AI productivity, automation tools, SaaS workflow";

  // 2. GPT-4o-mini 发现市场信号
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: `You are a market intelligence analyst.
Based on these keywords: ${seedKeywords}
Discover 20 high-potential market signals for AI SaaS products in 2026.
Return ONLY JSON:
{"signals": [{
  "keyword": "specific signal keyword",
  "source": "ai_discovery",
  "score": 0
}]}
Focus on: emerging needs, underserved niches, clear monetization potential.
Each score 0-100 based on potential.`,
      },
    ],
    max_tokens: 1000,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let signals: Array<{ keyword: string; source: string; score: number }> = [];
  try {
    const parsed = JSON.parse(raw);
    signals = parsed.signals ?? parsed.data ?? [];
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }

  // 3. 过滤已存在的 keyword
  const { data: existing } = await admin
    .from("market_signals")
    .select("keyword");
  const existingSet = new Set((existing ?? []).map((r: { keyword: string }) => r.keyword.toLowerCase()));

  const toInsert = signals.filter(
    (s) => s.keyword && !existingSet.has(s.keyword.toLowerCase())
  );

  // 4. 写入 market_signals 表
  let discovered = 0;
  for (const sig of toInsert) {
    const { error } = await admin.from("market_signals").insert({
      keyword: sig.keyword,
      source: sig.source ?? "ai_discovery",
      score: Math.min(100, Math.max(0, sig.score ?? 50)),
      status: "new",
    });
    if (!error) discovered++;
  }

  return NextResponse.json({ discovered, total_signals: signals.length });
}
