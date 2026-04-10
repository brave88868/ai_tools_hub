import { createAdminClient } from "@/lib/supabase";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Free AI Prompts Library — 1000+ Ready-to-Use Prompts | AI Tools Station",
  description:
    "Browse 1000+ free AI prompts for resumes, emails, marketing, business plans and more. Copy and paste into ChatGPT or Claude.",
};

const CATEGORIES = [
  { slug: "resume", label: "Resume", emoji: "📄", desc: "Write standout resumes for any role" },
  { slug: "email", label: "Email", emoji: "✉️", desc: "Professional emails for every situation" },
  { slug: "marketing", label: "Marketing", emoji: "📣", desc: "Ads, copy, social media and more" },
  { slug: "cover-letter", label: "Cover Letter", emoji: "💼", desc: "Land more interviews" },
  { slug: "business-plan", label: "Business Plan", emoji: "📊", desc: "Launch your business idea" },
  { slug: "legal", label: "Legal Docs", emoji: "⚖️", desc: "Contracts, policies, agreements" },
  { slug: "youtube", label: "YouTube", emoji: "🎬", desc: "Scripts, titles, descriptions" },
  { slug: "meeting-notes", label: "Meeting Notes", emoji: "📝", desc: "Summaries and action items" },
];

export default async function PromptsPage() {
  const supabase = createAdminClient();

  const { data: counts } = await supabase
    .from("ai_prompts")
    .select("category")
    .eq("is_active", true);

  const countMap: Record<string, number> = {};
  counts?.forEach((r) => {
    countMap[r.category] = (countMap[r.category] || 0) + 1;
  });

  const total = Object.values(countMap).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-b from-indigo-50 to-white border-b border-indigo-100">
        <div className="max-w-5xl mx-auto px-4 py-14 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Free AI Prompts Library
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto mb-2">
            {total > 0 ? `${total}+` : "1000+"} ready-to-use prompts for ChatGPT and Claude.
            Copy, paste, done.
          </p>
          <p className="text-sm text-gray-400">No signup. No credit card. Free forever.</p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/prompts/${cat.slug}`}
              className="group rounded-2xl border border-gray-200 bg-white p-6 hover:border-indigo-300 hover:shadow-md transition-all text-center"
            >
              <div className="text-3xl mb-3">{cat.emoji}</div>
              <h2 className="font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                {cat.label} Prompts
              </h2>
              <p className="text-xs text-gray-500 mb-3">{cat.desc}</p>
              {countMap[cat.slug] > 0 && (
                <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                  {countMap[cat.slug]} prompts
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* SEO text */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 max-w-2xl mx-auto">
            All prompts are free to copy and use. Designed to work with ChatGPT, Claude, Gemini, and any AI assistant.
            Replace the <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">[PLACEHOLDERS]</span> with your specific details for best results.
          </p>
        </div>
      </div>
    </div>
  );
}
