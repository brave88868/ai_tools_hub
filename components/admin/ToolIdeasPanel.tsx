"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface ToolIdea {
  id: string;
  tool_name: string;
  description: string | null;
  toolkit_slug: string;
  status: string;
}

async function authHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    Authorization: `Bearer ${session?.access_token ?? ""}`,
    "Content-Type": "application/json",
  };
}

export default function ToolIdeasPanel() {
  const [ideas, setIdeas] = useState<ToolIdea[]>([]);
  const [rowLoading, setRowLoading] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const loadIdeas = useCallback(async () => {
    const { data } = await supabase
      .from("tool_ideas")
      .select("id,tool_name,description,toolkit_slug,status")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setIdeas(data ?? []);
  }, []);

  useEffect(() => {
    loadIdeas();
  }, [loadIdeas]);

  async function handleRow(id: string, action: "approve" | "reject") {
    const toolName = ideas.find((i) => i.id === id)?.tool_name ?? id;
    setRowLoading(id);
    setMsg(`${action === "approve" ? "Approving" : "Rejecting"} "${toolName}"…`);
    try {
      const headers = await authHeader();
      const res = await fetch("/api/admin/tool-ideas/approve", {
        method: "POST",
        headers,
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      if (res.ok) {
        setIdeas((prev) => prev.filter((i) => i.id !== id));
        setMsg(
          action === "approve"
            ? `✓ "${toolName}" approved and added to tools`
            : `✓ "${toolName}" rejected`
        );
      } else {
        const errMsg = data.error ?? data.message ?? `HTTP ${res.status}`;
        console.error("[ToolIdeasPanel] approve failed:", errMsg, data);
        setMsg(`✗ ${errMsg}`);
      }
    } catch (err) {
      const errMsg = (err as Error).message ?? "Network error";
      console.error("[ToolIdeasPanel] handleRow threw:", err);
      setMsg(`✗ ${errMsg}`);
    } finally {
      setRowLoading(null);
    }
  }

  async function handleApproveAll() {
    setBulkLoading(true);
    setMsg(`Approving all ${ideas.length} ideas…`);
    try {
      const headers = await authHeader();
      const res = await fetch("/api/admin/tool-ideas/approve-all", {
        method: "POST",
        headers,
      });
      const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      if (res.ok) {
        setMsg(`✓ Approved ${data.approved} tools${data.failed > 0 ? `, ${data.failed} failed` : ""}`);
        setIdeas([]);
      } else {
        const errMsg = data.error ?? data.message ?? `HTTP ${res.status}`;
        console.error("[ToolIdeasPanel] approve-all failed:", errMsg, data);
        setMsg(`✗ ${errMsg}`);
      }
    } catch (err) {
      const errMsg = (err as Error).message ?? "Network error";
      console.error("[ToolIdeasPanel] handleApproveAll threw:", err);
      setMsg(`✗ ${errMsg}`);
    } finally {
      setBulkLoading(false);
    }
  }

  if (ideas.length === 0 && !msg) return null;

  return (
    <div className="mt-6 bg-white border border-orange-100 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-900">
          Pending Tool Ideas{" "}
          {ideas.length > 0 && (
            <span className="ml-1 bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full">
              {ideas.length}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-3">
          {msg && (
            <span className="text-xs text-gray-500 max-w-xs truncate">{msg}</span>
          )}
          {ideas.length > 0 && (
            <button
              onClick={handleApproveAll}
              disabled={bulkLoading}
              className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {bulkLoading ? "Approving all…" : `Approve All (${ideas.length})`}
            </button>
          )}
        </div>
      </div>

      {ideas.length === 0 ? (
        <p className="text-xs text-gray-400">No pending tool ideas.</p>
      ) : (
        <div className="border border-gray-100 rounded-lg overflow-hidden">
          <div className="grid grid-cols-[140px_100px_1fr_130px] text-xs font-medium text-gray-400 bg-gray-50 px-3 py-2 border-b border-gray-100">
            <span>Tool Name</span>
            <span>Toolkit</span>
            <span>Description</span>
            <span></span>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {ideas.map((idea) => (
              <div
                key={idea.id}
                className="grid grid-cols-[140px_100px_1fr_130px] items-center px-3 py-2.5 text-xs hover:bg-gray-50"
              >
                <span className="text-gray-800 font-medium truncate pr-2">{idea.tool_name}</span>
                <span className="text-indigo-500 truncate pr-2">{idea.toolkit_slug}</span>
                <span className="text-gray-400 truncate pr-2">
                  {(idea.description ?? "").slice(0, 80)}
                  {(idea.description ?? "").length > 80 ? "…" : ""}
                </span>
                <div className="flex gap-1 justify-end">
                  <button
                    onClick={() => handleRow(idea.id, "approve")}
                    disabled={rowLoading === idea.id}
                    className="bg-green-100 text-green-700 px-2.5 py-1 rounded hover:bg-green-200 disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {rowLoading === idea.id ? "…" : "Approve"}
                  </button>
                  <button
                    onClick={() => handleRow(idea.id, "reject")}
                    disabled={rowLoading === idea.id}
                    className="bg-red-50 text-red-500 px-2.5 py-1 rounded hover:bg-red-100 disabled:opacity-50 transition-colors"
                  >
                    Reject
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
