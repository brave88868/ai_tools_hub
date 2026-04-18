import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase";
import ReactMarkdown from "react-markdown";

const SITE_URL = "https://www.aitoolsstation.com";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("generators")
    .select("meta_title, meta_description, title, description")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!data) return { title: "AI Generator" };

  const rawTitle = data.meta_title ?? `${data.title} — Free Online`;
  const title = rawTitle.replace(/ \| AI Tools Station$/, "");
  const description = data.meta_description ?? data.description ?? "";

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/ai-generators/${slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/ai-generators/${slug}`,
      siteName: "AI Tools Station",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function AIGeneratorPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const [{ data: gen }, { data: useCases }, { data: prompts }] = await Promise.all([
    supabase
      .from("generators")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single(),
    supabase
      .from("use_case_pages")
      .select("slug, title, persona")
      .eq("generator_slug", slug)
      .eq("is_active", true)
      .limit(5),
    supabase
      .from("prompt_pages")
      .select("slug, title")
      .eq("generator_slug", slug)
      .eq("is_active", true)
      .limit(3),
  ]);

  if (!gen) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: gen.title,
    applicationCategory: "BusinessApplication",
    description: gen.meta_description ?? gen.description,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    url: `${SITE_URL}/ai-generators/${slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-gray-600">Home</Link>
          <span>/</span>
          <Link href="/ai-generators" className="hover:text-gray-600">AI Generators</Link>
          <span>/</span>
          <span className="text-gray-600">{gen.title}</span>
        </nav>

        {/* Hero */}
        <section className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-8 mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{gen.title}</h1>
          <p className="text-lg text-gray-600 mb-6 leading-relaxed">
            {gen.meta_description ?? gen.description}
          </p>
          {gen.tool_slug && (
            <Link
              href={`/tools/${gen.tool_slug}`}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              Try {gen.title} Free →
            </Link>
          )}
          <p className="text-xs text-gray-400 mt-3">
            No account required · 3 free uses per day
          </p>
        </section>

        {/* Main content */}
        {gen.content && (
          <section className="prose prose-sm max-w-none text-gray-700 prose-headings:text-gray-900 prose-headings:font-semibold prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline prose-li:text-gray-700 mb-10">
            <ReactMarkdown>{gen.content}</ReactMarkdown>
          </section>
        )}

        {/* Use Cases */}
        {(useCases ?? []).length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-indigo-500 pl-3">
              Use Cases
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(useCases ?? []).map((uc) => (
                <Link
                  key={uc.slug}
                  href={`/use-cases/${uc.slug}`}
                  className="border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-700 hover:border-indigo-200 hover:text-indigo-600 transition-all"
                >
                  {uc.title}
                  {uc.persona && (
                    <span className="block text-xs text-gray-400 mt-0.5 capitalize">
                      {uc.persona}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Prompts */}
        {(prompts ?? []).length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-indigo-500 pl-3">
              Free AI Prompts
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(prompts ?? []).map((p) => (
                <Link
                  key={p.slug}
                  href={`/ai-prompts/${p.slug}`}
                  className="border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-700 hover:border-indigo-200 hover:text-indigo-600 transition-all"
                >
                  {p.title}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <section className="border border-gray-200 rounded-2xl p-6 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Ready to generate with AI?
          </h2>
          <p className="text-gray-600 mb-4 text-sm">
            Use {gen.title} — professional results in under 30 seconds.
          </p>
          {gen.tool_slug ? (
            <Link
              href={`/tools/${gen.tool_slug}`}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              Start for Free →
            </Link>
          ) : (
            <Link
              href="/toolkits"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              Explore All Tools →
            </Link>
          )}
        </section>
      </main>
    </>
  );
}

export const revalidate = 86400;
