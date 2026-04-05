import { createAdminClient } from "@/lib/supabase";

export default async function AdminAnalyticsPage() {
  const admin = createAdminClient();
  const todayStr = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

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
  ]);

  // Top 10 工具
  const toolCounts: Record<string, number> = {};
  for (const row of toolUsageData ?? []) {
    if (row.tool_slug) toolCounts[row.tool_slug] = (toolCounts[row.tool_slug] ?? 0) + 1;
  }
  const topTools = Object.entries(toolCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Analytics</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Users", value: totalUsers ?? 0 },
          { label: "Today's New Users", value: todaySignups ?? 0 },
          { label: "This Week New Users", value: weekSignups ?? 0 },
          { label: "Active Subscriptions", value: totalSubs ?? 0 },
          { label: "Today Tool Uses", value: todayToolUses ?? 0 },
          { label: "This Week Tool Uses", value: weekToolUses ?? 0 },
          { label: "Today Page Views", value: todayPageViews ?? 0 },
          { label: "Total Feedback", value: totalFeedback ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Top tools */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Top 10 Tools by Usage</h2>
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
