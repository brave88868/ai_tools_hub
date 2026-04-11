"use client";

import { useState } from "react";
import Link from "next/link";

// Keys match actual DB category values
const CATEGORY_LABELS: Record<string, string> = {
  all:           "All",
  marketing:     "Marketing",
  education:     "Education",
  business:      "Business",
  creators:      "Creators",
  developers:    "Developers",
  legal:         "Legal",
  productivity:  "Productivity",
  "job-seekers": "Job Seekers",
  other:         "Other",
};

const CATEGORY_ICONS: Record<string, string> = {
  marketing:     "📣",
  education:     "🎓",
  business:      "📊",
  creators:      "🎬",
  developers:    "💻",
  legal:         "⚖️",
  productivity:  "⚡",
  "job-seekers": "💼",
  other:         "🤖",
};

interface Generator {
  slug: string;
  title: string;
  description: string | null;
  meta_description: string | null;
  category: string | null;
}

interface Props {
  generators: Generator[];
}

export default function GeneratorsGrid({ generators }: Props) {
  const [active, setActive] = useState("all");

  const categories = [
    "all",
    ...Array.from(new Set(generators.map((g) => g.category ?? "other"))),
  ];

  const filtered =
    active === "all"
      ? generators
      : generators.filter((g) => (g.category ?? "other") === active);

  return (
    <>
      {/* Sticky Filter Tabs */}
      <div className="sticky top-14 z-10 bg-white border-b border-gray-100 py-3 px-4">
        <div className="max-w-6xl mx-auto flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                active === cat
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>
      </div>

      {/* Generator Grid */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((gen) => (
            <Link
              key={gen.slug}
              href={`/ai-generators/${gen.slug}`}
              className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5 transition-all group"
            >
              <div className="text-2xl mb-2">
                {CATEGORY_ICONS[gen.category ?? ""] ?? "🤖"}
              </div>
              <div className="font-semibold text-sm text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                {gen.title}
              </div>
              <div className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-2">
                {gen.meta_description ?? gen.description}
              </div>
              <div className="text-xs font-medium text-indigo-500">Try free →</div>
            </Link>
          ))}
        </div>

        {/* Compare & Alternatives links */}
        <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-gray-100">
          <Link
            href="/compare/ai-resume-generator-vs-chatgpt"
            className="inline-flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-indigo-300 hover:text-indigo-600 transition-all bg-white"
          >
            ⚖️ Compare AI Tools →
          </Link>
          <Link
            href="/alternatives/jasper-ai-alternatives"
            className="inline-flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-indigo-300 hover:text-indigo-600 transition-all bg-white"
          >
            🔄 Find Alternatives →
          </Link>
        </div>
      </div>
    </>
  );
}
