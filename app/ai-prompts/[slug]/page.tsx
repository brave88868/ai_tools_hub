import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase";
import { CopyButton } from "@/components/ui/CopyButton";

const SITE_URL = "https://www.aitoolsstation.com";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("prompt_pages")
    .select("meta_title, meta_description, title")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!data) return { title: "AI Prompt | AI Tools Station" };

  const title = data.meta_title ?? `${data.title} — Free | AI Tools Station`;
  const description = data.meta_description ?? `Copy and use this AI prompt for ${data.title.toLowerCase()}.`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/ai-prompts/${slug}` },
    openGraph: { title, description, url: `${SITE_URL}/ai-prompts/${slug}`, siteName: "AI Tools Station" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function AIPromptPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: page } = await supabase
    .from("prompt_pages")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!page) notFound();

  // Fetch generator + related prompts in parallel
  const [{ data: gen }, { data: related }] = await Promise.all([
    page.generator_slug
      ? supabase
          .from("generators")
          .select("title, tool_slug")
          .eq("slug", page.generator_slug)
          .single()
      : Promise.resolve({ data: null }),
    page.generator_slug
      ? supabase
          .from("prompt_pages")
          .select("slug, title")
          .eq("generator_slug", page.generator_slug)
          .eq("is_active", true)
          .neq("slug", slug)
          .limit(3)
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5 flex-wrap">
        <Link href="/" className="hover:text-gray-600">Home</Link>
        <span>/</span>
        <Link href="/ai-generators" className="hover:text-gray-600">AI Generators</Link>
        <span>/</span>
        {gen && page.generator_slug && (
          <>
            <Link href={`/ai-generators/${page.generator_slug}`} className="hover:text-gray-600">
              {gen.title}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-600 truncate max-w-[200px]">{page.title}</span>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-8 mb-10">
        <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-xs font-medium px-3 py-1 rounded-full mb-4">
          Free AI Prompt
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{page.title}</h1>
        {page.meta_description && (
          <p className="text-gray-600 leading-relaxed">{page.meta_description}</p>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Prompt Box */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900 border-l-4 border-indigo-500 pl-3">
                The Prompt
              </h2>
              <CopyButton text={page.prompt_text ?? ""} />
            </div>
            <div className="bg-gray-900 text-gray-100 rounded-xl p-5 font-mono text-sm leading-relaxed whitespace-pre-wrap">
              {page.prompt_text ?? "Prompt content coming soon..."}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Replace text in [BRACKETS] with your specific details before using.
            </p>
          </section>

          {/* Example Output */}
          {page.example_output && (
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 border-l-4 border-indigo-500 pl-3">
                Example Output
              </h2>
              <div className="border border-green-200 bg-green-50 rounded-xl p-5 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {page.example_output}
              </div>
            </section>
          )}

          {/* How to Use */}
          <section className="border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">How to Use This Prompt</h2>
            <ol className="space-y-3">
              {[
                "Click 'Copy' to copy the full prompt",
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
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Use AI Tool CTA */}
          {gen?.tool_slug && (
            <div className="border border-indigo-200 bg-indigo-50 rounded-xl p-5 text-center">
              <p className="text-sm font-semibold text-gray-900 mb-1">Skip the Copy-Paste</p>
              <p className="text-xs text-gray-500 mb-4">
                Use our AI tool — it handles this automatically
              </p>
              <Link
                href={`/tools/${gen.tool_slug}`}
                className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Use AI Tool →
              </Link>
              <p className="text-xs text-gray-400 mt-2">Free · No signup required</p>
            </div>
          )}

          {/* Related Prompts */}
          {(related ?? []).length > 0 && (
            <div className="border border-gray-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                {gen?.title ? `More ${gen.title} Prompts` : "Related Prompts"}
              </h3>
              <div className="space-y-2">
                {(related ?? []).map((p) => (
                  <Link
                    key={p.slug}
                    href={`/ai-prompts/${p.slug}`}
                    className="block p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <p className="text-xs text-gray-600 group-hover:text-indigo-600 font-medium line-clamp-2">
                      {p.title}
                    </p>
                  </Link>
                ))}
              </div>
              {page.generator_slug && (
                <Link
                  href={`/ai-generators/${page.generator_slug}`}
                  className="mt-3 text-xs text-indigo-600 hover:underline flex items-center gap-1"
                >
                  View generator page →
                </Link>
              )}
            </div>
          )}

          {/* General CTA */}
          {!gen?.tool_slug && (
            <div className="border border-gray-200 bg-gray-50 rounded-xl p-5 text-center">
              <p className="text-sm font-semibold text-gray-900 mb-1">Want more AI tools?</p>
              <p className="text-xs text-gray-500 mb-4">
                Access 600+ professional AI tools — no copy-pasting required
              </p>
              <Link
                href="/toolkits"
                className="w-full inline-flex items-center justify-center gap-2 bg-black text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Browse AI Tools →
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export const revalidate = 86400;
