import { createAdminClient } from "@/lib/supabase";

export default async function AdminAnalyticsPage() {
  const admin = createAdminClient();
  const todayStr = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: todaySignups },
    { count: weekSignups },
    { data: toolUsageData },
    { count: totalSubs },
    { count: todayPageViews },
    { count: totalFeedback },
    { count: totalUsers },
    { count: todayToolUses },
    { count: weekToolUses },
    { data: pageViewData },
    { data: signupData },
  ] = await Promise.all([
    admin.from("analytics_events").select("*", { count: "exact", head: true }).eq("event_type", "signup").gte("created_at", `${todayStr}T00:00:00.000Z`),
    admin.from("analytics_events").select("*", { count: "exact", head: true }).eq("event_type", "signup").gte("created_at", weekAgo),
    admin.from("analytics_events").select("tool_slug").eq("event_type", "tool_use").not("tool_slug", "is", null),
    admin.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
    admin.from("analytics_events").select("*", { count: "exact", head: true }).eq("event_type", "page_view").gte("created_at", `${todayStr}T00:00:00.000Z`),
    admin.from("feedback").select("*", { count: "exact", head: true }),
    admin.from("users").select("*", { count: "exact", head: true }),
    admin.from("analytics_events").select("*", { count: "exact", head: true }).eq("event_type", "tool_use").gte("created_at", `${todayStr}T00:00:00.000Z`),
    admin.from("analytics_events").select("*", { count: "exact", head: true }).eq("event_type", "tool_use").gte("created_at", weekAgo),
    // Page view paths this week
    admin.from("analytics_events").select("metadata").eq("event_type", "page_view").gte("created_at", weekAgo),
    // Daily signups last 7 days
    admin.from("analytics_events").select("created_at").eq("event_type", "signup").gte("created_at", weekAgo),
  ]);

  // Top 10 tools
  const toolCounts: Record<string, number> = {};
  for (const row of toolUsageData ?? []) {
    if (row.tool_slug) toolCounts[row.tool_slug] = (toolCounts[row.tool_slug] ?? 0) + 1;
  }
  const topTools = Object.entries(toolCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Top 10 pages
  const pageCounts: Record<string, number> = {};
  for (const ev of pageViewData ?? []) {
    const page = (ev.metadata as { page?: string } | null)?.page;
    if (page) pageCounts[page] = (pageCounts[page] ?? 0) + 1;
  }
  const topPages = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Daily signups last 7 days
  const dailyCounts: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    dailyCounts[d.toISOString().slice(0, 10)] = 0;
  }
  for (const ev of signupData ?? []) {
    const day = String(ev.created_at).slice(0, 10);
    if (day in dailyCounts) dailyCounts[day]++;
  }
  const dailySignups = Object.entries(dailyCounts);

  // Conversion rate: active subscriptions / total users
  const conversionRate =
    totalUsers && totalUsers > 0
      ? ((totalSubs ?? 0) / totalUsers * 100).toFixed(1)
      : "0.0";

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Analytics</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Users", value: totalUsers ?? 0 },
          { label: "Active Subscriptions", value: totalSubs ?? 0 },
          { label: "Paid Conversion", value: `${conversionRate}%` },
          { label: "Today's New Users", value: todaySignups ?? 0 },
          { label: "This Week Signups", value: weekSignups ?? 0 },
          { label: "Today Tool Uses", value: todayToolUses ?? 0 },
          { label: "This Week Tool Uses", value: weekToolUses ?? 0 },
          { label: "Today Page Views", value: todayPageViews ?? 0 },
          { label: "Total Feedback", value: totalFeedback ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-2xl font-bold text-gray-900">{typeof value === "number" ? value.toLocaleString() : value}</div>
            <div className="text-xs text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Daily signups */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Daily Signups (Last 7 Days)</h2>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              {dailySignups.map(([date, count]) => {
                const maxCount = Math.max(...dailySignups.map(([, c]) => c), 1);
                const pct = Math.round((count / maxCount) * 100);
                return (
                  <tr key={date}>
                    <td className="px-4 py-2 text-xs text-gray-500 w-28">{date}</td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div className="bg-indigo-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-medium text-gray-700 w-4 text-right">{count}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Top pages */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Top Pages (This Week)</h2>
          </div>
          {topPages.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-400">No page view data yet.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-50">
                {topPages.map(([page, count], i) => (
                  <tr key={page}>
                    <td className="px-4 py-2 text-gray-400 text-xs w-6">{i + 1}</td>
                    <td className="px-2 py-2 text-xs text-gray-600 truncate max-w-[160px]">{page}</td>
                    <td className="px-4 py-2 text-right text-xs font-semibold text-gray-900">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Top tools */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Top 10 Tools by Usage (All Time)</h2>
        </div>
        {topTools.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400">No usage data yet.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              {topTools.map(([slug, count], i) => (
                <tr key={slug}>
                  <td className="px-4 py-2.5 text-gray-400 text-xs w-8">{i + 1}</td>
                  <td className="px-2 py-2.5 text-gray-700">{slug}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{count.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
