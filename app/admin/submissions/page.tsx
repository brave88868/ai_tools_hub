"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Submission {
  id: string;
  name: string;
  website: string;
  description: string | null;
  category: string | null;
  pricing: string | null;
  submitter_email: string | null;
  status: string;
  created_at: string;
}

async function authHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    Authorization: `Bearer ${session?.access_token ?? ""}`,
    "Content-Type": "application/json",
  };
}

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");

  async function load(status = statusFilter) {
    setLoading(true);
    const headers = await authHeader();
    const res = await fetch(`/api/admin/submissions?status=${status}`, { headers });
    const data = await res.json();
    setSubmissions(data.submissions ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function act(id: string, action: "approve" | "reject") {
    setActingId(id);
    setMsg("");
    const headers = await authHeader();
    const res = await fetch("/api/admin/submissions", {
      method: "POST",
      headers,
      body: JSON.stringify({ submission_id: id, action }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg(action === "approve"
        ? `✓ Approved — tool slug: "${data.slug}" (inactive, assign toolkit in Tools Manage)`
        : "✓ Rejected"
      );
      load();
    } else {
      setMsg(`✗ ${data.error}`);
    }
    setActingId(null);
  }

  const TABS = ["pending", "approved", "rejected"];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">
          Tool Submissions{" "}
          <span className="text-gray-400 font-normal text-base">({submissions.length})</span>
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {TABS.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); load(s); }}
            className={`text-xs px-3 py-1.5 rounded-lg capitalize transition-colors ${
              statusFilter === s
                ? "bg-indigo-600 text-white"
                : "border border-gray-200 text-gray-600 hover:border-gray-400"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {msg && (
        <p className="text-sm text-gray-600 mb-4 bg-gray-50 rounded-lg px-3 py-2">{msg}</p>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : submissions.length === 0 ? (
        <p className="text-gray-400 text-sm">No {statusFilter} submissions.</p>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{sub.name}</span>
                    {sub.category && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                        {sub.category}
                      </span>
                    )}
                    {sub.pricing && (
                      <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded">
                        {sub.pricing}
                      </span>
                    )}
                  </div>
                  <a
                    href={sub.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 hover:underline break-all"
                  >
                    {sub.website}
                  </a>
                  {sub.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{sub.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    {sub.submitter_email && (
                      <span className="text-xs text-gray-400">{sub.submitter_email}</span>
                    )}
                    <span className="text-xs text-gray-300">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {statusFilter === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => act(sub.id, "approve")}
                      disabled={actingId === sub.id}
                      className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => act(sub.id, "reject")}
                      disabled={actingId === sub.id}
                      className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:border-red-300 hover:text-red-600 disabled:opacity-50 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
