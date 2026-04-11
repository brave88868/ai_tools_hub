import Link from "next/link";

const EXAMPLES = [
  { icon: "📄", label: "Resumes", href: "/ai-generators/resume" },
  { icon: "📣", label: "Marketing Copy", href: "/ai-generators/marketing-copy" },
  { icon: "📊", label: "Business Plans", href: "/ai-generators/business-plan" },
  { icon: "🃏", label: "Study Materials", href: "/ai-generators/flashcard" },
  { icon: "⚖️", label: "Legal Docs", href: "/toolkits/compliance-toolkit" },
  { icon: "💻", label: "SQL Queries", href: "/ai-generators/sql-query" },
];

export default function WhatYouCanCreate() {
  return (
    <section className="bg-white py-5 px-4 border-b border-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide shrink-0">
            Create:
          </span>
          {EXAMPLES.map((ex) => (
            <Link
              key={ex.label}
              href={ex.href}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-full text-sm text-gray-700 hover:text-indigo-700 transition-colors"
            >
              <span>{ex.icon}</span>
              <span className="font-medium">{ex.label}</span>
            </Link>
          ))}
          <Link
            href="/ai-generators"
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors ml-auto shrink-0"
          >
            600+ more →
          </Link>
        </div>
      </div>
    </section>
  );
}
