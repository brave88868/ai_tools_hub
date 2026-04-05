import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { admin } = auth;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: pageViewData },
    { data: toolUseData },
    { data: signupData },
    { count: totalUsers },
    { count: totalSubs },
  ] = await Promise.all([
    // Page views in last 7 days (with metadata for page path)
    admin
      .from("analytics_events")
      .select("metadata")
      .eq("event_type", "page_view")
      .gte("created_at", weekAgo),
    // Tool use events in last 7 days
    admin
      .from("analytics_events")
      .select("tool_slug")
      .eq("event_type", "tool_use")
      .not("tool_slug", "is", null)
      .gte("created_at", weekAgo),
    // Signups in last 7 days
    admin
      .from("analytics_events")
      .select("created_at")
      .eq("event_type", "signup")
      .gte("created_at", weekAgo),
    // Total users
    admin.from("users").select("*", { count: "exact", head: true }),
    // Active subscriptions
    admin.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
  ]);

  // Top pages
  const pageCounts: Record<string, number> = {};
  for (const event of pageViewData ?? []) {
    const page = (event.metadata as { page?: string } | null)?.page;
    if (page) pageCounts[page] = (pageCounts[page] ?? 0) + 1;
  }
  const topPages = Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([page, views]) => ({ page, views }));

  // Top tools
  const toolCounts: Record<string, number> = {};
  for (const event of toolUseData ?? []) {
    if (event.tool_slug) {
      toolCounts[event.tool_slug] = (toolCounts[event.tool_slug] ?? 0) + 1;
    }
  }
  const topTools = Object.entries(toolCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tool_slug, uses]) => ({ tool_slug, uses }));

  // Daily signups (last 7 days)
  const dailyCounts: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    dailyCounts[d.toISOString().slice(0, 10)] = 0;
  }
  for (const event of signupData ?? []) {
    const day = String(event.created_at).slice(0, 10);
    if (day in dailyCounts) dailyCounts[day]++;
  }
  const dailySignups = Object.entries(dailyCounts).map(([date, count]) => ({ date, count }));

  // Conversion rate: active subscriptions / total users
  const conversionRate =
    totalUsers && totalUsers > 0
      ? Math.round(((totalSubs ?? 0) / totalUsers) * 100 * 10) / 10
      : 0;

  return NextResponse.json({
    top_pages: topPages,
    top_tools: topTools,
    daily_signups: dailySignups,
    conversion_rate: conversionRate,
    total_users: totalUsers ?? 0,
    total_subscriptions: totalSubs ?? 0,
    week_tool_uses: toolUseData?.length ?? 0,
    week_signups: signupData?.length ?? 0,
  });
}
