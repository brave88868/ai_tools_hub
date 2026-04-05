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
  // Traffic Capture 新增统计
  paaQuestions: number;
  keywordIntents: number;
  rankingsTracked: number;
}

interface TrafficReport {
  top_pages: Array<{ page: string; views: number }>;
  top_tools: Array<{ tool_slug: string; uses: number }>;
  daily_signups: Array<{ date: string; count: number }>;
  conversion_rate: number;
  total_users: number;
  total_subscriptions: number;
}

interface RankingData {
  empty?: boolean;
  message?: string;
  top_pages: Array<{ page_url: string; keyword: string; clicks: number; impressions: number; position: number }>;
  improving: Array<{ page_url: string; keyword: string; position: number; last_position: number; improvement: number }>;
  new_rankings: Array<{ page_url: string; keyword: string; position: number }>;
  total_clicks: number;
  total_impressions: number;
  total_pages_tracked?: number;
}

interface OptimizeSuggestion {
  page_url: string;
  keyword: string;
  position: number;
  new_title: string;
  new_description: string;
  content_suggestions: string[];
  internal_links: string[];
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
    paaQuestions: 0, keywordIntents: 0, rankingsTracked: 0,
  });
  const [traffic, setTraffic] = useState<TrafficReport | null>(null);
  const [rankings, setRankings] = useState<RankingData | null>(null);
  const [optimizeSuggestions, setOptimizeSuggestions] = useState<OptimizeSuggestion[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  async function loadStats() {
    const todayStr = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { count: totalKw }, { count: pendingKw }, { count: doneKw },
      { count: totalOpps }, { count: pendingOpps }, { count: approvedOpps }, { count: createdOpps },
      { count: toolsToday }, { count: toolsWeek },
      { count: paaQ }, { count: kwIntents },
      { data: rankingUrls },
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
      supabase.from("growth_questions").select("*", { count: "exact", head: true }),
      supabase.from("keyword_intents").select("*", { count: "exact", head: true }),
      supabase.from("seo_rankings").select("page_url"),
    ]);

    const uniqueUrls = new Set((rankingUrls ?? []).map((r: { page_url: string }) => r.page_url));

    setStats({
      totalKeywords: totalKw ?? 0, pendingKeywords: pendingKw ?? 0, doneKeywords: doneKw ?? 0,
      totalOpportunities: totalOpps ?? 0, pendingOpportunities: pendingOpps ?? 0,
      approvedOpportunities: approvedOpps ?? 0, createdOpportunities: createdOpps ?? 0,
      autoToolsToday: toolsToday ?? 0, autoToolsWeek: toolsWeek ?? 0,
      paaQuestions: paaQ ?? 0, keywordIntents: kwIntents ?? 0, rankingsTracked: uniqueUrls.size,
    });
  }

  async function loadTraffic() {
    try {
      const headers = await authHeader();
      const res = await fetch("/api/growth/traffic-report", { headers });
      if (res.ok) setTraffic(await res.json());
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

  async function loadRankings() {
    setLoading("rankings");
    setMsg("");
    try {
      const headers = await authHeader();
      const res = await fetch("/api/growth/ranking-monitor", { headers });
      const data = await res.json();
      if (res.ok) {
        setRankings(data);
        setMsg(data.empty ? `ℹ ${data.message}` : `✓ Loaded ${data.total_pages_tracked ?? 0} tracked pages`);
      } else {
        setMsg(`✗ ${data.error ?? "Error"}`);
      }
    } catch {
      setMsg("✗ Request failed");
    }
    setLoading(null);
  }

  async function runOptimizeContent() {
    setLoading("optimize-content");
    setMsg("");
    setOptimizeSuggestions([]);
    try {
      const headers = await authHeader();
      const res = await fetch("/api/growth/optimize-content", {
        method: "POST",
        headers,
        body: JSON.stringify({ limit: 10 }),
      });
      const data = await res.json();
      if (res.ok) {
        setOptimizeSuggestions(data.suggestions ?? []);
        setMsg(data.suggestions?.length > 0
          ? `✓ ${data.suggestions.length} optimization suggestions (${data.analysed} pages analysed)`
          : `ℹ ${data.message ?? "No suggestions"}`
        );
      } else {
        setMsg(`✗ ${data.error ?? "Error"}`);
      }
    } catch {
      setMsg("✗ Request failed");
    }
    setLoading(null);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Growth Engine</h1>
        {msg && (
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 max-w-xl truncate">{msg}</p>
        )}
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
            <div>
              <h3 className="text-xs font-medium text-gray-500 mb-2">Daily Signups (Last 7 Days)</h3>
              <div className="flex items-end gap-1.5 h-16">
                {traffic.daily_signups.map(({ date, count }) => {
                  const maxVal = Math.max(...traffic.daily_signups.map((d) => d.count), 1);
                  const pct = Math.round((count / maxVal) * 100);
                  return (
                    <div key={date} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-gray-500">{count}</span>
                      <div className="w-full bg-indigo-200 rounded-t" style={{ height: `${Math.max(pct, 4)}%`, minHeight: "4px" }} title={`${date}: ${count} signups`} />
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

      {/* ── Section 5: Traffic Capture System ─────────────────────────────── */}
      <div className="bg-white border border-indigo-100 rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-900">5. Traffic Capture System</h2>
          <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">Auto Flywheel</span>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          关键词发现 → 扩展 → 意图检测 → 自动生成页面 → 排名监控 → 内容优化
        </p>

        {/* Traffic Capture 统计 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "PAA Questions", value: stats.paaQuestions },
            { label: "Keyword Intents", value: stats.keywordIntents },
            { label: "Rankings Tracked", value: stats.rankingsTracked },
          ].map(({ label, value }) => (
            <div key={label} className="bg-indigo-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-indigo-700">{value.toLocaleString()}</div>
              <div className="text-xs text-indigo-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* 7 个操作卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* 卡片 1: Autocomplete Discovery */}
          <div className="border border-gray-100 rounded-xl p-4">
            <div className="text-xs font-bold text-indigo-600 mb-1">① Autocomplete Discovery</div>
            <p className="text-xs text-gray-400 mb-3">从 Google 自动补全发现新关键词，以内置种子词或已完成关键词为种子</p>
            <button
              onClick={() => runAction("autocomplete", "/api/growth/google-autocomplete", "POST", { count: 5 })}
              disabled={loading === "autocomplete"}
              className="w-full bg-indigo-600 text-white text-xs py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading === "autocomplete" ? "Running…" : "Run Discovery"}
            </button>
          </div>

          {/* 卡片 2: PAA Extractor */}
          <div className="border border-gray-100 rounded-xl p-4">
            <div className="text-xs font-bold text-indigo-600 mb-1">② PAA Extractor</div>
            <p className="text-xs text-gray-400 mb-3">提取 People Also Ask 问题作为 guide 页面选题，写入 growth_questions 表</p>
            <button
              onClick={() => runAction("paa", "/api/growth/extract-paa", "POST", { count: 10 })}
              disabled={loading === "paa"}
              className="w-full bg-indigo-600 text-white text-xs py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading === "paa" ? "Running…" : "Extract PAA"}
            </button>
          </div>

          {/* 卡片 3: Keyword Expansion */}
          <div className="border border-gray-100 rounded-xl p-4">
            <div className="text-xs font-bold text-indigo-600 mb-1">③ Keyword Expansion</div>
            <p className="text-xs text-gray-400 mb-3">将一个 pending 关键词扩展为 20 个变体（修饰词 + 受众 + 意图 + 问句）</p>
            <button
              onClick={() => runAction("expand", "/api/growth/expand-keywords", "POST", { count: 20 })}
              disabled={loading === "expand"}
              className="w-full bg-indigo-600 text-white text-xs py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading === "expand" ? "Running…" : "Expand Keywords"}
            </button>
          </div>

          {/* 卡片 4: Intent Detection */}
          <div className="border border-gray-100 rounded-xl p-4">
            <div className="text-xs font-bold text-indigo-600 mb-1">④ Intent Detection</div>
            <p className="text-xs text-gray-400 mb-3">AI 自动分类关键词意图：tool / guide / example / template / problem / list</p>
            <button
              onClick={() => runAction("intent", "/api/growth/detect-intent", "POST", { limit: 50 })}
              disabled={loading === "intent"}
              className="w-full bg-indigo-600 text-white text-xs py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading === "intent" ? "Running…" : "Detect Intents"}
            </button>
          </div>

          {/* 卡片 5: Page Generator */}
          <div className="border border-gray-100 rounded-xl p-4">
            <div className="text-xs font-bold text-indigo-600 mb-1">⑤ Page Generator</div>
            <p className="text-xs text-gray-400 mb-3">根据 keyword_intents 表的意图分类，自动调用对应生成 API 创建 SEO 页面</p>
            <button
              onClick={() => runAction("gen-intents", "/api/growth/generate-from-intents", "POST", { limit: 20 })}
              disabled={loading === "gen-intents"}
              className="w-full bg-indigo-600 text-white text-xs py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading === "gen-intents" ? "Running…" : "Generate Pages"}
            </button>
          </div>

          {/* 卡片 6: Ranking Monitor */}
          <div className="border border-gray-100 rounded-xl p-4">
            <div className="text-xs font-bold text-indigo-600 mb-1">⑥ Ranking Monitor</div>
            <p className="text-xs text-gray-400 mb-3">
              查看 SEO 排名数据。暂无 GSC API，请手动导入 GSC 数据：
              <code className="text-xs bg-gray-100 px-1 rounded ml-1">POST /api/growth/import-rankings</code>
            </p>
            <button
              onClick={loadRankings}
              disabled={loading === "rankings"}
              className="w-full bg-indigo-600 text-white text-xs py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading === "rankings" ? "Loading…" : "View Rankings"}
            </button>
          </div>

          {/* 卡片 7: Content Optimizer */}
          <div className="border border-gray-100 rounded-xl p-4 md:col-span-2 lg:col-span-1">
            <div className="text-xs font-bold text-indigo-600 mb-1">⑦ Content Optimizer</div>
            <p className="text-xs text-gray-400 mb-3">AI 分析低 CTR 页面（有曝光少点击），生成标题、描述、内容优化建议</p>
            <button
              onClick={runOptimizeContent}
              disabled={loading === "optimize-content"}
              className="w-full bg-indigo-600 text-white text-xs py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading === "optimize-content" ? "Analysing…" : "Analyze & Optimize"}
            </button>
          </div>
        </div>
      </div>

      {/* Rankings Panel */}
      {rankings && !rankings.empty && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              Ranking Monitor{" "}
              <span className="text-gray-400 font-normal">({rankings.total_pages_tracked ?? 0} pages tracked)</span>
            </h2>
            <div className="flex gap-4 text-xs text-gray-500">
              <span>Clicks: <b className="text-gray-800">{rankings.total_clicks}</b></span>
              <span>Impressions: <b className="text-gray-800">{rankings.total_impressions}</b></span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {/* Top Pages */}
            <div className="p-4">
              <h3 className="text-xs font-medium text-gray-500 mb-3">Top Pages by Clicks</h3>
              <div className="space-y-2">
                {rankings.top_pages.slice(0, 10).map((p, i) => (
                  <div key={p.page_url} className="flex items-center gap-2 text-xs">
                    <span className="text-gray-300 w-4 shrink-0">{i + 1}</span>
                    <span className="text-gray-600 flex-1 truncate" title={p.page_url}>{p.page_url.replace("https://aitoolsstation.com", "")}</span>
                    <span className="font-medium text-gray-800 shrink-0">{p.clicks}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Improving */}
            <div className="p-4">
              <h3 className="text-xs font-medium text-gray-500 mb-3">Improving (vs last week)</h3>
              {rankings.improving.length > 0 ? (
                <div className="space-y-2">
                  {rankings.improving.slice(0, 10).map((p) => (
                    <div key={p.page_url} className="flex items-center gap-2 text-xs">
                      <span className="text-green-500 shrink-0">↑{p.improvement}</span>
                      <span className="text-gray-600 flex-1 truncate">{p.page_url.replace("https://aitoolsstation.com", "")}</span>
                      <span className="text-gray-400 shrink-0">#{p.position}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-gray-300">No improving pages yet</p>}
            </div>
            {/* New Rankings */}
            <div className="p-4">
              <h3 className="text-xs font-medium text-gray-500 mb-3">New Rankings (top 50)</h3>
              {rankings.new_rankings.length > 0 ? (
                <div className="space-y-2">
                  {rankings.new_rankings.slice(0, 10).map((p) => (
                    <div key={p.page_url} className="flex items-center gap-2 text-xs">
                      <span className="text-blue-400 shrink-0">new</span>
                      <span className="text-gray-600 flex-1 truncate">{p.page_url.replace("https://aitoolsstation.com", "")}</span>
                      <span className="text-gray-400 shrink-0">#{p.position}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-gray-300">No new rankings this week</p>}
            </div>
          </div>
        </div>
      )}

      {/* Optimize Suggestions Panel */}
      {optimizeSuggestions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">
              Content Optimization Suggestions{" "}
              <span className="text-gray-400 font-normal">({optimizeSuggestions.length})</span>
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {optimizeSuggestions.map((s) => (
              <div key={s.page_url} className="px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded truncate max-w-xs">
                        {s.page_url.replace("https://aitoolsstation.com", "")}
                      </code>
                      <span className="text-xs text-gray-400">pos #{s.position} · kw: {s.keyword}</span>
                    </div>
                    <div className="mb-1">
                      <span className="text-xs font-medium text-gray-500">New Title: </span>
                      <span className="text-xs text-gray-800">{s.new_title}</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-xs font-medium text-gray-500">New Desc: </span>
                      <span className="text-xs text-gray-600">{s.new_description}</span>
                    </div>
                    {s.content_suggestions.length > 0 && (
                      <ul className="list-disc list-inside space-y-0.5 mb-2">
                        {s.content_suggestions.map((cs, i) => (
                          <li key={i} className="text-xs text-indigo-600">{cs}</li>
                        ))}
                      </ul>
                    )}
                    {s.internal_links.length > 0 && (
                      <div className="text-xs text-gray-400">Links: {s.internal_links.join(" · ")}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
