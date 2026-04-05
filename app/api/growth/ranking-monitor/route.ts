import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { admin } = auth;

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  // 本周排名数据
  const { data: thisWeekRankings } = await admin
    .from("seo_rankings")
    .select("keyword, page_url, position, clicks, impressions, ctr, recorded_at")
    .gte("recorded_at", weekAgo)
    .order("clicks", { ascending: false });

  // 上周排名数据（用于对比）
  const { data: lastWeekRankings } = await admin
    .from("seo_rankings")
    .select("keyword, page_url, position, clicks, recorded_at")
    .gte("recorded_at", twoWeeksAgo)
    .lt("recorded_at", weekAgo);

  if (!thisWeekRankings || thisWeekRankings.length === 0) {
    return NextResponse.json({
      empty: true,
      message: "No ranking data yet. Import GSC data via POST /api/growth/import-rankings.",
      top_pages: [],
      improving: [],
      new_rankings: [],
      total_clicks: 0,
      total_impressions: 0,
    });
  }

  // 聚合：按 page_url 汇总
  const pageMap = new Map<string, { page_url: string; keyword: string; clicks: number; impressions: number; position: number }>();
  for (const row of thisWeekRankings) {
    const key = row.page_url;
    if (!pageMap.has(key)) {
      pageMap.set(key, {
        page_url: row.page_url,
        keyword: row.keyword,
        clicks: 0,
        impressions: 0,
        position: row.position ?? 999,
      });
    }
    const entry = pageMap.get(key)!;
    entry.clicks += row.clicks ?? 0;
    entry.impressions += row.impressions ?? 0;
    // 保留最佳 position
    if ((row.position ?? 999) < entry.position) {
      entry.position = row.position ?? 999;
    }
  }

  // top_pages：clicks 降序前 20
  const top_pages = [...pageMap.values()]
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 20);

  // total 统计
  const total_clicks = top_pages.reduce((sum, p) => sum + p.clicks, 0);
  const total_impressions = [...pageMap.values()].reduce((sum, p) => sum + p.impressions, 0);

  // improving：对比上周，position 提升的页面
  const lastWeekMap = new Map<string, number>();
  for (const row of lastWeekRankings ?? []) {
    const existing = lastWeekMap.get(row.page_url);
    if (existing === undefined || (row.position ?? 999) < existing) {
      lastWeekMap.set(row.page_url, row.position ?? 999);
    }
  }

  const improving = [...pageMap.values()]
    .filter((p) => {
      const lastPos = lastWeekMap.get(p.page_url);
      return lastPos !== undefined && p.position < lastPos;
    })
    .map((p) => ({
      ...p,
      last_position: lastWeekMap.get(p.page_url)!,
      improvement: lastWeekMap.get(p.page_url)! - p.position,
    }))
    .sort((a, b) => b.improvement - a.improvement)
    .slice(0, 10);

  // new_rankings：本周新进入排名（position <= 50），上周没有
  const new_rankings = [...pageMap.values()]
    .filter((p) => p.position <= 50 && !lastWeekMap.has(p.page_url))
    .sort((a, b) => a.position - b.position)
    .slice(0, 10);

  return NextResponse.json({
    top_pages,
    improving,
    new_rankings,
    total_clicks,
    total_impressions,
    total_pages_tracked: pageMap.size,
  });
}
