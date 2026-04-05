"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface ToolIdea {
  id: string;
  tool_name: string;
  tool_slug: string;
  description: string | null;
  toolkit_slug: string;
  prompt_template: string | null;
  status: string;
  created_at: string;
}

async function authHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    "Authorization": `Bearer ${session?.access_token ?? ""}`,
    "Content-Type": "application/json",
  };
}

export default function AdminToolsPage() {
  const [ideas, setIdeas] = useState<ToolIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  async function load() {
    const { data } = await supabase
      .from("tool_ideas")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setIdeas((data as ToolIdea[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDiscover() {
    setDiscovering(true);
    setMsg("");
    const headers = await authHeader();
    const res = await fetch("/api/operator/generate-tool-ideas", { method: "POST", headers });
    const data = await res.json();
    setMsg(res.ok ? `✓ Generated ${data.generated} new tool ideas` : `✗ ${data.error}`);
    setDiscovering(false);
    load();
  }

  async function handleAction(ideaId: string, action: "approve" | "reject") {
    setActingId(ideaId);
    const headers = await authHeader();
    const res = await fetch("/api/operator/approve-tool", {
      method: "POST",
      headers,
      body: JSON.stringify({ idea_id: ideaId, action }),
    });
    const data = await res.json();
    if (res.ok || res.status === 409) {
      setIdeas((prev) => prev.filter((i) => i.id !== ideaId));
      if (res.status === 409) setMsg(`⚠️ ${data.error} — idea marked approved`);
    } else {
      setMsg(`✗ ${data.error}`);
    }
    setActingId(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Tool Generator</h1>
        <button
          onClick={handleDiscover}
          disabled={discovering}
          className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {discovering ? "Discovering…" : "Discover New Tools"}
        </button>
      </div>

      {msg && <p className="text-sm text-gray-600 mb-4">{msg}</p>}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : ideas.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl">
          <p className="text-gray-400 text-sm mb-3">No pending tool ideas.</p>
          <p className="text-xs text-gray-300">Click &quot;Discover New Tools&quot; to generate ideas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ideas.map((idea) => (
            <div key={idea.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{idea.tool_name}</span>
                    <code className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{idea.tool_slug}</code>
                    <span className="text-xs text-gray-400 capitalize">{idea.toolkit_slug}</span>
                  </div>
                  {idea.description && <p className="text-xs text-gray-500 mb-2">{idea.description}</p>}
                  {idea.prompt_template && (
                    <details className="text-xs text-gray-400">
                      <summary className="cursor-pointer hover:text-gray-600">View prompt template</summary>
                      <pre className="mt-1 bg-gray-50 rounded p-2 text-xs overflow-auto max-h-24 whitespace-pre-wrap">{idea.prompt_template}</pre>
                    </details>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleAction(idea.id, "approve")} disabled={actingId === idea.id}
                    className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                    Approve
                  </button>
                  <button onClick={() => handleAction(idea.id, "reject")} disabled={actingId === idea.id}
                    className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:border-gray-400 disabled:opacity-50 transition-colors">
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
