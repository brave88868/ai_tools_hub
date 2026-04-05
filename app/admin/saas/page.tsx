"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface SaasProject {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  status: string;
  seo_pages_count: number;
  created_at: string;
}

async function authHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    "Authorization": `Bearer ${session?.access_token ?? ""}`,
    "Content-Type": "application/json",
  };
}

export default function AdminSaasPage() {
  const [projects, setProjects] = useState<SaasProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genMsg, setGenMsg] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);

  async function loadProjects() {
    const headers = await authHeader();
    const res = await fetch("/api/admin/saas-list", { headers }).catch(() => null);
    if (res?.ok) {
      const data = await res.json();
      setProjects(data.projects ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { loadProjects(); }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim()) return;
    setGenerating(true);
    setGenMsg("");
    const headers = await authHeader();
    const res = await fetch("/api/operator/generate-saas", {
      method: "POST",
      headers,
      body: JSON.stringify({ keyword: keyword.trim() }),
    });
    const data = await res.json();
    if (res.ok && data.project) {
      setGenMsg(`✓ Created ${data.project.name} — ${data.project.domain ?? data.project.slug}`);
      setKeyword("");
      await loadProjects();
    } else {
      setGenMsg(`✗ ${data.error ?? "Generation failed"}`);
    }
    setGenerating(false);
  }

  async function handleGeneratePages(projectId: string) {
    setActingId(projectId);
    const headers = await authHeader();
    const res = await fetch("/api/operator/generate-saas-pages", {
      method: "POST",
      headers,
      body: JSON.stringify({ project_id: projectId, count: 20 }),
    });
    const data = await res.json();
    if (res.ok) {
      setProjects((prev) =>
        prev.map((p) => p.id === projectId ? { ...p, seo_pages_count: data.generated ?? p.seo_pages_count } : p)
      );
    }
    setActingId(null);
  }

  async function handleStatusToggle(project: SaasProject) {
    setActingId(project.id);
    const newStatus = project.status === "active" ? "archived" : "active";
    const headers = await authHeader();
    await fetch("/api/admin/saas-update-status", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ project_id: project.id, status: newStatus }),
    });
    setProjects((prev) =>
      prev.map((p) => p.id === project.id ? { ...p, status: newStatus } : p)
    );
    setActingId(null);
  }

  async function handleDelete(project: SaasProject) {
    if (!window.confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    setActingId(project.id);
    const headers = await authHeader();
    await fetch("/api/admin/saas-delete", {
      method: "DELETE",
      headers,
      body: JSON.stringify({ project_id: project.id }),
    });
    setProjects((prev) => prev.filter((p) => p.id !== project.id));
    setActingId(null);
  }

  const total = projects.length;
  const active = projects.filter((p) => p.status === "active").length;
  const draft = projects.filter((p) => p.status === "draft").length;
  const totalSeoPages = projects.reduce((sum, p) => sum + (p.seo_pages_count ?? 0), 0);

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-gray-900">SaaS Factory</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Projects", value: total },
          { label: "Active", value: active },
          { label: "Draft", value: draft },
          { label: "Total SEO Pages", value: totalSeoPages },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Generate form */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Generate New SaaS</h2>
        <form onSubmit={handleGenerate} className="flex gap-3 flex-wrap items-end">
          <div className="flex flex-col gap-1 flex-1 min-w-[220px]">
            <label className="text-xs text-gray-500">Keyword</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. youtube title generator"
              required
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={generating}
            className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {generating ? "Generating SaaS…" : "Generate SaaS"}
          </button>
        </form>
        {genMsg && (
          <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">{genMsg}</p>
        )}
      </div>

      {/* Projects table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">All Projects</h2>
        </div>
        {loading ? (
          <p className="text-gray-400 text-sm px-5 py-8">Loading…</p>
        ) : projects.length === 0 ? (
          <p className="text-gray-400 text-sm px-5 py-8">No projects yet. Generate your first SaaS above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Slug</th>
                  <th className="text-left px-4 py-3 font-medium">Domain</th>
                  <th className="text-center px-3 py-3 font-medium">Status</th>
                  <th className="text-center px-3 py-3 font-medium">SEO Pages</th>
                  <th className="text-right px-4 py-3 font-medium">Created</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-900 text-xs">{p.name}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs font-mono">{p.slug}</td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs font-mono">{p.domain ?? "—"}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        p.status === "active" ? "bg-green-100 text-green-700"
                        : p.status === "draft" ? "bg-gray-100 text-gray-500"
                        : "bg-orange-100 text-orange-600"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center text-xs text-gray-500">{p.seo_pages_count ?? 0}</td>
                    <td className="px-4 py-2.5 text-right text-xs text-gray-400">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <Link
                          href={`/saas/${p.slug}`}
                          target="_blank"
                          className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleGeneratePages(p.id)}
                          disabled={actingId === p.id}
                          className="text-xs px-2 py-1 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-50 transition-colors"
                        >
                          Gen SEO
                        </button>
                        <button
                          onClick={() => handleStatusToggle(p)}
                          disabled={actingId === p.id}
                          className={`text-xs px-2 py-1 rounded disabled:opacity-50 transition-colors ${
                            p.status === "active"
                              ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
                              : "bg-green-50 text-green-600 hover:bg-green-100"
                          }`}
                        >
                          {p.status === "active" ? "Archive" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          disabled={actingId === p.id}
                          className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          Delete
                        </button>
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
