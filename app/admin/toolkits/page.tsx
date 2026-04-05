"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Toolkit {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_monthly: number | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  tool_count: number;
}

const EMPTY_FORM = { name: "", slug: "", description: "", price_monthly: "", icon: "", sort_order: "0" };

async function authHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  return { "Authorization": `Bearer ${session?.access_token ?? ""}`, "Content-Type": "application/json" };
}

export default function AdminToolkitsPage() {
  const [toolkits, setToolkits] = useState<Toolkit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  async function load() {
    const headers = await authHeader();
    const res = await fetch("/api/admin/toolkits", { headers });
    const data = await res.json();
    setToolkits(data.toolkits ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  // Auto-generate slug from name
  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    const slug = name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
    setForm((prev) => ({ ...prev, name, slug }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const headers = await authHeader();
    const res = await fetch("/api/admin/toolkits/create", {
      method: "POST", headers,
      body: JSON.stringify({ ...form, sort_order: parseInt(form.sort_order) || 0 }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg("✓ Toolkit created");
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } else {
      setMsg(`✗ ${data.error}`);
    }
    setSaving(false);
  }

  async function handleToggle(kitId: string, isActive: boolean) {
    setTogglingId(kitId);
    const headers = await authHeader();
    const res = await fetch("/api/admin/toolkits/toggle", {
      method: "POST", headers,
      body: JSON.stringify({ toolkit_id: kitId, is_active: isActive }),
    });
    if (res.ok) {
      setToolkits((prev) => prev.map((t) => t.id === kitId ? { ...t, is_active: isActive } : t));
    }
    setTogglingId(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Toolkits</h1>
        <button onClick={() => { setShowForm(!showForm); setMsg(""); }}
          className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
          {showForm ? "Cancel" : "New Toolkit"}
        </button>
      </div>

      {msg && <p className="text-sm text-gray-600 mb-4 bg-gray-50 rounded-lg px-3 py-2">{msg}</p>}

      {/* New Toolkit Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Create New Toolkit</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Name *</label>
              <input name="name" value={form.name} onChange={handleNameChange} required placeholder="e.g. Jobseeker Toolkit"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Slug *</label>
              <input name="slug" value={form.slug} onChange={handleChange} required placeholder="e.g. jobseeker"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Price ($/month)</label>
              <input name="price_monthly" value={form.price_monthly} onChange={handleChange} type="number" min="0" step="0.01" placeholder="9.00"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Icon (emoji, optional)</label>
              <input name="icon" value={form.icon} onChange={handleChange} placeholder="💼"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Sort Order</label>
              <input name="sort_order" value={form.sort_order} onChange={handleChange} type="number" min="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={2} placeholder="Short description..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <button type="submit" disabled={saving}
            className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {saving ? "Creating…" : "Create Toolkit"}
          </button>
        </form>
      )}

      {/* Toolkit List */}
      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
                <th className="text-left px-4 py-3 font-medium">Toolkit</th>
                <th className="text-left px-4 py-3 font-medium">Slug</th>
                <th className="text-center px-3 py-3 font-medium">Price</th>
                <th className="text-center px-3 py-3 font-medium">Tools</th>
                <th className="text-center px-3 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {toolkits.map((kit) => (
                <tr key={kit.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{kit.icon ? `${kit.icon} ` : ""}{kit.name}</span>
                    {kit.description && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{kit.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{kit.slug}</code>
                  </td>
                  <td className="px-3 py-3 text-center text-sm text-gray-700">
                    {kit.price_monthly != null ? `$${kit.price_monthly}/mo` : "—"}
                  </td>
                  <td className="px-3 py-3 text-center text-sm font-medium text-gray-900">{kit.tool_count}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${kit.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {kit.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleToggle(kit.id, !kit.is_active)} disabled={togglingId === kit.id}
                      className="text-xs border border-gray-200 text-gray-600 px-2.5 py-1 rounded-lg hover:border-gray-400 disabled:opacity-50 transition-colors">
                      {kit.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
