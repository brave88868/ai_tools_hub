"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface HealthCheck {
  name: string;
  status: "ok" | "warn" | "error";
  value: string | number;
  detail?: string;
}

interface HealthData {
  overall: "ok" | "warn" | "error";
  checked_at: string;
  error_count: number;
  warn_count: number;
  checks: HealthCheck[];
}

const STATUS_CONFIG = {
  ok: { icon: "✅", bg: "bg-green-50", border: "border-green-200", text: "text-green-700", label: "OK" },
  warn: { icon: "⚠️", bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", label: "WARN" },
  error: { icon: "❌", bg: "bg-red-50", border: "border-red-200", text: "text-red-700", label: "ERROR" },
};

const GROUPS: { label: string; keys: string[] }[] = [
  {
    label: "🗄️ Database",
    keys: ["Database Connection", "Users", "Tools", "SEO Pages", "SEO Keywords", "Generated Examples", "Tool Templates", "SaaS Projects", "Blog Posts"],
  },
  {
    label: "📈 Activity (24h)",
    keys: ["SEO Pages (last 24h)", "UGC Examples (last 24h)", "Last Cron Run"],
  },
  {
    label: "🔑 Environment",
    keys: ["Anthropic API Key", "Supabase URL", "Supabase Service Key", "Stripe Secret Key", "Cron Secret", "Admin Email"],
  },
  {
    label: "🖥️ System",
    keys: ["Environment", "Server Time (UTC)", "Vercel URL"],
  },
];

export default function AdminHealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cronRunning, setCronRunning] = useState(false);
  const [cronResult, setCronResult] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/health", {
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
      });
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  async function runCron() {
    setCronRunning(true);
    setCronResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/cron/daily", {
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
      });
      const json = await res.json();
      setCronResult(`✅ Done — ${json.steps_completed ?? "?"} steps completed`);
      await fetchHealth();
    } catch (e: unknown) {
      setCronResult(`❌ Failed: ${(e as Error).message}`);
    } finally {
      setCronRunning(false);
    }
  }

  const getChecksByGroup = (group: { keys: string[] }, checks: HealthCheck[]) =>
    checks.filter((c) => group.keys.includes(c.name));

  const overallConfig = data ? STATUS_CONFIG[data.overall] : STATUS_CONFIG.ok;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-600">
              ← Admin
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
          {data && (
            <p className="text-sm text-gray-400 mt-1">
              Last checked: {new Date(data.checked_at).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {loading ? "Checking..." : "↻ Refresh"}
          </button>
          <button
            onClick={runCron}
            disabled={cronRunning}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {cronRunning ? "Running..." : "▶ Run Daily Cron"}
          </button>
        </div>
      </div>

      {/* Cron Result */}
      {cronResult && (
        <div
          className={`mb-6 p-3 rounded-lg text-sm font-mono ${
            cronResult.startsWith("✅") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}
        >
          {cronResult}
        </div>
      )}

      {loading && !data && (
        <div className="text-center py-20 text-gray-400">Running health checks...</div>
      )}

      {data && (
        <>
          {/* Overall Status Banner */}
          <div
            className={`${overallConfig.bg} ${overallConfig.border} border rounded-2xl p-5 mb-8 flex items-center justify-between`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{overallConfig.icon}</span>
              <div>
                <p className={`font-bold text-lg ${overallConfig.text}`}>
                  System{" "}
                  {data.overall === "ok"
                    ? "Healthy"
                    : data.overall === "warn"
                    ? "Warning"
                    : "Issues Detected"}
                </p>
                <p className="text-sm text-gray-500">
                  {data.error_count} errors · {data.warn_count} warnings · {data.checks.length} total checks
                </p>
              </div>
            </div>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${overallConfig.bg} ${overallConfig.text} border ${overallConfig.border}`}
            >
              {overallConfig.label}
            </span>
          </div>

          {/* Grouped Checks */}
          <div className="space-y-6">
            {GROUPS.map((group) => {
              const groupChecks = getChecksByGroup(group, data.checks);
              if (groupChecks.length === 0) return null;

              const groupErrors = groupChecks.filter((c) => c.status === "error").length;
              const groupWarns = groupChecks.filter((c) => c.status === "warn").length;

              return (
                <div key={group.label} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-700 text-sm">{group.label}</h2>
                    {(groupErrors > 0 || groupWarns > 0) && (
                      <span className="text-xs text-gray-400">
                        {groupErrors > 0 && (
                          <span className="text-red-500 mr-2">
                            {groupErrors} error{groupErrors > 1 ? "s" : ""}
                          </span>
                        )}
                        {groupWarns > 0 && (
                          <span className="text-yellow-500">
                            {groupWarns} warning{groupWarns > 1 ? "s" : ""}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="divide-y divide-gray-50">
                    {groupChecks.map((check) => {
                      const cfg = STATUS_CONFIG[check.status];
                      return (
                        <div key={check.name} className="flex items-center justify-between px-5 py-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="flex-shrink-0">{cfg.icon}</span>
                            <span className="text-sm text-gray-700 flex-shrink-0">{check.name}</span>
                            {check.detail && (
                              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full truncate max-w-xs">
                                {check.detail}
                              </span>
                            )}
                          </div>
                          <span className={`text-sm font-medium ${cfg.text} tabular-nums ml-4 flex-shrink-0`}>
                            {typeof check.value === "number" ? check.value.toLocaleString() : check.value}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
