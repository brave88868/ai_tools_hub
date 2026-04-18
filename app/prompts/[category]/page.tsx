import { createAdminClient } from "@/lib/supabase";
import type { Metadata } from "next";
import Link from "next/link";

interface Props {
  params: Promise<{ category: string }>;
}

const CATEGORY_META: Record<string, { title: string; description: string; h1: string }> = {
  resume: {
    title: "Best AI Resume Prompts (Copy & Use)",
    description: "50+ proven AI prompts for writing resumes. Copy and paste into ChatGPT or Claude. Free.",
    h1: "AI Resume Prompts",
  },
  email: {
    title: "Best AI Email Prompts (Copy & Use)",
    description: "50+ AI prompts for writing professional emails. Cold outreach, follow-ups, sales and more.",
    h1: "AI Email Writing Prompts",
  },
  marketing: {
    title: "Best AI Marketing Prompts (Copy & Use)",
    description: "50+ AI prompts for marketers. Ads, copy, captions, landing pages and more.",
    h1: "AI Marketing Prompts",
  },
  "business-plan": {
    title: "Best AI Business Plan Prompts",
    description: "AI prompts for writing business plans, pitch decks, and startup ideas.",
    h1: "AI Business Plan Prompts",
  },
  "cover-letter": {
    title: "Best AI Cover Letter Prompts",
    description: "AI prompts for writing cover letters that get interviews.",
    h1: "AI Cover Letter Prompts",
  },
  legal: {
    title: "Best AI Legal Document Prompts",
    description: "AI prompts for privacy policies, contracts, NDAs and more.",
    h1: "AI Legal Document Prompts",
  },
  youtube: {
    title: "Best AI YouTube Script Prompts",
    description: "AI prompts for writing YouTube scripts, titles, and descriptions.",
    h1: "AI YouTube Prompts",
  },
  "meeting-notes": {
    title: "Best AI Meeting Notes Prompts",
    description: "AI prompts for writing meeting summaries, action items, and agendas.",
    h1: "AI Meeting Notes Prompts",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const meta = CATEGORY_META[category];
  if (!meta) return { title: "AI Prompts | AI Tools Station" };
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: `https://www.aitoolsstation.com/prompts/${category}` },
  };
}

export default async function PromptsCategoryPage({ params }: Props) {
  const { category } = await params;
  const supabase = createAdminClient();

  const { data: prompts } = await supabase
    .from("ai_prompts")
    .select("id, title, slug, use_case, difficulty, copy_count, keywords")
    .eq("category", category)
    .eq("is_active", true)
    .order("copy_count", { ascending: false })
    .limit(50);

  // 未知分类才 404，已知分类空数据显示空状态
  const meta = CATEGORY_META[category] || {
    h1: `AI ${category.replace(/-/g, " ")} Prompts`,
    description: "",
    title: "",
  };

  const difficultyColor: Record<string, string> = {
    beginner: "bg-green-50 text-green-700",
    intermediate: "bg-yellow-50 text-yellow-700",
    advanced: "bg-red-50 text-red-700",
  };

  const isEmpty = !prompts || prompts.length === 0;

  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-b from-indigo-50 to-white border-b border-indigo-100">
        <div className="max-w-5xl mx-auto px-4 py-12 text-center">
          {!isEmpty && (
            <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-xs font-medium px-3 py-1 rounded-full mb-4">
              {prompts.length} Free Prompts
            </div>
          )}
          <h1 className="text-4xl font-bold text-gray-900 mb-3">{meta.h1}</h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Copy and paste into ChatGPT or Claude. Ready to use, no setup needed.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Category Nav */}
        <div className="flex flex-wrap gap-2 mb-8">
          {Object.keys(CATEGORY_META).map((cat) => (
            <Link
              key={cat}
              href={`/prompts/${cat}`}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                cat === category
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {isEmpty ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📝</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">{meta.h1}</h2>
            <p className="text-gray-500">No prompts yet — check back soon.</p>
            <Link
              href="/prompts"
              className="mt-6 inline-block text-sm text-indigo-600 hover:underline"
            >
              ← Browse all categories
            </Link>
          </div>
        ) : (
        <>
        {/* Prompts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {prompts.map((prompt) => (
            <Link
              key={prompt.id}
              href={`/prompts/${category}/${prompt.slug}`}
              className="group rounded-2xl border border-gray-200 bg-white p-5 hover:border-indigo-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    difficultyColor[prompt.difficulty] || difficultyColor.beginner
                  }`}
                >
                  {prompt.difficulty}
                </span>
                {prompt.copy_count > 0 && (
                  <span className="text-xs text-gray-400">{prompt.copy_count} copies</span>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1.5 group-hover:text-indigo-600 transition-colors">
                {prompt.title}
              </h3>
              {prompt.use_case && (
                <p className="text-xs text-gray-500 line-clamp-2">{prompt.use_case}</p>
              )}
              <div className="mt-3 flex items-center gap-1 text-xs text-indigo-600 font-medium">
                Copy prompt →
              </div>
            </Link>
          ))}
        </div>

        {/* SEO Text Block */}
        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            How to Use These {meta.h1}
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            Copy any prompt above and paste it into ChatGPT, Claude, or any AI assistant.
            Replace the placeholders (shown in [BRACKETS]) with your specific details.
            The more specific you are, the better the output.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            For best results, use our{" "}
            <Link href="/tools" className="text-indigo-600 hover:underline">
              AI tools
            </Link>{" "}
            — they use these prompts automatically so you don&apos;t have to copy-paste.
          </p>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
