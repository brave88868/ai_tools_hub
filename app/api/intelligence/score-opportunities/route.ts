import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import { createAdminClient } from "@/lib/supabase";
import { openai } from "@/lib/openai";

const CONCURRENCY = 3;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  let admin: ReturnType<typeof createAdminClient>;
  if (isCron) {
    admin = createAdminClient();
  } else {
    const auth = await requireAdmin(req);
    if (!auth) return unauthorized();
    admin = auth.admin;
  }

  const body = await req.json().catch(() => ({}));
  const count = Math.min(Number(body.count ?? 5), 10);

  // 1. 从 market_signals 取 status='new' score 最高的 N 条
  const { data: signals } = await admin
    .from("market_signals")
    .select("id, keyword")
    .eq("status", "new")
    .order("score", { ascending: false })
    .limit(count);

  if (!signals || signals.length === 0) {
    return NextResponse.json({ scored: 0, message: "No new signals to score" });
  }

  const scored: Array<Record<string, unknown>> = [];
  let topOpportunity: Record<string, unknown> | null = null;

  // 2. 并发评分（最多 CONCURRENCY 个）
  async function scoreOne(sig: { id: string; keyword: string }) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: `Score this market opportunity for an AI SaaS product:
Keyword: ${sig.keyword}

Return ONLY JSON:
{
  "demand": 0,
  "competition": 0,
  "monetization": 0,
  "score": 0,
  "summary": "one sentence why this is or isn't a good opportunity"
}
demand: 0-100 (higher = more demand)
competition: 0-100 (lower = less competition = better)
monetization: 0-100 (higher = easier to monetize)
score: overall 0-100 weighted score`,
          },
        ],
        max_tokens: 300,
      });

      const raw = completion.choices[0]?.message?.content ?? "{}";
      const result = JSON.parse(raw) as {
        demand?: number;
        competition?: number;
        monetization?: number;
        score?: number;
        summary?: string;
      };

      // 3. 写入 opportunity_scores 表
      const row = {
        keyword: sig.keyword,
        demand: Math.min(100, Math.max(0, result.demand ?? 50)),
        competition: Math.min(100, Math.max(0, result.competition ?? 50)),
        monetization: Math.min(100, Math.max(0, result.monetization ?? 50)),
        score: Math.min(100, Math.max(0, result.score ?? 50)),
        ai_summary: result.summary ?? "",
      };
      await admin.from("opportunity_scores").insert(row);

      // 4. 更新 market_signals.status = 'processed'
      await admin.from("market_signals").update({ status: "processed" }).eq("id", sig.id);

      scored.push({ ...row });
    } catch {
      // 单条失败不影响其他
    }
  }

  // Chunked concurrency
  for (let i = 0; i < signals.length; i += CONCURRENCY) {
    const chunk = signals.slice(i, i + CONCURRENCY);
    await Promise.allSettled(chunk.map(scoreOne));
  }

  if (scored.length > 0) {
    topOpportunity = scored.reduce((best, cur) =>
      (cur.score as number) > (best.score as number) ? cur : best
    );
  }

  return NextResponse.json({ scored: scored.length, top_opportunity: topOpportunity });
}
