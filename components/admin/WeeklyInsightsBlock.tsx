"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface WeeklyInsight {
  id: string;
  week_start: string;
  week_end: string;
  report: string;
  stats: {
    page_views?: number;
    tool_uses?: number;
    signups?: number;
    new_subs?: number;
    new_leads?: number;
    top_tools?: string;
  } | null;
  created_at: string;
}

interface Props {
  initialInsights: WeeklyInsight[];
}

export default function WeeklyInsightsBlock({ initialInsights }: Props) {
  const [insights, setInsights] = useState<WeeklyInsight[]>(initialInsights);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleGenerate() {
    setLoading(true);
    setMsg("");

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? "";

    try {
      const res = await fetch("/api/admin/generate-insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ force: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(`✗ ${data.error ?? "请求失败"}`);
        return;
      }

      if ("skipped" in data && data.skipped) {
        setMsg("ℹ️ 本周报告已存在（已跳过生成）");
        return;
      }

      const newInsight: WeeklyInsight = {
        id: Date.now().toString(),
        week_start: data.week_start,
        week_end: data.week_end,
        report: data.report,
        stats: data.stats ?? null,
        created_at: new Date().toISOString(),
      };

      setInsights((prev) => [newInsight, ...prev].slice(0, 5));
      setMsg(
        `✓ 报告已生成${data.email_sent ? "，邮件已发送至 " + process.env.NEXT_PUBLIC_ADMIN_EMAIL_HINT : ""}`
      );
    } catch {
      setMsg("✗ 网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">Weekly AI Insights</h2>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-black text-white text-xs px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Analysing data…" : "Generate This Week's Report"}
        </button>
      </div>

      {/* Status message */}
      {msg && (
        <p className="text-sm text-gray-600 mb-4 bg-gray-50 rounded-lg px-3 py-2">{msg}</p>
      )}

      {/* Reports list */}
      {insights.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-sm text-gray-400">暂无周报。点击上方按钮生成本周第一份报告。</p>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((insight) => (
            <div key={insight.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {/* Report header */}
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">
                    {insight.week_start} ~ {insight.week_end}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(insight.created_at).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}
                  </span>
                </div>
                {/* Mini stats */}
                {insight.stats && (
                  <div className="hidden md:flex items-center gap-4 text-xs text-gray-500">
                    {insight.stats.page_views !== undefined && (
                      <span>浏览 <strong className="text-gray-800">{insight.stats.page_views}</strong></span>
                    )}
                    {insight.stats.tool_uses !== undefined && (
                      <span>工具 <strong className="text-gray-800">{insight.stats.tool_uses}</strong></span>
                    )}
                    {insight.stats.signups !== undefined && (
                      <span>注册 <strong className="text-gray-800">{insight.stats.signups}</strong></span>
                    )}
                    {insight.stats.new_subs !== undefined && (
                      <span>订阅 <strong className="text-gray-800">{insight.stats.new_subs}</strong></span>
                    )}
                  </div>
                )}
              </div>

              {/* Report body */}
              <div className="px-5 py-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">
                  {insight.report}
                </pre>
                {insight.stats?.top_tools && (
                  <p className="mt-3 text-xs text-gray-400 border-t border-gray-50 pt-3">
                    Top 工具：{insight.stats.top_tools}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
