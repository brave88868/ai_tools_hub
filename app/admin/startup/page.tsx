"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Opportunity {
  id: string;
  keyword: string;
  source: string;
  score: number;
  status: string;
  created_at: string;
}

interface Idea {
  id: string;
  product_name: string;
  slug: string;
  status: string;
  seo_pages_count?: number;
  created_at: string;
}

async function authHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    "Authorization": `Bearer ${session?.access_token ?? ""}`,
    "Content-Type": "application/json",
  };
}

type StepStatus = "idle" | "running" | "done" | "error";

interface PipelineStep {
  label: string;
  status: StepStatus;
  result: string;
}

export default function AdminStartupPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [stepLoading, setStepLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([]);
  const [pipelineRunning, setPipelineRunning] = useState(false);

  const oppsTotal = opportunities.length;
  const analyzed = opportunities.filter((o) => o.status === "analyzed" || o.status === "converted").length;
  const ideasTotal = ideas.length;
  const launched = ideas.filter((i) => i.status === "launched").length;

  async function loadData() {
    const headers = await authHeader();
    const [oppsRes, ideasRes] = await Promise.all([
      fetch("/api/admin/startup-list?type=opportunities", { headers }),
      fetch("/api/admin/startup-list?type=ideas", { headers }),
    ]);
    if (oppsRes.ok) {
      const d = await oppsRes.json();
      setOpportunities(d.opportunities ?? []);
    }
    if (ideasRes.ok) {
      const d = await ideasRes.json();
      setIdeas(d.ideas ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function runStep(
    label: string,
    fn: () => Promise<string>
  ) {
    setStepLoading(label);
    setMsg("");
    try {
      const result = await fn();
      setMsg(`✓ ${label}: ${result}`);
      await loadData();
    } catch (e) {
      setMsg(`✗ ${label} failed: ${e instanceof Error ? e.message : "unknown error"}`);
    }
    setStepLoading(null);
  }

  async function discoverOpportunities(): Promise<string> {
    const headers = await authHeader();
    const res = await fetch("/api/operator/discover-opportunities", {
      method: "POST", headers,
      body: JSON.stringify({ count: 10 }),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error ?? "failed");
    return `${d.discovered} opportunities discovered`;
  }

  async function analyzeMarket(): Promise<string> {
    const headers = await authHeader();
    const res = await fetch("/api/operator/analyze-market", {
      method: "POST", headers,
      body: JSON.stringify({ count: 5 }),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error ?? "failed");
    return `${d.analyzed} opportunities analyzed`;
  }

  async function generateIdea(): Promise<string> {
    const headers = await authHeader();
    // Pick highest-score analyzed opportunity not yet converted
    const topOpp = opportunities
      .filter((o) => o.status === "analyzed")
      .sort((a, b) => b.score - a.score)[0];
    if (!topOpp) throw new Error("No analyzed opportunities available. Run Analyze Market first.");
    const res = await fetch("/api/operator/generate-startup", {
      method: "POST", headers,
      body: JSON.stringify({ opportunity_id: topOpp.id }),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error ?? "failed");
    return `Created "${d.idea?.product_name ?? d.idea?.slug}"`;
  }

  async function generateLandingPage(): Promise<string> {
    const headers = await authHeader();
    const latestIdea = ideas.filter((i) => i.status === "idea")[0];
    if (!latestIdea) throw new Error("No ideas in 'idea' state. Generate a startup first.");
    const res = await fetch("/api/operator/generate-landing-page", {
      method: "POST", headers,
      body: JSON.stringify({ idea_id: latestIdea.id }),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error ?? "failed");
    return `Landing page for "${latestIdea.product_name}" generated`;
  }

  async function generateSEO(): Promise<string> {
    const headers = await authHeader();
    const latestIdea = ideas.filter((i) => i.status === "building")[0]
      ?? ideas.filter((i) => i.status === "idea")[0];
    if (!latestIdea) throw new Error("No ideas available. Generate a startup first.");
    const res = await fetch("/api/operator/generate-product-seo", {
      method: "POST", headers,
      body: JSON.stringify({ idea_id: latestIdea.id, count: 10 }),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error ?? "failed");
    return `${d.generated} SEO pages for "${latestIdea.product_name}"`;
  }

  async function launchProduct(ideaId: string): Promise<string> {
    const headers = await authHeader();
    const res = await fetch("/api/operator/launch-product", {
      method: "PATCH", headers,
      body: JSON.stringify({ idea_id: ideaId }),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error ?? "failed");
    return `Launched → ${d.url}`;
  }

  async function launchLatest(): Promise<string> {
    const latestIdea = ideas.filter((i) => i.status === "building")[0]
      ?? ideas.filter((i) => i.status === "idea")[0];
    if (!latestIdea) throw new Error("No ideas to launch.");
    return launchProduct(latestIdea.id);
  }

  async function runFullPipeline() {
    setPipelineRunning(true);
    setMsg("");

    const steps: PipelineStep[] = [
      { label: "① Discover Opportunities", status: "idle", result: "" },
      { label: "② Analyze Market", status: "idle", result: "" },
      { label: "③ Generate Startup Idea", status: "idle", result: "" },
      { label: "④ Generate Landing Page", status: "idle", result: "" },
      { label: "⑤ Generate SEO Pages", status: "idle", result: "" },
      { label: "⑥ Launch to SaaS Factory", status: "idle", result: "" },
    ];
    setPipelineSteps([...steps]);

    const fns = [
      discoverOpportunities,
      analyzeMarket,
      generateIdea,
      generateLandingPage,
      generateSEO,
      launchLatest,
    ];

    for (let i = 0; i < fns.length; i++) {
      steps[i].status = "running";
      setPipelineSteps([...steps]);
      try {
        const result = await fns[i]();
        steps[i].status = "done";
        steps[i].result = result;
      } catch (e) {
        steps[i].status = "error";
        steps[i].result = e instanceof Error ? e.message : "failed";
      }
      setPipelineSteps([...steps]);
      await loadData();
      if (i < fns.length - 1) await new Promise((r) => setTimeout(r, 2000));
    }

    setPipelineRunning(false);
  }

  const STEPS = [
    {
      id: "discover",
      num: "①",
      label: "Discover Opportunities",
      desc: "AI 扫描并发现 10 个高潜力创业机会",
      fn: discoverOpportunities,
      color: "bg-indigo-600 hover:bg-indigo-700",
    },
    {
      id: "analyze",
      num: "②",
      label: "Analyze Market",
      desc: "AI 分析 5 个机会的市场需求、竞争度和盈利潜力",
      fn: analyzeMarket,
      color: "bg-violet-600 hover:bg-violet-700",
    },
    {
      id: "idea",
      num: "③",
      label: "Generate Startup Idea",
      desc: "为评分最高的机会生成完整 SaaS 产品 idea",
      fn: generateIdea,
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      id: "landing",
      num: "④",
      label: "Generate Landing Page",
      desc: "为最新 idea 生成完整 landing page 内容",
      fn: generateLandingPage,
      color: "bg-teal-600 hover:bg-teal-700",
    },
    {
      id: "seo",
      num: "⑤",
      label: "Generate SEO Pages",
      desc: "为产品自动生成 10 个 SEO 关键词页面",
      fn: generateSEO,
      color: "bg-emerald-600 hover:bg-emerald-700",
    },
    {
      id: "launch",
      num: "⑥",
      label: "Launch to SaaS Factory",
      desc: "将产品状态改为 active，上线到 /saas/{slug}",
      fn: launchLatest,
      color: "bg-orange-600 hover:bg-orange-700",
    },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-gray-900">AI Startup Generator</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Opportunities Discovered", value: oppsTotal },
          { label: "Market Analyzed", value: analyzed },
          { label: "Ideas Generated", value: ideasTotal },
          { label: "Products Launched", value: launched },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Status message */}
      {msg && (
        <p className="text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">{msg}</p>
      )}

      {/* Pipeline control */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-gray-900">Pipeline Control</h2>
          <button
            onClick={runFullPipeline}
            disabled={pipelineRunning}
            className="bg-black text-white text-xs px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors font-semibold"
          >
            {pipelineRunning ? "Running Pipeline…" : "🚀 Run Full Pipeline"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
          {STEPS.map((step) => (
            <div key={step.id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <span className="text-base font-bold text-gray-300">{step.num}</span>
              </div>
              <h3 className="text-xs font-semibold text-gray-900 mb-1">{step.label}</h3>
              <p className="text-xs text-gray-400 mb-3">{step.desc}</p>
              <button
                onClick={() => runStep(step.label, step.fn)}
                disabled={stepLoading === step.label || pipelineRunning}
                className={`w-full text-white text-xs py-2 rounded-lg ${step.color} disabled:opacity-50 transition-colors`}
              >
                {stepLoading === step.label ? "Running…" : "Run"}
              </button>
            </div>
          ))}
        </div>

        {/* Pipeline progress */}
        {pipelineSteps.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="text-xs font-semibold text-gray-500 mb-3">Pipeline Progress</div>
            {pipelineSteps.map((s) => (
              <div key={s.label} className="flex items-start gap-2 text-xs">
                <span className={
                  s.status === "done" ? "text-green-500" :
                  s.status === "error" ? "text-red-500" :
                  s.status === "running" ? "text-blue-500 animate-pulse" :
                  "text-gray-300"
                }>
                  {s.status === "done" ? "✓" : s.status === "error" ? "✗" : s.status === "running" ? "▶" : "○"}
                </span>
                <span className="font-medium text-gray-700">{s.label}</span>
                {s.result && <span className="text-gray-400">— {s.result}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Opportunities table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Opportunities (latest 20)</h2>
        </div>
        {loading ? (
          <p className="text-gray-400 text-sm px-5 py-8">Loading…</p>
        ) : opportunities.length === 0 ? (
          <p className="text-gray-400 text-sm px-5 py-8">No opportunities yet. Run ① Discover Opportunities.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
                  <th className="text-left px-4 py-3 font-medium">Keyword</th>
                  <th className="text-center px-3 py-3 font-medium">Source</th>
                  <th className="text-center px-3 py-3 font-medium">Score</th>
                  <th className="text-center px-3 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {opportunities.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-800 text-xs font-medium">{o.keyword}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{o.source}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-xs font-bold ${o.score >= 70 ? "text-green-600" : o.score >= 50 ? "text-yellow-600" : "text-gray-400"}`}>
                        {o.score}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        o.status === "converted" ? "bg-green-100 text-green-700" :
                        o.status === "analyzed" ? "bg-blue-100 text-blue-700" :
                        o.status === "skip" ? "bg-gray-100 text-gray-400" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-gray-400">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ideas / Products table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Products</h2>
        </div>
        {ideas.length === 0 ? (
          <p className="text-gray-400 text-sm px-5 py-8">No products yet. Run ③ Generate Startup Idea.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
                  <th className="text-left px-4 py-3 font-medium">Product Name</th>
                  <th className="text-left px-4 py-3 font-medium">Slug</th>
                  <th className="text-center px-3 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ideas.map((idea) => (
                  <tr key={idea.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-900 text-xs">{idea.product_name}</td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs font-mono">{idea.slug}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        idea.status === "launched" ? "bg-green-100 text-green-700" :
                        idea.status === "building" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {idea.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/saas/${idea.slug}`}
                          target="_blank"
                          className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => runStep(`SEO for ${idea.product_name}`, async () => {
                            const headers = await authHeader();
                            const res = await fetch("/api/operator/generate-product-seo", {
                              method: "POST", headers,
                              body: JSON.stringify({ idea_id: idea.id, count: 10 }),
                            });
                            const d = await res.json();
                            if (!res.ok) throw new Error(d.error ?? "failed");
                            return `${d.generated} pages generated`;
                          })}
                          disabled={!!stepLoading || pipelineRunning}
                          className="text-xs px-2 py-1 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-50 transition-colors"
                        >
                          Gen SEO
                        </button>
                        {idea.status !== "launched" && (
                          <button
                            onClick={() => runStep(`Launch ${idea.product_name}`, () => launchProduct(idea.id))}
                            disabled={!!stepLoading || pipelineRunning}
                            className="text-xs px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            Launch
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
