import { createAdminClient } from "@/lib/supabase";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/ui/CopyButton";

interface Props {
  params: Promise<{ category: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("ai_prompts")
    .select("title, use_case, keywords")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!data) return { title: "Prompt Not Found" };

  return {
    title: `${data.title} — Free AI Prompt | AI Tools Station`,
    description:
      data.use_case ||
      `Copy this AI prompt for ${data.title}. Free to use with ChatGPT or Claude.`,
    keywords: data.keywords?.join(", "),
  };
}

export default async function PromptDetailPage({ params }: Props) {
  const { category, slug } = await params;
  const supabase = createAdminClient();

  const { data: prompt } = await supabase
    .from("ai_prompts")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!prompt) notFound();

  // 相关 prompts（同 category）
  const { data: related } = await supabase
    .from("ai_prompts")
    .select("id, title, slug, use_case")
    .eq("category", category)
    .eq("is_active", true)
    .neq("slug", slug)
    .order("copy_count", { ascending: false })
    .limit(4);

  // 增加浏览计数（fire-and-forget）
  supabase.rpc("increment_prompt_views", { prompt_slug: slug }).then(() => {});

  const categoryName = category
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="bg-white">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-400">
            <Link href="/" className="hover:text-gray-700">Home</Link>
            <span>/</span>
            <Link href="/prompts" className="hover:text-gray-700">Prompts</Link>
            <span>/</span>
            <Link href={`/prompts/${category}`} className="hover:text-gray-700">
              {categoryName}
            </Link>
            <span>/</span>
            <span className="text-gray-700 truncate max-w-[200px]">{prompt.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                  {categoryName} Prompt
                </span>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  {prompt.difficulty}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{prompt.title}</h1>
              {prompt.use_case && (
                <p className="text-gray-500">{prompt.use_case}</p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                Copied {prompt.copy_count} times
              </p>
            </div>

            {/* Prompt Text */}
            <div className="rounded-2xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">📋 The Prompt</span>
                <CopyButton
                  text={prompt.prompt_text}
                  onCopy={() => {
                    fetch("/api/prompts/copy", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ slug }),
                    });
                  }}
                />
              </div>
              <div className="p-5">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 font-mono">
                  {prompt.prompt_text}
                </p>
              </div>
            </div>

            {/* Example Output */}
            {prompt.example_output && (
              <div className="rounded-2xl border border-green-200 bg-green-50 overflow-hidden">
                <div className="px-5 py-3 border-b border-green-100">
                  <span className="text-sm font-medium text-green-800">✨ Example Output</span>
                </div>
                <div className="p-5">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                    {prompt.example_output}
                  </p>
                </div>
              </div>
            )}

            {/* How to Use */}
            <div className="rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">How to Use This Prompt</h2>
              <ol className="space-y-3">
                {[
                  "Click the copy button above to copy the full prompt",
                  "Open ChatGPT, Claude, or any AI assistant",
                  "Paste the prompt and replace [PLACEHOLDERS] with your details",
                  "Press Enter and get professional results instantly",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* FAQ */}
            <div className="rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">FAQ</h2>
              <div className="space-y-4">
                {[
                  {
                    q: "Is this prompt free to use?",
                    a: "Yes, completely free. Copy and use it as many times as you want.",
                  },
                  {
                    q: "Which AI tools work with this prompt?",
                    a: "ChatGPT, Claude, Gemini, and most AI assistants. It works best with GPT-4 and Claude Sonnet.",
                  },
                  {
                    q: "Can I modify the prompt?",
                    a: "Absolutely. The placeholders are just starting points — customize them for your specific needs.",
                  },
                  {
                    q: "Want this automated?",
                    a: "Use our AI tool instead — it runs this prompt automatically with a simple form. No copy-pasting needed.",
                  },
                ].map((faq, i) => (
                  <div key={i} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                    <h3 className="font-medium text-sm text-gray-900 mb-1">{faq.q}</h3>
                    <p className="text-sm text-gray-500">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Use Tool CTA */}
            {prompt.tool_slug && (
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 text-center">
                <p className="text-sm font-semibold text-gray-900 mb-1">Skip the Copy-Paste</p>
                <p className="text-xs text-gray-500 mb-4">
                  Use our AI tool — it handles this prompt automatically
                </p>
                <Link
                  href={`/tools/${prompt.tool_slug}`}
                  className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Use the AI Tool →
                </Link>
                <p className="text-xs text-gray-400 mt-2">Free · No signup required</p>
              </div>
            )}

            {/* Related Prompts */}
            {related && related.length > 0 && (
              <div className="rounded-2xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  More {categoryName} Prompts
                </h3>
                <div className="space-y-2">
                  {related.map((r) => (
                    <Link
                      key={r.id}
                      href={`/prompts/${category}/${r.slug}`}
                      className="block p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <p className="text-xs text-gray-600 group-hover:text-indigo-600 font-medium line-clamp-1">
                        {r.title}
                      </p>
                      {r.use_case && (
                        <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{r.use_case}</p>
                      )}
                    </Link>
                  ))}
                </div>
                <Link
                  href={`/prompts/${category}`}
                  className="mt-3 text-xs text-indigo-600 hover:underline flex items-center gap-1"
                >
                  View all {categoryName} prompts →
                </Link>
              </div>
            )}

            {/* Keywords */}
            {prompt.keywords?.length > 0 && (
              <div className="rounded-2xl border border-gray-200 p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Related Topics
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {(prompt.keywords as string[]).map((kw) => (
                    <span key={kw} className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* General CTA */}
            {!prompt.tool_slug && (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-center">
                <p className="text-sm font-semibold text-gray-900 mb-1">Want more AI tools?</p>
                <p className="text-xs text-gray-500 mb-4">
                  Access 50+ professional AI tools — no copy-pasting required
                </p>
                <Link
                  href="/tools"
                  className="w-full inline-flex items-center justify-center gap-2 bg-black text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Browse AI Tools →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
