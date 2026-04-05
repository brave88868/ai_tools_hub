import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { admin } = auth;

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    { data: activeSubs },
    { data: recentLeads },
    { data: affiliateComms },
    { data: experiments },
    { data: funnelPageViews },
    { data: funnelToolUses },
    { data: funnelSignups },
    { data: topToolRows },
  ] = await Promise.all([
    admin.from("subscriptions")
      .select("id, toolkit_slug, status, created_at, toolkits(name, price_monthly)")
      .eq("status", "active"),
    admin.from("leads")
      .select("email, source, tool_slug, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    admin.from("affiliate_commissions")
      .select("id, referrer_id, amount, status, created_at, users!referrer_id(email)")
      .order("created_at", { ascending: false })
      .limit(50),
    admin.from("pricing_experiments")
      .select("variant, price_monthly, label, views, conversions, is_active")
      .order("variant"),
    admin.from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "page_view")
      .gte("created_at", thisMonthStart),
    admin.from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "tool_use")
      .gte("created_at", thisMonthStart),
    admin.from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "signup")
      .gte("created_at", thisMonthStart),
    admin.from("analytics_events")
      .select("tool_slug")
      .eq("event_type", "tool_use")
      .not("tool_slug", "is", null)
      .gte("created_at", thisMonthStart)
      .limit(1000),
  ]);

  // MRR
  const toolkitMap: Record<string, { name: string; count: number; price: number }> = {};
  for (const sub of activeSubs ?? []) {
    const tk = sub.toolkits as unknown as { name: string; price_monthly: number } | null;
    const slug = sub.toolkit_slug;
    if (!toolkitMap[slug]) toolkitMap[slug] = { name: tk?.name ?? slug, count: 0, price: Number(tk?.price_monthly ?? 0) };
    toolkitMap[slug].count++;
  }
  const mrr = Object.values(toolkitMap).reduce((s, t) => s + t.count * t.price, 0);
  const active_subscribers = (activeSubs ?? []).length;

  // Lead + affiliate totals
  const { count: total_leads } = await admin.from("leads").select("*", { count: "exact", head: true });
  const affiliatePending = (affiliateComms ?? [])
    .filter((c: { status: string }) => c.status === "pending")
    .reduce((s: number, c: { amount: number }) => s + (c.amount ?? 0), 0);

  // Funnel
  const upgrades_this_month = (activeSubs ?? [])
    .filter((s) => s.created_at >= thisMonthStart).length;

  // Top tools
  const toolCountMap: Record<string, number> = {};
  for (const row of topToolRows ?? []) {
    const slug = (row as { tool_slug: string | null }).tool_slug;
    if (slug) toolCountMap[slug] = (toolCountMap[slug] ?? 0) + 1;
  }
  const top_tools = Object.entries(toolCountMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([tool_slug, uses]) => ({ tool_slug, uses }));

  // Pricing experiments with conversion rate
  const pricing_experiments = (experiments ?? []).map((e: {
    variant: string; price_monthly: number; label: string;
    views: number; conversions: number; is_active: boolean;
  }) => ({
    ...e,
    conversion_rate: e.views > 0 ? ((e.conversions / e.views) * 100).toFixed(2) : "0.00",
  }));

  return NextResponse.json({
    mrr,
    active_subscribers,
    total_leads: total_leads ?? 0,
    affiliate_pending: affiliatePending,
    funnel: {
      page_views: (funnelPageViews as unknown as { count: number } | null)?.count ?? 0,
      tool_uses: (funnelToolUses as unknown as { count: number } | null)?.count ?? 0,
      signups: (funnelSignups as unknown as { count: number } | null)?.count ?? 0,
      upgrades: upgrades_this_month,
    },
    pricing_experiments,
    top_tools,
    recent_leads: recentLeads ?? [],
    affiliate_commissions: (affiliateComms ?? []).slice(0, 20),
  });
}
