"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import ReactMarkdown from "react-markdown";

type FeatureStatus = "open" | "planned" | "in_progress" | "released";
type SortMode = "votes" | "newest" | "trending";

interface Feature {
  id: string;
  title: string;
  description: string | null;
  toolkit: string | null;
  votes: number;
  status: FeatureStatus;
  created_at: string;
}

const STATUS_BADGE: Record<FeatureStatus, string> = {
  open: "bg-gray-100 text-gray-600",
  planned: "bg-blue-100 text-blue-600",
  in_progress: "bg-yellow-100 text-yellow-700",
  released: "bg-green-100 text-green-700",
};

const STATUS_LABEL: Record<FeatureStatus, string> = {
  open: "Open",
  planned: "Planned",
  in_progress: "In Progress",
  released: "Released",
};

const TOOLKITS = ["jobseeker", "creator", "marketing", "business", "legal", "exam"];

function daysSince(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
}

function trendingScore(f: Feature): number {
  return f.votes * 2 + 1 / (daysSince(f.created_at) + 1);
}

export default function FeaturesPage() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [votingId, setVotingId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Sort
  const [sort, setSort] = useState<SortMode>("votes");

  // AI Analyze
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analysisOpen, setAnalysisOpen] = useState(false);

  // Submit form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [toolkit, setToolkit] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("features")
        .select("*")
        .order("votes", { ascending: false });
      setFeatures((data as Feature[]) ?? []);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const [votesRes, roleRes] = await Promise.all([
          supabase.from("feature_votes").select("feature_id").eq("user_id", user.id),
          supabase.from("users").select("role").eq("id", user.id).single(),
        ]);
        setVotedIds(
          new Set((votesRes.data ?? []).map((v: { feature_id: string }) => v.feature_id))
        );
        setIsAdmin(roleRes.data?.role === "admin");
      }
      setLoading(false);
    }
    load();
  }, []);

  const sortedFeatures = useMemo(() => {
    const copy = [...features];
    if (sort === "votes") return copy.sort((a, b) => b.votes - a.votes);
    if (sort === "newest")
      return copy.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    // trending
    return copy.sort((a, b) => trendingScore(b) - trendingScore(a));
  }, [features, sort]);

  async function handleVote(featureId: string) {
    if (!userId) {
      alert("Please log in to vote.");
      return;
    }
    if (votedIds.has(featureId)) return;
    setVotingId(featureId);
    const res = await fetch("/api/features/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feature_id: featureId }),
    });
    if (res.ok) {
      setFeatures((prev) =>
        prev.map((f) => (f.id === featureId ? { ...f, votes: f.votes + 1 } : f))
      );
      setVotedIds((prev) => new Set([...prev, featureId]));
    }
    setVotingId(null);
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch("/api/features/analyze", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data.analysis);
        setAnalysisOpen(true);
      }
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setSubmitMsg("");
    const res = await fetch("/api/features/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, toolkit: toolkit || null }),
    });
    if (res.ok) {
      setSubmitMsg("✓ Feature request submitted! Thank you.");
      setTitle("");
      setDescription("");
      setToolkit("");
      const { data } = await supabase
        .from("features")
        .select("*")
        .order("votes", { ascending: false });
      setFeatures((data as Feature[]) ?? []);
    } else {
      const data = await res.json();
      setSubmitMsg(
        data.error === "Login required"
          ? "Please log in to submit."
          : "Submit failed. Please try again."
      );
    }
    setSubmitting(false);
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Feature Requests</h1>
          <p className="text-gray-500 text-sm">Vote for features you want most. We build what you need.</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            {analyzing ? "Analysing…" : "✦ AI Analyze"}
          </button>
        )}
      </div>

      {/* AI Analysis block (admin only) */}
      {analysis && (
        <div className="border border-indigo-200 bg-indigo-50 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
              AI Analysis Report
            </span>
            <button
              onClick={() => setAnalysisOpen((o) => !o)}
              className="text-xs text-indigo-500 hover:text-indigo-700"
            >
              {analysisOpen ? "Collapse ▲" : "Expand ▼"}
            </button>
          </div>
          {analysisOpen && (
            <div className="prose prose-sm prose-indigo max-w-none text-gray-700">
              <ReactMarkdown>{analysis}</ReactMarkdown>
            </div>
          )}
        </div>
      )}

      {/* Submit form */}
      <div className="border border-gray-200 rounded-2xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Submit a Feature Request</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Feature title *"
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-gray-400"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the feature (optional)"
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 resize-none focus:outline-none focus:border-gray-400"
          />
          <div className="flex gap-2">
            <select
              value={toolkit}
              onChange={(e) => setToolkit(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-gray-400"
            >
              <option value="">All toolkits</option>
              {TOOLKITS.map((t) => (
                <option key={t} value={t} className="capitalize">
                  {t.charAt(0).toUpperCase() + t.slice(1)} Toolkit
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </div>
          {submitMsg && <p className="text-xs text-gray-500">{submitMsg}</p>}
        </form>
      </div>

      {/* Sort tabs */}
      <div className="flex items-center gap-1 mb-4">
        {(
          [
            { key: "votes", label: "Most Votes" },
            { key: "newest", label: "Newest" },
            { key: "trending", label: "Trending" },
          ] as { key: SortMode; label: string }[]
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSort(key)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              sort === key
                ? "bg-black text-white"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Feature list */}
      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
      ) : sortedFeatures.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-gray-200 rounded-2xl">
          <p className="text-gray-400 text-sm">No feature requests yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedFeatures.map((feature) => {
            const voted = votedIds.has(feature.id);
            const status = (feature.status ?? "open") as FeatureStatus;
            return (
              <div
                key={feature.id}
                className="border border-gray-200 rounded-xl p-4 flex items-start gap-4"
              >
                {/* Vote button */}
                <button
                  onClick={() => handleVote(feature.id)}
                  disabled={voted || votingId === feature.id || !userId}
                  className={`flex flex-col items-center min-w-[44px] px-2 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                    voted
                      ? "border-black bg-black text-white"
                      : "border-gray-200 text-gray-600 hover:border-gray-400"
                  } disabled:cursor-not-allowed`}
                >
                  <span className="text-base leading-none mb-0.5">▲</span>
                  <span>{votingId === feature.id ? "…" : feature.votes}</span>
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-medium text-gray-900">{feature.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[status]}`}>
                      {STATUS_LABEL[status]}
                    </span>
                    {feature.toolkit && (
                      <span className="text-xs text-gray-400 capitalize">{feature.toolkit}</span>
                    )}
                  </div>
                  {feature.description && (
                    <p className="text-xs text-gray-400 leading-relaxed">{feature.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!userId && (
        <p className="mt-6 text-center text-xs text-gray-400">
          <a href="/login" className="underline hover:text-gray-600">
            Log in
          </a>{" "}
          to vote or submit feature requests.
        </p>
      )}
    </main>
  );
}
