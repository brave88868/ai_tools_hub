"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface GrowthStats {
  totalKeywords: number;
  pendingKeywords: number;
  doneKeywords: number;
  totalOpportunities: number;
  pendingOpportunities: number;
  approvedOpportunities: number;
  createdOpportunities: number;
  autoToolsToday: number;
  autoToolsWeek: number;
}

interface TrafficReport {
  top_pages: Array<{ page: string; views: number }>;
  top_tools: Array<{ tool_slug: string; uses: number }>;
  daily_signups: Array<{ date: string; count: number }>;
  conversion_rate: number;
  total_users: number;
  total_subscriptions: number;
}

async function authHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    "Authorization": `Bearer ${session?.access_token ?? ""}`,
    "Content-Type": "application/json",
  };
}

export default function AdminGrowthPage() {
  const [stats, setStats] = useState<GrowthStats>({
    totalKeywords: 0, pendingKeywords: 0, doneKeywords: 0,
    totalOpportunities: 0, pendingOpportunities: 0, approvedOpportunities: 0, createdOpportunities: 0,
    autoToolsToday: 0, autoToolsWeek: 0,
  });
  const [traffic, setTraffic] = useState<TrafficReport | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  async function loadStats() {
    const todayStr = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { count: totalKw }, { count: pendingKw }, { count: doneKw },
      { count: totalOpps }, { count: pendingOpps }, { count: approvedOpps }, { count: createdOpps },
      { count: toolsToday }, { count: toolsWeek },
    ] = await Promise.all([
      supabase.from("growth_keywords").select("*", { count: "exact", head: true }),
      supabase.from("growth_keywords").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("growth_keywords").select("*", { count: "exact", head: true }).eq("status", "done"),
      supabase.from("tool_opportunities").select("*", { count: "exact", head: true }),
      supabase.from("tool_opportunities").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("tool_opportunities").select("*", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("tool_opportunities").select("*", { count: "exact", head: true }).eq("status", "created"),
      supabase.from("tools").select("*", { count: "exact", head: true }).eq("auto_generated", true).gte("created_at", `${todayStr}T00:00:00.000Z`),
      supabase.from("tools").select("*", { count: "exact", head: true }).eq("auto_generated", true).gte("created_at", weekAgo),
    ]);

    setStats({
      totalKeywords: totalKw ?? 0, pendingKeywords: pendingKw ?? 0, doneKeywords: doneKw ?? 0,
      totalOpportunities: totalOpps ?? 0, pendingOpportunities: pendingOpps ?? 0,
      approvedOpportunities: approvedOpps ?? 0, createdOpportunities: createdOpps ?? 0,
      autoToolsToday: toolsToday ?? 0, autoToolsWeek: toolsWeek ?? 0,
    });
  }

  async function loadTraffic() {
    try {
      const headers = await authHeader();
      const res = await fetch("/api/growth/traffic-report", { headers });
      if (res.ok) {
        const data = await res.json();
        setTraffic(data);
      }
    } catch { /* silent */ }
  }

  useEffect(() => {
    loadStats();
    loadTraffic();
  }, []);

  async function runAction(key: string, endpoint: string, method: "POST" | "GET", body?: object) {
    setLoading(key);
    setMsg("");
    try {
      const headers = await authHeader();
      const res = await fetch(endpoint, {
        method,
        headers,
        body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
      });
      const data = await res.json();
      setMsg(res.ok ? `✓ ${JSON.stringify(data)}` : `✗ ${data.error ?? "Error"}`);
      loadStats();
      if (key === "traffic") loadTraffic();
    } catch {
      setMsg("✗ Request failed");
    }
    setLoading(null);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Growth Engine</h1>
        {msg && <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 max-w-lg truncate">{msg}</p>}
      </div>

      {/* Section 1: Keywords */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">1. Keyword Discovery</h2>
          <button
            onClick={() => runAction("keywords", "/api/growth/discover-keywords", "POST", { count: 50 })}
            disabled={loading === "keywords"}
            className="bg-black text-white text-xs px-4 py-1.5 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {loading === "keywords" ? "Running…" : "Run Discovery"}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total", value: stats.totalKeywords },
            { label: "Pending", value: stats.pendingKeywords },
            { label: "Done", value: stats.doneKeywords },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-gray-900">{value.toLocaleString()}</div>
              <div className="text-xs text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Tool Opportunities */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">2. Tool Opportunities</h2>
          <button
            onClick={() => runAction("opportunities", "/api/growth/find-opportunities", "POST", { limit: 30 })}
            disabled={loading === "opportunities"}
            className="bg-black text-white text-xs px-4 py-1.5 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {loading === "opportunities" ? "Running…" : "Find Opportunities"}
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total", value: stats.totalOpportunities },
            { label: "Pending", value: stats.pendingOpportunities },
            { label: "Approved", value: stats.approvedOpportunities },
            { label: "Created", value: stats.createdOpportunities },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-gray-900">{value.toLocaleString()}</div>
              <div className="text-xs text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Auto Tool Generator */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">3. Auto Tool Generator</h2>
          <div className="flex gap-2">
            <button
              onClick={() => runAction("auto-tools", "/api/growth/auto-create-tool", "POST", { limit: 5 })}
              disabled={loading === "auto-tools"}
              className="border border-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-lg hover:border-gray-400 disabled:opacity-50 transition-colors"
            >
              {loading === "auto-tools" ? "Running…" : "Run (Approved only)"}
            </button>
            <button
              onClick={() => runAction("auto-tools-80", "/api/growth/auto-create-tool", "POST", { limit: 5, auto_approve_score: 80 })}
              disabled={loading === "auto-tools-80"}
              className="bg-black text-white text-xs px-3 py-1.5 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {loading === "auto-tools-80" ? "Running…" : "Run (Score ≥ 80)"}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Auto-Generated Today", value: stats.autoToolsToday },
            { label: "Auto-Generated This Week", value: stats.autoToolsWeek },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-gray-900">{value.toLocaleString()}</div>
              <div className="text-xs text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-3">
          Auto-generated tools are created with <code>is_active=false</code>. Review in Tools Management before activating.
        </p>
      </div>

      {/* Section 4: Growth Report */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">4. Growth Report</h2>
          <button
            onClick={() => runAction("traffic", "/api/growth/traffic-report", "GET")}
            disabled={loading === "traffic"}
            className="border border-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-lg hover:border-gray-400 disabled:opacity-50 transition-colors"
          >
            {loading === "traffic" ? "Loading…" : "Refresh"}
          </button>
        </div>

        {traffic ? (
          <div className="space-y-4">
            {/* KPIs */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total Users", value: traffic.total_users.toLocaleString() },
                { label: "Active Subs", value: traffic.total_subscriptions.toLocaleString() },
                { label: "Paid Conversion", value: `${traffic.conversion_rate}%` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-indigo-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-indigo-700">{value}</div>
                  <div className="text-xs text-indigo-400 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top pages */}
              <div>
                <h3 className="text-xs font-medium text-gray-500 mb-2">Top Pages (7 days)</h3>
                <div className="space-y-1">
                  {traffic.top_pages.slice(0, 8).map(({ page, views }, i) => (
                    <div key={page} className="flex items-center gap-2 text-xs">
                      <span className="text-gray-300 w-4">{i + 1}</span>
                      <span className="text-gray-600 flex-1 truncate">{page}</span>
                      <span className="font-medium text-gray-800">{views}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top tools */}
              <div>
                <h3 className="text-xs font-medium text-gray-500 mb-2">Top Tools (7 days)</h3>
                <div className="space-y-1">
                  {traffic.top_tools.slice(0, 8).map(({ tool_slug, uses }, i) => (
                    <div key={tool_slug} className="flex items-center gap-2 text-xs">
                      <span className="text-gray-300 w-4">{i + 1}</span>
                      <span className="text-gray-600 flex-1 truncate">{tool_slug}</span>
                      <span className="font-medium text-gray-800">{uses}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Daily signups */}
            <div>
              <h3 className="text-xs font-medium text-gray-500 mb-2">Daily Signups (Last 7 Days)</h3>
              <div className="flex items-end gap-1.5 h-16">
                {traffic.daily_signups.map(({ date, count }) => {
                  const maxVal = Math.max(...traffic.daily_signups.map((d) => d.count), 1);
                  const pct = Math.round((count / maxVal) * 100);
                  return (
                    <div key={date} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-gray-500">{count}</span>
                      <div
                        className="w-full bg-indigo-200 rounded-t"
                        style={{ height: `${Math.max(pct, 4)}%`, minHeight: "4px" }}
                        title={`${date}: ${count} signups`}
                      />
                      <span className="text-xs text-gray-300">{date.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Click Refresh to load traffic report.</p>
        )}
      </div>
    </div>
  );
}
