"use client";

import { useState } from "react";

const CATEGORIES = [
  "Writing",
  "Image",
  "Video",
  "Coding",
  "Productivity",
  "Marketing",
  "Research",
  "Other",
];

const PRICING_OPTIONS = ["Free", "Freemium", "Paid"];

export default function SubmitToolPage() {
  const [form, setForm] = useState({
    name: "",
    website: "",
    description: "",
    category: "",
    pricing: "",
    submitter_email: "",
    affiliate_link: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/submit-tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      setSubmitted(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="py-20 bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanks for submitting!</h1>
          <p className="text-gray-700 text-sm mb-6">
            We&apos;ll review your tool and get back to you shortly. Most reviews are completed
            within 2–3 business days.
          </p>
          <a
            href="/"
            className="inline-block bg-black text-white text-sm px-6 py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="max-w-xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <a href="/" className="text-xs text-gray-400 hover:text-gray-600 mb-4 inline-block">
            ← Back to AI Tools Station
          </a>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit Your AI Tool</h1>
          <p className="text-gray-700 text-sm">
            Share your AI tool with our community. We review every submission and publish tools
            that match our quality standards.
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tool Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tool Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="e.g. ResumeAI"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website URL <span className="text-red-500">*</span>
            </label>
            <input
              name="website"
              value={form.website}
              onChange={handleChange}
              required
              type="url"
              placeholder="https://yourtool.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="What does your tool do? Who is it for?"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Category + Pricing */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Select…</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pricing</label>
              <select
                name="pricing"
                value={form.pricing}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Select…</option>
                {PRICING_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Email</label>
            <input
              name="submitter_email"
              value={form.submitter_email}
              onChange={handleChange}
              type="email"
              placeholder="you@example.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-700 mt-1">
              We&apos;ll notify you when your tool goes live. Never shared.
            </p>
          </div>

          {/* Affiliate Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Affiliate / Partner Link{" "}
              <span className="text-gray-600 font-normal">(optional)</span>
            </label>
            <input
              name="affiliate_link"
              value={form.affiliate_link}
              onChange={handleChange}
              type="url"
              placeholder="https://yourtool.com?ref=aitoolsstation"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-700 mt-1">
              If you have a partner or affiliate link, we&apos;ll use it when linking to your tool.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors mt-2"
          >
            {submitting ? "Submitting…" : "Submit Tool →"}
          </button>
        </form>

        <p className="text-xs text-gray-700 text-center mt-6">
          By submitting, you confirm this tool is legitimate and you have the right to submit it.
        </p>
      </div>
    </div>
  );
}
