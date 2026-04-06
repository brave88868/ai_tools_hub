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

type EditForm = {
  name: string;
  description: string;
  price_monthly: string;
  icon: string;
  sort_order: string;
  is_active: boolean;
};

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

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: "", description: "", price_monthly: "", icon: "", sort_order: "0", is_active: true,
  });
  const [editSaving, setEditSaving] = useState(false);

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

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    const slug = name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
    setForm((prev) => ({ ...prev, name, slug }));
  }

  function openEdit(kit: Toolkit) {
    setEditingId(kit.id);
    setEditForm({
      name: kit.name,
      description: kit.description ?? "",
      price_monthly: kit.price_monthly != null ? String(kit.price_monthly) : "",
      icon: kit.icon ?? "",
      sort_order: String(kit.sort_order),
      is_active: kit.is_active,
    });
    setMsg("");
  }

  function handleEditChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
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

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setEditSaving(true);
    setMsg("");
    const headers = await authHeader();
    const res = await fetch("/api/admin/toolkits/update", {
      method: "POST", headers,
      body: JSON.stringify({ toolkit_id: editingId, ...editForm }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg("✓ Toolkit updated");
      setEditingId(null);
      load();
    } else {
      setMsg(`✗ ${data.error}`);
    }
    setEditSaving(false);
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

  const INPUT = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Toolkits</h1>
        <button
          onClick={() => { setShowForm(!showForm); setMsg(""); setEditingId(null); }}
          className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
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
              <input name="name" value={form.name} onChange={handleNameChange} required placeholder="e.g. Jobseeker Toolkit" className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Slug *</label>
              <input name="slug" value={form.slug} onChange={handleChange} required placeholder="e.g. jobseeker" className={`${INPUT} font-mono`} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Price ($/month)</label>
              <input name="price_monthly" value={form.price_monthly} onChange={handleChange} type="number" min="0" step="0.01" placeholder="9.00" className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Icon (emoji)</label>
              <input name="icon" value={form.icon} onChange={handleChange} placeholder="💼" className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Sort Order</label>
              <input name="sort_order" value={form.sort_order} onChange={handleChange} type="number" min="0" className={INPUT} />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={2} placeholder="Short description..." className={INPUT} />
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
        <div className="space-y-3">
          {toolkits.map((kit) => (
            <div key={kit.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {/* Row */}
              <div className={`flex items-center gap-3 px-4 py-3 ${!kit.is_active ? "opacity-60" : ""}`}>
                {/* Icon + name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 text-sm">
                      {kit.icon ? `${kit.icon} ` : ""}{kit.name}
                    </span>
                    <code className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{kit.slug}</code>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${kit.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {kit.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {kit.description && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{kit.description}</p>
                  )}
                </div>

                {/* Stats */}
                <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 shrink-0">
                  <span>{kit.price_monthly != null ? `$${kit.price_monthly}/mo` : "Free"}</span>
                  <span>{kit.tool_count} tools</span>
                  <span className="text-gray-300">order: {kit.sort_order}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => editingId === kit.id ? setEditingId(null) : openEdit(kit)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 border border-indigo-100 px-2.5 py-1 rounded-lg hover:border-indigo-300 transition-colors"
                  >
                    {editingId === kit.id ? "Cancel" : "Edit"}
                  </button>
                  <button
                    onClick={() => handleToggle(kit.id, !kit.is_active)}
                    disabled={togglingId === kit.id}
                    className="text-xs border border-gray-200 text-gray-600 px-2.5 py-1 rounded-lg hover:border-gray-400 disabled:opacity-50 transition-colors"
                  >
                    {kit.is_active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>

              {/* Inline Edit Form */}
              {editingId === kit.id && (
                <form
                  onSubmit={handleUpdate}
                  className="border-t border-gray-100 bg-gray-50 px-4 py-4 space-y-3"
                >
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    Edit: {kit.name}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Name *</label>
                      <input
                        name="name"
                        value={editForm.name}
                        onChange={handleEditChange}
                        required
                        className={INPUT}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Icon (emoji)</label>
                      <input
                        name="icon"
                        value={editForm.icon}
                        onChange={handleEditChange}
                        placeholder="💼"
                        className={INPUT}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Price ($/month)</label>
                      <input
                        name="price_monthly"
                        value={editForm.price_monthly}
                        onChange={handleEditChange}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="9.00"
                        className={INPUT}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Sort Order</label>
                      <input
                        name="sort_order"
                        value={editForm.sort_order}
                        onChange={handleEditChange}
                        type="number"
                        min="0"
                        className={INPUT}
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                      <input
                        id={`is_active_${kit.id}`}
                        name="is_active"
                        type="checkbox"
                        checked={editForm.is_active}
                        onChange={handleEditChange}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor={`is_active_${kit.id}`} className="text-sm text-gray-700">
                        Active
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Description</label>
                    <textarea
                      name="description"
                      value={editForm.description}
                      onChange={handleEditChange}
                      rows={2}
                      placeholder="Short description..."
                      className={INPUT}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={editSaving}
                      className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {editSaving ? "Saving…" : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="border border-gray-200 text-gray-600 text-sm px-5 py-2 rounded-lg hover:border-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
