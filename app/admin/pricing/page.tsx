"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Toolkit {
  id: string;
  slug: string;
  name: string;
  price_monthly: number | null;
  stripe_price_id: string | null;
  is_active: boolean;
}

async function authHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    "Authorization": `Bearer ${session?.access_token ?? ""}`,
    "Content-Type": "application/json",
  };
}

export default function AdminPricingPage() {
  const [toolkits, setToolkits] = useState<Toolkit[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const headers = await authHeader();
    const res = await fetch("/api/admin/pricing", { headers });
    const data = await res.json();
    setToolkits(data.toolkits ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function startEdit(kit: Toolkit) {
    setEditingId(kit.id);
    setEditPrice(String(kit.price_monthly ?? ""));
    setMsg("");
  }

  async function handleSave(kitId: string) {
    setSaving(true);
    setMsg("");
    const headers = await authHeader();
    const res = await fetch("/api/admin/pricing/update", {
      method: "POST", headers,
      body: JSON.stringify({ toolkit_id: kitId, price_monthly: editPrice }),
    });
    const data = await res.json();
    if (res.ok) {
      setToolkits((prev) => prev.map((t) => t.id === kitId ? { ...t, price_monthly: parseFloat(editPrice) } : t));
      setMsg("✓ Display price updated");
      setEditingId(null);
    } else {
      setMsg(`✗ ${data.error}`);
    }
    setSaving(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Pricing Management</h1>
        {msg && <p className="text-sm text-gray-600">{msg}</p>}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-xs text-amber-800">
        <strong>Note:</strong> Changing the display price here does <strong>not</strong> affect the Stripe charge amount.
        To change what customers are actually charged, update the price in <strong>Stripe Dashboard → Products</strong>.
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
                <th className="text-left px-4 py-3 font-medium">Toolkit</th>
                <th className="text-left px-4 py-3 font-medium">Slug</th>
                <th className="text-center px-4 py-3 font-medium">Display Price</th>
                <th className="text-left px-4 py-3 font-medium">Stripe Price ID</th>
                <th className="text-center px-3 py-3 font-medium">Active</th>
                <th className="text-right px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {toolkits.map((kit) => (
                <tr key={kit.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{kit.name}</td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{kit.slug}</code>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingId === kit.id ? (
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-gray-500">$</span>
                        <input type="number" min="0" step="0.01" value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)} autoFocus
                          className="w-20 border border-indigo-300 rounded px-2 py-0.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                        <span className="text-xs text-gray-400">/mo</span>
                      </div>
                    ) : (
                      <span className="font-medium text-gray-900">
                        {kit.price_monthly != null ? `$${kit.price_monthly}/mo` : "—"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs text-gray-400 truncate max-w-[160px] block">{kit.stripe_price_id ?? "—"}</code>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${kit.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {kit.is_active ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId === kit.id ? (
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => handleSave(kit.id)} disabled={saving}
                          className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 disabled:opacity-50">Save</button>
                        <button onClick={() => setEditingId(null)}
                          className="text-xs border border-gray-200 text-gray-600 px-3 py-1 rounded-lg hover:border-gray-400">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(kit)} className="text-xs text-indigo-600 hover:text-indigo-800">Edit price</button>
                    )}
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
