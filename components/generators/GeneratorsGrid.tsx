"use client";

import { useState } from "react";
import Link from "next/link";

const CATEGORY_LABELS: Record<string, string> = {
  all:          "All",
  career:       "Career",
  business:     "Business",
  marketing:    "Marketing",
  content:      "Content",
  hr:           "HR & Hiring",
  seo:          "SEO",
  productivity: "Productivity",
  education:    "Education",
  sales:        "Sales",
  legal:        "Legal",
};

const CATEGORY_ICONS: Record<string, string> = {
  career:       "💼",
  business:     "📊",
  marketing:    "📣",
  content:      "✍️",
  hr:           "👥",
  seo:          "🔍",
  productivity: "⚡",
  education:    "🎓",
  sales:        "📈",
  legal:        "⚖️",
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

  const categories = ["all", ...Array.from(new Set(generators.map((g) => g.category ?? "other")))];

  const filtered = active === "all"
    ? generators
    : generators.filter((g) => (g.category ?? "other") === active);

  return (
    <>
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              active === cat
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
            }`}
          >
            {CATEGORY_LABELS[cat] ?? cat}
          </button>
        ))}
      </div>

      {/* Generator Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((gen) => (
          <Link
            key={gen.slug}
            href={`/ai-generators/${gen.slug}`}
            className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5 transition-all group"
          >
            <div className="text-2xl mb-2">
              {CATEGORY_ICONS[gen.category ?? ""] ?? "🤖"}
            </div>
            <div className="font-semibold text-sm text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors leading-snug">
              {gen.title}
            </div>
            <div className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
              {gen.meta_description ?? gen.description}
            </div>
            <div className="text-xs font-medium text-indigo-500 mt-2">Try free →</div>
          </Link>
        ))}
      </div>
    </>
  );
}
