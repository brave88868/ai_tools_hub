"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Stats {
  keywords: number;
  pendingKeywords: number;
  useCasePages: number;
}

export default function AdminSeoPage() {
  const [stats, setStats] = useState<Stats>({ keywords: 0, pendingKeywords: 0, useCasePages: 0 });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  async function loadStats() {
    const [{ count: kw }, { count: pending }, { count: uc }] = await Promise.all([
      supabase.from("seo_keywords").select("*", { count: "exact", head: true }),
      supabase.from("seo_keywords").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("tool_use_cases").select("*", { count: "exact", head: true }),
    ]);
    setStats({ keywords: kw ?? 0, pendingKeywords: pending ?? 0, useCasePages: uc ?? 0 });
  }

  useEffect(() => { loadStats(); }, []);

  async function runAction(action: string, endpoint: string, body?: object) {
    setLoading(action);
    setMsg("");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const data = await res.json();
      setMsg(res.ok ? `✓ ${JSON.stringify(data)}` : `✗ ${data.error}`);
      loadStats();
    } catch {
      setMsg("✗ Request failed");
    }
    setLoading(null);
  }

  const actions = [
    {
      label: "Generate Keywords",
      key: "keywords",
      onClick: () => runAction("keywords", "/api/operator/generate-keywords", {}),
      desc: "Generate 20 new SEO keywords per toolkit",
    },
    {
      label: "Generate Use-case Pages",
      key: "usecases",
      onClick: () => runAction("usecases", "/api/operator/generate-use-cases", { limit: 20 }),
      desc: "Generate up to 20 use-case page contents",
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">SEO Engine</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Keywords", value: stats.keywords },
          { label: "Pending Keywords", value: stats.pendingKeywords },
          { label: "Use-case Pages", value: stats.useCasePages },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {msg && <p className="text-sm text-gray-600 mb-4 bg-gray-50 rounded-lg px-3 py-2">{msg}</p>}

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map(({ label, key, onClick, desc }) => (
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
      </div>
    </div>
  );
}
