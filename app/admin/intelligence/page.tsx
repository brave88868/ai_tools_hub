"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Stats {
  market_signals: number;
  opportunities_scored: number;
  today_mrr: number;
}

interface Signal {
  id: string;
  keyword: string;
  score: number;
  status: string;
  created_at: string;
}

interface MrrPoint {
  value: number;
  recorded_at: string;
}

interface PipelineStep {
  label: string;
  key: string;
  status: "idle" | "running" | "done" | "error";
  result?: string;
}

async function authHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    "Authorization": `Bearer ${session?.access_token ?? ""}`,
    "Content-Type": "application/json",
  };
}

const PIPELINE_STEPS: PipelineStep[] = [
  { label: "Step 1: Market Scan", key: "scan", status: "idle" },
  { label: "Step 2: Score Opportunities", key: "score", status: "idle" },
  { label: "Step 3: SEO Bulk Generate", key: "seo", status: "idle" },
  { label: "Step 6: Optimize Pages", key: "optimize", status: "idle" },
  { label: "Step 7: Record Metrics", key: "metrics", status: "idle" },
  { label: "Step 8: Sitemap Ping", key: "ping", status: "idle" },
];

export default function IntelligencePage() {
  const [stats, setStats] = useState<Stats>({ market_signals: 0, opportunities_scored: 0, today_mrr: 0 });
  const [signals, setSignals] = useState<Signal[]>([]);
  const [mrrHistory, setMrrHistory] = useState<MrrPoint[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>(PIPELINE_STEPS);
  const [pipelineRunning, setPipelineRunning] = useState(false);

  async function loadData() {
    const [
      { count: signalCount },
      { count: scoreCount },
      { data: latestMrr },
      { data: recentSignals },
      { data: mrrData },
    ] = await Promise.all([
      supabase.from("market_signals").select("*", { count: "exact", head: true }),
      supabase.from("opportunity_scores").select("*", { count: "exact", head: true }),
      supabase.from("revenue_metrics").select("value").eq("metric", "mrr").order("recorded_at", { ascending: false }).limit(1),
      supabase.from("market_signals").select("id, keyword, score, status, created_at").order("created_at", { ascending: false }).limit(20),
      supabase.from("revenue_metrics").select("value, recorded_at").eq("metric", "mrr").order("recorded_at", { ascending: false }).limit(30),
    ]);

    setStats({
      market_signals: signalCount ?? 0,
      opportunities_scored: scoreCount ?? 0,
      today_mrr: latestMrr?.[0]?.value ?? 0,
    });
    setSignals(recentSignals ?? []);
    setMrrHistory((mrrData ?? []).reverse());
  }

  useEffect(() => { loadData(); }, []);

  async function runAction(key: string, endpoint: string, method: "GET" | "POST" = "POST", body?: object) {
    setLoading(key);
    setMsg("");
    try {
      const headers = await authHeader();
      const res = await fetch(endpoint, {
        method,
        headers: method === "GET" ? { Authorization: headers.Authorization, "x-internal-cron": "1" } : headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      setMsg(res.ok ? `✓ ${JSON.stringify(data)}` : `✗ ${data.error ?? "Error"}`);
      loadData();
    } catch {
      setMsg("✗ Request failed");
    }
    setLoading(null);
  }

  async function runDailyPipeline() {
    setPipelineRunning(true);
    setMsg("");
    setPipelineSteps(PIPELINE_STEPS.map((s) => ({ ...s, status: "idle" })));

    const steps: Array<{
      key: string;
      endpoint: string;
      method: "GET" | "POST";
      body?: object;
    }> = [
      { key: "scan", endpoint: "/api/intelligence/scan-market", method: "POST" },
      { key: "score", endpoint: "/api/intelligence/score-opportunities", method: "POST", body: { count: 3 } },
      { key: "seo", endpoint: "/api/seo/generate", method: "POST", body: {} },
      { key: "optimize", endpoint: "/api/intelligence/optimize-pages", method: "POST", body: { count: 3 } },
      { key: "metrics", endpoint: "/api/intelligence/record-metrics", method: "POST" },
      { key: "ping", endpoint: "/api/seo/ping", method: "GET" },
    ];

    const headers = await authHeader();

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      setPipelineSteps((prev) =>
        prev.map((s) => s.key === step.key ? { ...s, status: "running" } : s)
      );

      try {
        const res = await fetch(step.endpoint, {
          method: step.method,
          headers: step.method === "GET"
            ? { Authorization: headers.Authorization, "x-internal-cron": "1" }
            : headers,
          body: step.body !== undefined ? JSON.stringify(step.body) : undefined,
        });
        const data = await res.json().catch(() => ({}));
        const resultStr = res.ok ? JSON.stringify(data).slice(0, 80) : `Error: ${data.error ?? res.status}`;
        setPipelineSteps((prev) =>
          prev.map((s) => s.key === step.key
            ? { ...s, status: res.ok ? "done" : "error", result: resultStr }
            : s)
        );
      } catch (err) {
        setPipelineSteps((prev) =>
          prev.map((s) => s.key === step.key
            ? { ...s, status: "error", result: (err as Error).message }
            : s)
        );
      }

      // 短暂延迟，避免并发过大
      await new Promise((r) => setTimeout(r, 500));
    }

    setMsg("✓ Daily pipeline completed");
    loadData();
    setPipelineRunning(false);
  }

  // 计算 MRR 折线图高度比例
  const maxMrr = Math.max(...mrrHistory.map((p) => p.value), 1);

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Intelligence Dashboard</h1>

      {/* A) Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Market Signals", value: stats.market_signals.toLocaleString() },
          { label: "Opportunities Scored", value: stats.opportunities_scored.toLocaleString() },
          { label: "SEO Pages (Total)", value: "—" },
          { label: "Today's MRR", value: `$${stats.today_mrr.toFixed(0)}` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {msg && (
        <p className="text-sm text-gray-600 mb-4 bg-gray-50 rounded-lg px-3 py-2 break-all">{msg}</p>
      )}

      {/* B) Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {[
          {
            label: "Scan Market",
            key: "scan",
            onClick: () => runAction("scan", "/api/intelligence/scan-market"),
            color: "bg-indigo-600 hover:bg-indigo-700",
          },
          {
            label: "Score Opportunities",
            key: "score",
            onClick: () => runAction("score", "/api/intelligence/score-opportunities", "POST", { count: 5 }),
            color: "bg-violet-600 hover:bg-violet-700",
          },
          {
            label: "Optimize Pages",
            key: "optimize",
            onClick: () => runAction("optimize", "/api/intelligence/optimize-pages", "POST", { count: 5 }),
            color: "bg-teal-600 hover:bg-teal-700",
          },
          {
            label: "Record Metrics",
            key: "metrics",
            onClick: () => runAction("metrics", "/api/intelligence/record-metrics"),
            color: "bg-emerald-600 hover:bg-emerald-700",
          },
          {
            label: "Ping Sitemap",
            key: "ping",
            onClick: () => runAction("ping", "/api/seo/ping", "GET"),
            color: "bg-gray-600 hover:bg-gray-700",
          },
        ].map(({ label, key, onClick, color }) => (
          <div key={key} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-900 mb-3">{label}</p>
            <button
              onClick={onClick}
              disabled={loading === key || pipelineRunning}
              className={`w-full text-white text-sm py-2 rounded-lg ${color} disabled:opacity-50 transition-colors`}
            >
              {loading === key ? "Running…" : "Run"}
            </button>
          </div>
        ))}

        {/* Run Full Pipeline */}
        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200 rounded-xl p-4 col-span-2 md:col-span-1">
          <p className="text-sm font-semibold text-gray-900 mb-1">🚀 Run Daily Pipeline</p>
          <p className="text-xs text-gray-400 mb-3">Runs all 6 steps sequentially</p>
          <button
            onClick={runDailyPipeline}
            disabled={pipelineRunning || loading !== null}
            className="w-full bg-black text-white text-sm py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {pipelineRunning ? "Running…" : "Run All Steps"}
          </button>
        </div>
      </div>

      {/* Pipeline Progress */}
      {(pipelineRunning || pipelineSteps.some((s) => s.status !== "idle")) && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-8">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Pipeline Progress</h2>
          <div className="space-y-2">
            {pipelineSteps.map((step) => (
              <div key={step.key} className="flex items-start gap-3">
                <span className="text-base shrink-0 mt-0.5">
                  {step.status === "idle" && "○"}
                  {step.status === "running" && "▶"}
                  {step.status === "done" && "✓"}
                  {step.status === "error" && "✗"}
                </span>
                <div className="flex-1 min-w-0">
                  <span className={`text-xs font-medium ${
                    step.status === "done" ? "text-green-700"
                    : step.status === "error" ? "text-red-600"
                    : step.status === "running" ? "text-indigo-600"
                    : "text-gray-400"
                  }`}>
                    {step.label}
                  </span>
                  {step.result && (
                    <p className="text-xs text-gray-400 truncate">{step.result}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* C) Market Signals List */}
      {signals.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-8">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">
              Market Signals <span className="text-gray-400 font-normal">({signals.length} latest)</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Keyword", "Score", "Status", "Discovered"].map((h) => (
                    <th key={h} className="text-left px-4 py-2 text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {signals.map((sig) => (
                  <tr key={sig.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-900 font-medium max-w-xs truncate">{sig.keyword}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full font-semibold ${
                        sig.score >= 75 ? "bg-green-100 text-green-700"
                        : sig.score >= 50 ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-500"
                      }`}>
                        {sig.score}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-full ${
                        sig.status === "processed" ? "bg-blue-50 text-blue-600"
                        : "bg-emerald-50 text-emerald-600"
                      }`}>
                        {sig.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-400">
                      {new Date(sig.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* D) MRR Trend — simple bar chart using div heights */}
      {mrrHistory.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            MRR Trend <span className="text-gray-400 font-normal">(last {mrrHistory.length} recordings)</span>
          </h2>
          <div className="flex items-end gap-1 h-24">
            {mrrHistory.map((point, i) => {
              const heightPct = maxMrr > 0 ? (point.value / maxMrr) * 100 : 0;
              return (
                <div
                  key={i}
                  title={`$${point.value.toFixed(0)} — ${new Date(point.recorded_at).toLocaleDateString()}`}
                  className="flex-1 bg-indigo-500 rounded-t hover:bg-indigo-600 transition-colors cursor-default"
                  style={{ height: `${Math.max(heightPct, 2)}%` }}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>{mrrHistory[0] ? new Date(mrrHistory[0].recorded_at).toLocaleDateString() : ""}</span>
            <span className="font-medium text-gray-700">
              Latest MRR: ${mrrHistory[mrrHistory.length - 1]?.value?.toFixed(0) ?? 0}
            </span>
            <span>{mrrHistory.length > 0 ? new Date(mrrHistory[mrrHistory.length - 1].recorded_at).toLocaleDateString() : ""}</span>
          </div>
        </div>
      )}
    </div>
  );
}
