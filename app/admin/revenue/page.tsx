import { createAdminClient } from "@/lib/supabase";

const SITE_URL = "https://aitoolsstation.com";

export default async function AdminRevenuePage() {
  const admin = createAdminClient();

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    { data: activeSubs },
    { data: recentLeads, count: totalLeads },
    { data: affiliateComms },
    { data: experiments },
    { data: toolUseRows },
  ] = await Promise.all([
    admin.from("subscriptions")
      .select("id, toolkit_slug, status, created_at, toolkits(name, price_monthly)")
      .eq("status", "active"),
    admin.from("leads")
      .select("email, source, tool_slug, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(10),
    admin.from("affiliate_commissions")
      .select("id, amount, status, created_at, referrer_id")
      .order("created_at", { ascending: false })
      .limit(20),
    admin.from("pricing_experiments")
      .select("variant, price_monthly, label, views, conversions, is_active")
      .order("variant"),
    admin.from("analytics_events")
      .select("tool_slug")
      .eq("event_type", "tool_use")
      .not("tool_slug", "is", null)
      .gte("created_at", thisMonthStart)
      .limit(2000),
  ]);

  // MRR & toolkit breakdown
  const toolkitMap: Record<string, { name: string; count: number; price: number }> = {};
  for (const sub of activeSubs ?? []) {
    const tk = sub.toolkits as unknown as { name: string; price_monthly: number } | null;
    const slug = sub.toolkit_slug;
    if (!toolkitMap[slug]) toolkitMap[slug] = { name: tk?.name ?? slug, count: 0, price: Number(tk?.price_monthly ?? 0) };
    toolkitMap[slug].count++;
  }
  const toolkitBreakdown = Object.entries(toolkitMap)
    .map(([slug, d]) => ({ slug, name: d.name, count: d.count, price: d.price, subtotal: d.count * d.price }))
    .sort((a, b) => b.count - a.count);
  const mrr = toolkitBreakdown.reduce((s, t) => s + t.subtotal, 0);
  const active_subscribers = (activeSubs ?? []).length;

  // Funnel data
  const [
    { count: pageViews },
    { count: toolUseCount },
    { count: signupCount },
  ] = await Promise.all([
    admin.from("analytics_events").select("*", { count: "exact", head: true }).eq("event_type", "page_view").gte("created_at", thisMonthStart),
    admin.from("analytics_events").select("*", { count: "exact", head: true }).eq("event_type", "tool_use").gte("created_at", thisMonthStart),
    admin.from("analytics_events").select("*", { count: "exact", head: true }).eq("event_type", "signup").gte("created_at", thisMonthStart),
  ]);
  const upgrades = (activeSubs ?? []).filter((s) => s.created_at >= thisMonthStart).length;

  // Top tools
  const toolCountMap: Record<string, number> = {};
  for (const row of toolUseRows ?? []) {
    const slug = (row as { tool_slug: string | null }).tool_slug;
    if (slug) toolCountMap[slug] = (toolCountMap[slug] ?? 0) + 1;
  }
  const topTools = Object.entries(toolCountMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([tool_slug, uses]) => ({ tool_slug, uses }));

  // Affiliate
  type CommRow = { id: string; amount: number; status: string; created_at: string; referrer_id: string };
  const commsTyped = (affiliateComms ?? []) as CommRow[];
  const affiliatePending = commsTyped
    .filter((c) => c.status === "pending")
    .reduce((s, c) => s + (c.amount ?? 0), 0);

  // Pricing experiments
  type ExpRow = { variant: string; price_monthly: number; label: string; views: number; conversions: number; is_active: boolean };
  const expsTyped = (experiments ?? []) as ExpRow[];
  const bestVariant = [...expsTyped].sort((a, b) => {
    const rateA = a.views > 0 ? a.conversions / a.views : 0;
    const rateB = b.views > 0 ? b.conversions / b.views : 0;
    return rateB - rateA;
  })[0]?.variant ?? null;

  // Funnel rates
  const pv = pageViews ?? 0;
  const tu = toolUseCount ?? 0;
  const sg = signupCount ?? 0;
  const funnelSteps = [
    { label: "Page Views", value: pv, rate: null },
    { label: "Tool Uses", value: tu, rate: pv > 0 ? ((tu / pv) * 100).toFixed(1) : "—" },
    { label: "Signups", value: sg, rate: tu > 0 ? ((sg / tu) * 100).toFixed(1) : "—" },
    { label: "Upgrades", value: upgrades, rate: sg > 0 ? ((upgrades / sg) * 100).toFixed(1) : "—" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-gray-900">Revenue Engine</h1>

      {/* Block 1: KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "MRR", value: `$${mrr.toLocaleString()}`, sub: "Monthly Recurring Revenue" },
          { label: "Active Subscribers", value: active_subscribers.toLocaleString(), sub: "Stripe active" },
          { label: "Leads Captured", value: (totalLeads ?? 0).toLocaleString(), sub: "Email leads" },
          { label: "Affiliate Pending", value: `$${(affiliatePending / 100).toFixed(2)}`, sub: "Unpaid commissions" },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-400 mt-1">{sub}</div>
          </div>
        ))}
      </div>

      {/* Block 2: Conversion Funnel */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">
          Conversion Funnel <span className="text-gray-400 font-normal text-xs">(this month)</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {funnelSteps.map(({ label, value, rate }) => (
            <div key={label} className="text-center">
              <div className="text-xl font-bold text-gray-900">{value.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              {rate !== null && (
                <div className="text-xs text-indigo-500 mt-1">{rate}% conversion</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Block 3: Pricing Experiments */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Pricing Experiments (A/B)</h2>
        </div>
        {expsTyped.length === 0 ? (
          <p className="px-5 py-4 text-sm text-gray-400">No active experiments. Insert rows into pricing_experiments table.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Variant", "Price", "Views", "Conversions", "Conv. Rate", "Status"].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {expsTyped.map((exp) => {
                const rate = exp.views > 0 ? ((exp.conversions / exp.views) * 100).toFixed(2) : "0.00";
                const isBest = exp.variant === bestVariant && expsTyped.length > 1;
                return (
                  <tr key={exp.variant} className={isBest ? "bg-green-50" : ""}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {exp.variant} {isBest && <span className="text-xs text-green-600 ml-1">★ Best</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{exp.label ?? `$${(exp.price_monthly / 100).toFixed(2)}/mo`}</td>
                    <td className="px-4 py-3 text-gray-600">{(exp.views ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600">{(exp.conversions ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-indigo-600 font-medium">{rate}%</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${exp.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {exp.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Block 4: Top Converting Tools */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Top Tools by Usage <span className="text-gray-400 font-normal text-xs">(this month)</span></h2>
        </div>
        <div className="divide-y divide-gray-50">
          {topTools.length === 0 ? (
            <p className="px-5 py-4 text-sm text-gray-400">No tool usage data this month.</p>
          ) : (
            topTools.map((t, i) => (
              <div key={t.tool_slug} className="px-5 py-3 flex items-center gap-3">
                <span className="text-gray-300 w-5 text-sm">{i + 1}</span>
                <a href={`${SITE_URL}/tools/${t.tool_slug}`} target="_blank" rel="noopener" className="flex-1 text-sm text-gray-700 hover:text-indigo-600 truncate">
                  {t.tool_slug}
                </a>
                <span className="text-sm font-medium text-gray-900">{t.uses} uses</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Block 5: Recent Leads */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Recent Leads</h2>
            <span className="text-xs text-gray-400">{totalLeads ?? 0} total</span>
          </div>
          <div className="divide-y divide-gray-50">
            {(recentLeads ?? []).length === 0 ? (
              <p className="px-5 py-4 text-sm text-gray-400">No leads yet. Email capture will populate this.</p>
            ) : (
              (recentLeads ?? []).map((lead: { email: string; source: string | null; tool_slug: string | null; created_at: string }) => (
                <div key={lead.email} className="px-5 py-3">
                  <div className="text-sm text-gray-800 truncate">{lead.email}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {lead.source ?? "—"} {lead.tool_slug ? `· ${lead.tool_slug}` : ""}
                    {" · "}{new Date(lead.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Block 6: Affiliate Commissions */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Affiliate Commissions</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {commsTyped.length === 0 ? (
              <p className="px-5 py-4 text-sm text-gray-400">No commissions yet. Commissions are created when referred users subscribe.</p>
            ) : (
              commsTyped.slice(0, 10).map((c) => (
                <div key={c.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 truncate">Referrer: {c.referrer_id.slice(0, 8)}…</div>
                    <div className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">${(c.amount / 100).toFixed(2)}</div>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${c.status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {c.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          {affiliatePending > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 bg-amber-50">
              <p className="text-xs text-amber-700 font-medium">
                Total Pending: ${(affiliatePending / 100).toFixed(2)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Toolkit breakdown (carried over from original) */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Toolkit Breakdown</h2>
        </div>
        {toolkitBreakdown.length === 0 ? (
          <p className="px-5 py-4 text-sm text-gray-400">No active subscriptions.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Toolkit", "Subscribers", "Price", "Subtotal MRR"].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {toolkitBreakdown.map((t) => (
                <tr key={t.slug}>
                  <td className="px-4 py-3 font-medium text-gray-900 capitalize">{t.name}</td>
                  <td className="px-4 py-3 text-gray-600">{t.count}</td>
                  <td className="px-4 py-3 text-gray-600">${t.price}/mo</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">${t.subtotal}/mo</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
