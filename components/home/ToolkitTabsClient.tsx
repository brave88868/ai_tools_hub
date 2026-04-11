"use client";

import { useState } from "react";
import Link from "next/link";

interface ToolkitItem {
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  price_monthly: number | null;
}

interface Group {
  label: string;
  slugs: string[];
}

interface Props {
  groups: Group[];
  toolkitMap: Record<string, ToolkitItem>;
  limit?: number;
}

export default function ToolkitTabsClient({ groups, toolkitMap, limit = 100 }: Props) {
  const [activeGroup, setActiveGroup] = useState(0);
  const [openAccordion, setOpenAccordion] = useState<number | null>(0);

  return (
    <div>
      {/* Desktop Tabs */}
      <div className="hidden md:flex flex-wrap gap-2 mb-8">
        {groups.map((group, i) => (
          <button
            key={group.label}
            onClick={() => setActiveGroup(i)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeGroup === i
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {group.label}
          </button>
        ))}
      </div>

      {/* Desktop Panel */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4">
        {groups[activeGroup].slugs
          .slice(0, limit)
          .filter((slug) => toolkitMap[slug])
          .map((slug) => {
            const kit = toolkitMap[slug];
            return (
              <Link
                key={slug}
                href={`/toolkits/${slug}`}
                className="border border-gray-100 rounded-2xl p-5 bg-white hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5 transition-all group block"
              >
                <div className="text-2xl mb-2">{kit.icon ?? "🛠"}</div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                  {kit.name}
                </h3>
                <p className="text-xs text-gray-700 leading-relaxed mb-3 line-clamp-1">
                  {kit.description}
                </p>
                <span className="text-xs font-medium text-indigo-500 group-hover:text-indigo-700 transition-colors">
                  Explore →
                </span>
              </Link>
            );
          })}
      </div>

      {/* Mobile Accordion */}
      <div className="md:hidden space-y-2">
        {groups.map((group, i) => (
          <div key={group.label} className="border border-gray-100 rounded-2xl overflow-hidden">
            <button
              onClick={() => setOpenAccordion(openAccordion === i ? null : i)}
              className="w-full text-left px-5 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-semibold text-gray-900">{group.label}</span>
              <span className={`text-gray-400 transition-transform ${openAccordion === i ? "rotate-180" : ""}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>
            {openAccordion === i && (
              <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50">
                {group.slugs
                  .filter((slug) => toolkitMap[slug])
                  .map((slug) => {
                    const kit = toolkitMap[slug];
                    return (
                      <Link
                        key={slug}
                        href={`/toolkits/${slug}`}
                        className="border border-gray-100 rounded-xl p-3 bg-white hover:border-indigo-200 transition-all group block"
                      >
                        <div className="text-xl mb-1">{kit.icon ?? "🛠"}</div>
                        <h3 className="text-xs font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                          {kit.name}
                        </h3>
                      </Link>
                    );
                  })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
