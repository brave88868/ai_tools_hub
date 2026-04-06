"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface ToolkitRef { id: string; slug: string; name: string; }
interface Tool {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  tool_type: string;
  prompt_file: string | null;
  inputs_schema: unknown;
  output_format: string | null;
  sort_order: number;
  is_active: boolean;
  auto_generated: boolean | null;
  toolkit_id: string | null;
  toolkits: ToolkitRef | null;
}

const EMPTY_FORM = {
  toolkit_id: "", name: "", slug: "", description: "", tool_type: "template",
  prompt_file: "", inputs_schema: "", output_format: "markdown", sort_order: "0",
};

async function authHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  return { "Authorization": `Bearer ${session?.access_token ?? ""}`, "Content-Type": "application/json" };
}

export default function AdminToolsManagePage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [toolkits, setToolkits] = useState<ToolkitRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [filterToolkit, setFilterToolkit] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    const headers = await authHeader();
    const [toolsRes, kitsRes] = await Promise.all([
      fetch("/api/admin/tools", { headers }),
      fetch("/api/admin/toolkits", { headers }),
    ]);
    const toolsData = await toolsRes.json();
    const kitsData = await kitsRes.json();
    setTools(toolsData.tools ?? []);
    setToolkits(kitsData.toolkits ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    const slug = name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
    setForm((prev) => ({ ...prev, name, slug }));
  }

  function openCreate() {
    setEditingTool(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setMsg("");
  }

  function openEdit(tool: Tool) {
    setEditingTool(tool);
    setForm({
      toolkit_id: tool.toolkit_id ?? "",
      name: tool.name,
      slug: tool.slug,
      description: tool.description ?? "",
      tool_type: tool.tool_type,
      prompt_file: tool.prompt_file ?? "",
      inputs_schema: tool.inputs_schema ? JSON.stringify(tool.inputs_schema, null, 2) : "",
      output_format: tool.output_format ?? "markdown",
      sort_order: String(tool.sort_order),
    });
    setShowForm(true);
    setMsg("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const headers = await authHeader();

    const payload = {
      ...form,
      sort_order: parseInt(form.sort_order) || 0,
      inputs_schema: form.inputs_schema || null,
    };

    if (editingTool) {
      const res = await fetch("/api/admin/tools/update", {
        method: "POST", headers,
        body: JSON.stringify({ tool_id: editingTool.id, ...payload }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg("✓ Tool updated");
        setShowForm(false);
        load();
      } else {
        setMsg(`✗ ${data.error}`);
      }
    } else {
      const res = await fetch("/api/admin/tools/create", {
        method: "POST", headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg("✓ Tool created");
        setForm(EMPTY_FORM);
        setShowForm(false);
        load();
      } else {
        setMsg(`✗ ${data.error}`);
      }
    }
    setSaving(false);
  }

  async function handleToggle(toolId: string, isActive: boolean) {
    setTogglingId(toolId);
    const headers = await authHeader();
    const res = await fetch("/api/admin/tools/toggle", {
      method: "POST", headers,
      body: JSON.stringify({ tool_id: toolId, is_active: isActive }),
    });
    if (res.ok) {
      setTools((prev) => prev.map((t) => t.id === toolId ? { ...t, is_active: isActive } : t));
    }
    setTogglingId(null);
  }

  const filtered = tools.filter((t) => {
    if (filterToolkit && t.toolkit_id !== filterToolkit) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.slug.includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">
          Tools Management <span className="text-gray-400 font-normal text-base">({tools.length})</span>
        </h1>
        <button onClick={openCreate}
          className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
          New Tool
        </button>
      </div>

      {msg && <p className="text-sm text-gray-600 mb-4 bg-gray-50 rounded-lg px-3 py-2">{msg}</p>}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">
            {editingTool ? `Edit: ${editingTool.name}` : "Create New Tool"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Toolkit *</label>
              <select name="toolkit_id" value={form.toolkit_id} onChange={handleChange} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                <option value="">Select toolkit…</option>
                {toolkits.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Name *</label>
              <input name="name" value={form.name} onChange={handleNameChange} required placeholder="e.g. Resume Optimizer"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Slug *</label>
              <input name="slug" value={form.slug} onChange={handleChange} required placeholder="e.g. resume-optimizer"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Tool Type</label>
              <select name="tool_type" value={form.tool_type} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                <option value="template">template</option>
                <option value="config">config</option>
                <option value="custom">custom</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Prompt File</label>
              <input name="prompt_file" value={form.prompt_file} onChange={handleChange} placeholder="e.g. jobseeker/resume_optimizer.txt"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Output Format</label>
              <select name="output_format" value={form.output_format} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                <option value="markdown">markdown</option>
                <option value="text">text</option>
                <option value="json">json</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Sort Order</label>
              <input name="sort_order" value={form.sort_order} onChange={handleChange} type="number" min="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Description</label>
            <input name="description" value={form.description} onChange={handleChange} placeholder="Short description"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">inputs_schema (JSON)</label>
            <textarea name="inputs_schema" value={form.inputs_schema} onChange={handleChange} rows={4}
              placeholder={'[{"name":"input","label":"Your Input","type":"textarea","required":true}]'}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {saving ? "Saving…" : (editingTool ? "Update Tool" : "Create Tool")}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="border border-gray-200 text-gray-600 text-sm px-5 py-2 rounded-lg hover:border-gray-400 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select value={filterToolkit} onChange={(e) => setFilterToolkit(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none">
          <option value="">All Toolkits</option>
          {toolkits.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
        </select>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name / slug…"
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-52 focus:outline-none" />
        <span className="self-center text-xs text-gray-400">{filtered.length} tools</span>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-3 py-3 font-medium">Slug</th>
                  <th className="text-left px-3 py-3 font-medium">Toolkit</th>
                  <th className="text-center px-3 py-3 font-medium">Type</th>
                  <th className="text-center px-3 py-3 font-medium">Source</th>
                  <th className="text-center px-3 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((tool) => (
                  <tr key={tool.id} className={tool.is_active ? "hover:bg-gray-50" : "bg-gray-50 opacity-60 hover:opacity-100"}>
                    <td className="px-4 py-2.5 font-medium text-gray-900 text-sm">
                      <a
                        href={`/tools/${tool.slug}?preview=true`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline hover:text-indigo-600 transition-colors"
                      >
                        {tool.name}
                      </a>
                    </td>
                    <td className="px-3 py-2.5">
                      <code className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{tool.slug}</code>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-500">
                      {tool.toolkits?.name ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{tool.tool_type}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {tool.auto_generated
                        ? <span className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">Auto</span>
                        : <span className="text-xs text-gray-300">Manual</span>}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${tool.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {tool.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex gap-1.5 justify-end">
                        <button onClick={() => openEdit(tool)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-0.5">Edit</button>
                        <button onClick={() => handleToggle(tool.id, !tool.is_active)} disabled={togglingId === tool.id}
                          className="text-xs border border-gray-200 text-gray-600 px-2.5 py-0.5 rounded-lg hover:border-gray-400 disabled:opacity-50">
                          {tool.is_active ? "Off" : "On"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
