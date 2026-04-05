import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { admin } = auth;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: todaySignups },
    { count: weekSignups },
    { data: topToolsData },
    { count: totalSubscriptions },
    { count: todayPageViews },
    { count: totalUsers },
    { count: todayToolUses },
    { count: weekToolUses },
  ] = await Promise.all([
    // 今日新用户
    admin
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "signup")
      .gte("created_at", `${todayStr}T00:00:00.000Z`),

    // 本周新用户
    admin
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "signup")
      .gte("created_at", weekAgo),

    // Top 10 工具（按使用次数）
    admin
      .from("analytics_events")
      .select("tool_slug")
      .eq("event_type", "tool_use")
      .not("tool_slug", "is", null),

    // 总活跃订阅数
    admin
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),

    // 今日 page_views
    admin
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "page_view")
      .gte("created_at", `${todayStr}T00:00:00.000Z`),

    // 总用户数
    admin
      .from("users")
      .select("*", { count: "exact", head: true }),

    // 今日工具使用次数
    admin
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "tool_use")
      .gte("created_at", `${todayStr}T00:00:00.000Z`),

    // 本周工具使用次数
    admin
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "tool_use")
      .gte("created_at", weekAgo),
  ]);

  // 统计 Top 10 工具
  const toolCounts: Record<string, number> = {};
  for (const row of topToolsData ?? []) {
    if (row.tool_slug) {
      toolCounts[row.tool_slug] = (toolCounts[row.tool_slug] ?? 0) + 1;
    }
  }
  const topTools = Object.entries(toolCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tool_slug, count]) => ({ tool_slug, count }));

  return NextResponse.json({
    today_signups: todaySignups ?? 0,
    week_signups: weekSignups ?? 0,
    top_tools: topTools,
    total_subscriptions: totalSubscriptions ?? 0,
    today_page_views: todayPageViews ?? 0,
    total_users: totalUsers ?? 0,
    today_tool_uses: todayToolUses ?? 0,
    week_tool_uses: weekToolUses ?? 0,
  });
}
