import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { admin } = auth;
  const body = await req.json().catch(() => ({}));
  const count = Number(body.count) || 5;
  const opportunityId: string | undefined = body.opportunity_id;

  // Fetch opportunities to analyze
  let query = admin
    .from("startup_opportunities")
    .select("id, keyword")
    .eq("status", "new")
    .order("score", { ascending: false });

  if (opportunityId) {
    query = admin
      .from("startup_opportunities")
      .select("id, keyword")
      .eq("id", opportunityId);
  }

  const { data: opps } = await (opportunityId ? query : query.limit(count));

  if (!opps || opps.length === 0) {
    return NextResponse.json({ analyzed: 0, results: [] });
  }

  const results: Array<Record<string, unknown>> = [];

  for (const opp of opps as Array<{ id: string; keyword: string }>) {
    try {
      const prompt = `Analyze this SaaS startup opportunity:
Keyword: ${opp.keyword}

Return ONLY JSON:
{
  "market_demand": "low|medium|high",
  "competition": "low|medium|high",
  "monetization": "low|medium|high",
  "score": 0,
  "summary": "2-sentence analysis of why this is or isn't a good opportunity",
  "recommended_product_name": "suggested product name",
  "target_users": "who would use this"
}
The score field should be 0-100.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const parsed = JSON.parse(completion.choices[0].message.content ?? "{}");

      await admin.from("startup_analysis").insert({
        opportunity_id: opp.id,
        keyword: opp.keyword,
        market_demand: parsed.market_demand ?? "medium",
        competition: parsed.competition ?? "medium",
        monetization: parsed.monetization ?? "medium",
        score: Math.min(100, Math.max(0, Number(parsed.score) || 50)),
        ai_summary: parsed.summary ?? "",
      });

      await admin
        .from("startup_opportunities")
        .update({ status: "analyzed" })
        .eq("id", opp.id);

      results.push({ id: opp.id, keyword: opp.keyword, ...parsed });
    } catch {
      // skip failed analysis
    }
  }

  return NextResponse.json({ analyzed: results.length, results });
}
