"use client";

import { useState, useEffect } from "react";

interface Props {
  toolSlug: string;
  onSuccess?: () => void;
}

const SUBMITTED_KEY = "email_capture_submitted";

export default function EmailCapture({ toolSlug, onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(SUBMITTED_KEY) === "1") {
      setAlreadySubmitted(true);
    }
  }, []);

  if (alreadySubmitted) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/leads/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "tool_result", tool_slug: toolSlug }),
      });

      if (res.ok) {
        setSubmitted(true);
        localStorage.setItem(SUBMITTED_KEY, "1");
        onSuccess?.();
      } else {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="mt-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 flex items-center gap-2">
        <span className="text-green-500">✓</span>
        <span>Saved! Check your inbox for your results.</span>
      </div>
    );
  }

  return (
    <div className="mt-4 border border-gray-200 rounded-xl p-4">
      <p className="text-sm font-medium text-gray-900 mb-1">Save your results — enter your email</p>
      <p className="text-xs text-gray-600 mb-3">Free forever · No spam · Unsubscribe anytime</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {loading ? "Saving…" : "Save Results"}
        </button>
      </form>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}
