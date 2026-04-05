"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Stats {
  keywords: number;
  pendingKeywords: number;
  useCasePages: number;
  growthKeywords: number;
  opportunities: number;
}

interface SeoSuggestion {
  slug: string;
  seo_title: string;
  seo_description: string;
  reason: string;
  current_views: number;
  avg_views: number;
}

async function authHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    "Authorization": `Bearer ${session?.access_token ?? ""}`,
    "Content-Type": "application/json",
  };
}

export default function AdminSeoPage() {
  const [stats, setStats] = useState<Stats>({
    keywords: 0, pendingKeywords: 0, useCasePages: 0, growthKeywords: 0, opportunities: 0,
  });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SeoSuggestion[]>([]);
  const [applyingSlug, setApplyingSlug] = useState<string | null>(null);

  async function loadStats() {
    const [{ count: kw }, { count: pending }, { count: uc }, { count: gkw }, { count: opps }] =
      await Promise.all([
        supabase.from("seo_keywords").select("*", { count: "exact", head: true }),
        supabase.from("seo_keywords").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("tool_use_cases").select("*", { count: "exact", head: true }),
        supabase.from("growth_keywords").select("*", { count: "exact", head: true }),
        supabase.from("tool_opportunities").select("*", { count: "exact", head: true }),
      ]);
    setStats({
      keywords: kw ?? 0,
      pendingKeywords: pending ?? 0,
      useCasePages: uc ?? 0,
      growthKeywords: gkw ?? 0,
      opportunities: opps ?? 0,
    });
  }

  useEffect(() => { loadStats(); }, []);

  async function runAction(action: string, endpoint: string, body?: object) {
    setLoading(action);
    setMsg("");
    try {
      const headers = await authHeader();
      const res = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify(body ?? {}) });
      const data = await res.json();
      setMsg(res.ok ? `✓ ${JSON.stringify(data)}` : `✗ ${data.error}`);
      loadStats();
    } catch {
      setMsg("✗ Request failed");
    }
    setLoading(null);
  }

  async function runOptimize() {
    setLoading("optimize");
    setMsg("");
    setSuggestions([]);
    try {
      const headers = await authHeader();
      const res = await fetch("/api/growth/optimize-seo", { method: "POST", headers, body: JSON.stringify({}) });
      const data = await res.json();
      if (res.ok) {
        setSuggestions(data.suggestions ?? []);
        setMsg(`✓ ${data.suggestions?.length ?? 0} suggestions generated (${data.total_analysed} tools analysed)`);
      } else {
        setMsg(`✗ ${data.error}`);
      }
    } catch {
      setMsg("✗ Request failed");
    }
    setLoading(null);
  }

  async function applySuggestion(s: SeoSuggestion) {
    setApplyingSlug(s.slug);
    const headers = await authHeader();
    // Get tool id first
    const { data: tool } = await supabase.from("tools").select("id").eq("slug", s.slug).single();
    if (!tool) { setApplyingSlug(null); return; }
    const res = await fetch("/api/admin/tools/update", {
      method: "POST", headers,
      body: JSON.stringify({ tool_id: tool.id, seo_title: s.seo_title, seo_description: s.seo_description }),
    });
    if (res.ok) {
      setSuggestions((prev) => prev.filter((x) => x.slug !== s.slug));
    }
    setApplyingSlug(null);
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">SEO Engine</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: "SEO Keywords", value: stats.keywords },
          { label: "Pending Keywords", value: stats.pendingKeywords },
          { label: "Use-case Pages", value: stats.useCasePages },
          { label: "Growth Keywords", value: stats.growthKeywords },
          { label: "Tool Opportunities", value: stats.opportunities },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {msg && <p className="text-sm text-gray-600 mb-4 bg-gray-50 rounded-lg px-3 py-2">{msg}</p>}

      {/* Action cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          {
            label: "Generate Blog Keywords",
            key: "keywords",
            onClick: () => runAction("keywords", "/api/operator/generate-keywords", {}),
            desc: "Generate 20 new SEO keywords per toolkit (seo_keywords table)",
          },
          {
            label: "Discover Growth Keywords",
            key: "growth-kw",
            onClick: () => runAction("growth-kw", "/api/growth/discover-keywords", { count: 50 }),
            desc: "Generate 50 high-intent keywords across all toolkits (growth_keywords table)",
          },
          {
            label: "Generate Use-case Pages",
            key: "usecases",
            onClick: () => runAction("usecases", "/api/operator/generate-use-cases", { limit: 20 }),
            desc: "Generate up to 20 use-case page contents",
          },
          {
            label: "Find Tool Opportunities",
            key: "opportunities",
            onClick: () => runAction("opportunities", "/api/growth/find-opportunities", { limit: 30 }),
            desc: "Analyse pending growth keywords → tool opportunity ideas",
          },
        ].map(({ label, key, onClick, desc }) => (
          <div key={key} className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">{label}</h3>
            <p className="text-xs text-gray-400 mb-4">{desc}</p>
            <button
              onClick={onClick}
              disabled={loading === key}
              className="w-full bg-black text-white text-sm py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {loading === key ? "Running…" : "Run"}
            </button>
          </div>
        ))}

        {/* SEO Optimizer card */}
        <div className="bg-white border border-indigo-100 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Optimise Meta Tags</h3>
          <p className="text-xs text-gray-400 mb-4">
            AI analyses low-traffic tool pages and suggests better titles & descriptions
          </p>
          <button
            onClick={runOptimize}
            disabled={loading === "optimize"}
            className="w-full bg-indigo-600 text-white text-sm py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading === "optimize" ? "Analysing…" : "Optimise →"}
          </button>
        </div>
      </div>

      {/* SEO suggestions panel */}
      {suggestions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              SEO Suggestions <span className="text-gray-400 font-normal">({suggestions.length})</span>
            </h2>
            <span className="text-xs text-gray-400">Review and apply each suggestion</span>
          </div>
          <div className="divide-y divide-gray-50">
            {suggestions.map((s) => (
              <div key={s.slug} className="px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                        {s.slug}
                      </code>
                      <span className="text-xs text-gray-400">
                        {s.current_views} views · avg {s.avg_views}
                      </span>
                    </div>
                    <div className="mb-1">
                      <span className="text-xs font-medium text-gray-500">Title: </span>
                      <span className="text-xs text-gray-800">{s.seo_title}</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-xs font-medium text-gray-500">Desc: </span>
                      <span className="text-xs text-gray-600">{s.seo_description}</span>
                    </div>
                    <p className="text-xs text-indigo-500 italic">{s.reason}</p>
                  </div>
                  <button
                    onClick={() => applySuggestion(s)}
                    disabled={applyingSlug === s.slug}
                    className="shrink-0 bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {applyingSlug === s.slug ? "Applying…" : "Apply"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
