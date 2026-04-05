import { createAdminClient } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";

interface ToolkitRow {
  slug: string;
  name: string;
  count: number;
  price: number;
  subtotal: number;
}

interface RecentSub {
  id: string;
  toolkit_slug: string;
  status: string;
  created_at: string;
}

export default async function AdminRevenuePage() {
  const admin = createAdminClient();

  // --- Active subscriptions with toolkit prices ---
  const { data: activeSubs } = await admin
    .from("subscriptions")
    .select("id, toolkit_slug, status, created_at, toolkits(name, price_monthly)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  // --- Recent 5 subscriptions (any status) ---
  const { data: recentSubs } = await admin
    .from("subscriptions")
    .select("id, toolkit_slug, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  // --- Build toolkit breakdown ---
  const toolkitMap: Record<string, { name: string; count: number; price: number }> = {};
  for (const sub of activeSubs ?? []) {
    const tk = sub.toolkits as unknown as { name: string; price_monthly: number } | null;
    const slug = sub.toolkit_slug;
    if (!toolkitMap[slug]) {
      toolkitMap[slug] = {
        name: tk?.name ?? slug,
        count: 0,
        price: Number(tk?.price_monthly ?? 0),
      };
    }
    toolkitMap[slug].count++;
  }

  const toolkitBreakdown: ToolkitRow[] = Object.entries(toolkitMap)
    .map(([slug, data]) => ({
      slug,
      name: data.name,
      count: data.count,
      price: data.price,
      subtotal: data.count * data.price,
    }))
    .sort((a, b) => b.count - a.count);

  const mrr = toolkitBreakdown.reduce((sum, t) => sum + t.subtotal, 0);
  const activeCount = (activeSubs ?? []).length;

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const thisMonthSubs = (activeSubs ?? []).filter((s) => s.created_at >= thisMonthStart);
  const thisMonthRevenue = thisMonthSubs.reduce((sum, s) => {
    const tk = s.toolkits as unknown as { price_monthly: number } | null;
    return sum + Number(tk?.price_monthly ?? 0);
  }, 0);

  const topToolkit = toolkitBreakdown[0]?.name ?? "—";

  // --- Stripe active (best-effort) ---
  let stripeActiveCount: number | null = null;
  try {
    const stripeData = await stripe.subscriptions.list({ status: "active", limit: 100 });
    stripeActiveCount = stripeData.data.length;
  } catch {
    // Not configured or test mode
  }

  const kpis = [
    { label: "MRR", value: `$${mrr.toFixed(2)}` },
    { label: "Active Subscriptions", value: activeCount },
    { label: "This Month Revenue", value: `$${thisMonthRevenue.toFixed(2)}` },
    { label: "Top Toolkit", value: topToolkit },
  ];

  const statusStyle: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    canceling: "bg-yellow-100 text-yellow-700",
    canceled: "bg-red-100 text-red-700",
    past_due: "bg-orange-100 text-orange-700",
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-900">
          Revenue{" "}
          {stripeActiveCount !== null && (
            <span className="text-gray-400 font-normal text-sm">
              · Stripe: {stripeActiveCount} active
            </span>
          )}
        </h1>
        <span className="text-xs text-gray-400">
          {now.toLocaleString("en-US", { month: "long", year: "numeric" })}
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {kpis.map(({ label, value }) => (
          <div
            key={label}
            className="bg-white border border-gray-200 rounded-xl p-4 text-center"
          >
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Toolkit Breakdown Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-8">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Subscriptions by Toolkit</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
                <th className="text-left px-5 py-3 font-medium">Toolkit</th>
                <th className="text-center px-4 py-3 font-medium">Active Subs</th>
                <th className="text-right px-4 py-3 font-medium">Price / mo</th>
                <th className="text-right px-5 py-3 font-medium">Subtotal MRR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {toolkitBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-400">
                    No active subscriptions yet.
                  </td>
                </tr>
              ) : (
                toolkitBreakdown.map((row) => (
                  <tr key={row.slug} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900 capitalize">
                      {row.name}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-700">
                      {row.count}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-500">
                      ${row.price.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-right text-sm font-semibold text-gray-900">
                      ${row.subtotal.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
              {toolkitBreakdown.length > 0 && (
                <tr className="bg-gray-50 font-semibold">
                  <td className="px-5 py-3 text-sm text-gray-900">Total</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-900">{activeCount}</td>
                  <td className="px-4 py-3" />
                  <td className="px-5 py-3 text-right text-sm text-gray-900">
                    ${mrr.toFixed(2)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Subscriptions */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Recent Subscriptions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
                <th className="text-left px-5 py-3 font-medium">ID</th>
                <th className="text-left px-4 py-3 font-medium">Toolkit</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-right px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(recentSubs ?? []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-400">
                    No subscription records.
                  </td>
                </tr>
              ) : (
                (recentSubs as RecentSub[]).map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5 text-xs text-gray-400 font-mono">
                      {sub.id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-700 capitalize">
                      {sub.toolkit_slug}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          statusStyle[sub.status] ?? "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-right text-xs text-gray-400">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
