import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";

interface RankingRow {
  keyword: string;
  page_url: string;
  position?: number;
  clicks?: number;
  impressions?: number;
  ctr?: number;
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const rankings: RankingRow[] = body.rankings ?? [];

  if (!Array.isArray(rankings) || rankings.length === 0) {
    return NextResponse.json({ error: "rankings array is required" }, { status: 400 });
  }

  const { admin } = auth;
  let imported = 0;
  const errors: string[] = [];

  for (const row of rankings) {
    if (!row.keyword || !row.page_url) {
      errors.push(`Missing keyword or page_url: ${JSON.stringify(row)}`);
      continue;
    }

    const { error } = await admin.from("seo_rankings").insert({
      keyword: row.keyword,
      page_url: row.page_url,
      position: row.position ?? null,
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
      ctr: row.ctr ?? null,
      recorded_at: new Date().toISOString(),
    });

    if (!error) imported++;
    else errors.push(error.message);
  }

  return NextResponse.json({ imported, errors: errors.slice(0, 10) });
}
