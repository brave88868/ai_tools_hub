import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SEED_KEYWORDS = [
  "AI meeting summary",
  "AI contract analyzer",
  "AI cold email generator",
  "AI resume builder",
  "AI social media scheduler",
  "AI invoice generator",
  "AI customer support bot",
  "AI onboarding tool",
  "AI pitch deck generator",
  "AI job description writer",
];

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { admin } = auth;
  const body = await req.json().catch(() => ({}));
  const count = Number(body.count) || 10;

  // Get seed keywords from growth_keywords table
  const { data: growthKws } = await admin
    .from("growth_keywords")
    .select("keyword")
    .eq("status", "done")
    .order("created_at", { ascending: false })
    .limit(20);

  const seeds =
    growthKws && growthKws.length >= 5
      ? growthKws.map((k: { keyword: string }) => k.keyword).slice(0, 20)
      : SEED_KEYWORDS;

  const prompt = `You are a startup opportunity analyst.
Based on these seed keywords: ${seeds.join(", ")}

Discover ${count} SaaS startup opportunities.
For each opportunity, return ONLY a JSON array:
[{
  "keyword": "specific opportunity keyword",
  "source": "ai_discovery",
  "score": 0,
  "reason": "one sentence why this is a good opportunity"
}]
The score field should be 0-100 representing market potential.
Focus on: high search volume, low competition, clear monetization.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  let opportunities: Array<{ keyword: string; source: string; score: number; reason: string }> = [];
  try {
    const parsed = JSON.parse(completion.choices[0].message.content ?? "{}");
    // GPT may return { opportunities: [...] } or just [...]
    opportunities = Array.isArray(parsed) ? parsed : (parsed.opportunities ?? parsed.items ?? []);
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }

  // Filter out already-existing keywords
  const keywords = opportunities.map((o) => o.keyword?.trim()).filter(Boolean);
  const { data: existing } = await admin
    .from("startup_opportunities")
    .select("keyword")
    .in("keyword", keywords);
  const existingSet = new Set((existing ?? []).map((e: { keyword: string }) => e.keyword));

  const toInsert = opportunities
    .filter((o) => o.keyword?.trim() && !existingSet.has(o.keyword.trim()))
    .map((o) => ({
      keyword: o.keyword.trim(),
      source: o.source ?? "ai_discovery",
      score: Math.min(100, Math.max(0, Number(o.score) || 50)),
      status: "new",
    }));

  let discovered = 0;
  if (toInsert.length > 0) {
    const { error } = await admin.from("startup_opportunities").insert(toInsert);
    if (!error) discovered = toInsert.length;
  }

  return NextResponse.json({ discovered, opportunities: toInsert });
}
