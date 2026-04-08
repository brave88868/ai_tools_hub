import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { createAdminClient } from "@/lib/supabase";
import { breadcrumbSchema } from "@/lib/seo/schemas";
import InternalLinks from "@/components/seo/InternalLinks";
import { CopyButton } from "@/components/ui/CopyButton";

interface Props {
  params: Promise<{ slug: string }>;
}

const SITE_URL = "https://www.aitoolsstation.com";

export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();

  // 优先查 generated_examples（UGC）
  const { data: ugc } = await supabase
    .from("generated_examples")
    .select("title, keywords, tool_slug")
    .eq("slug", slug)
    .eq("is_public", true)
    .single();

  if (ugc) {
    const toolName = ugc.tool_slug.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
    return {
      title: `${ugc.title} | AI Generated Example`,
      description: `Real AI-generated example: ${ugc.title}. See how ${toolName} works and create your own for free.`,
      keywords: ugc.keywords?.join(", "),
      alternates: { canonical: `${SITE_URL}/examples/${slug}` },
      openGraph: { title: ugc.title, description: `AI-generated example using ${toolName}`, type: "article" },
    };
  }

  // Fallback: seo_examples（程序化 SEO）
  const { data } = await supabase
    .from("seo_examples")
    .select("seo_title, seo_description, example_type")
    .eq("slug", slug)
    .single();

  if (!data) return { title: "Not Found" };

  const title = data.seo_title ?? `${data.example_type} Examples | AI Tools Station`;
  const description = data.seo_description ?? `Real AI-generated examples: ${data.example_type}.`;
  return {
    title, description,
    alternates: { canonical: `${SITE_URL}/examples/${slug}` },
    openGraph: { title, description, type: "article", url: `${SITE_URL}/examples/${slug}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ExamplePage({ params }: Props) {
  const { slug } = await params;
  const supabase = createAdminClient();

  // ── 优先：generated_examples（UGC）────────────────────────────────────
  const { data: ugc } = await supabase
    .from("generated_examples")
    .select("*")
    .eq("slug", slug)
    .eq("is_public", true)
    .single();

  if (ugc) {
    // 增加浏览计数（fire-and-forget）
    supabase.rpc("increment_example_views", { example_slug: slug }).then(() => {});

    const { data: related } = await supabase
      .from("generated_examples")
      .select("id, title, slug")
      .eq("tool_slug", ugc.tool_slug)
      .eq("is_public", true)
      .neq("slug", slug)
      .order("created_at", { ascending: false })
      .limit(3);

    const toolName = ugc.tool_slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l: string) => l.toUpperCase());

    return (
      <div className="min-h-screen bg-white">
        {/* Breadcrumb */}
        <div className="border-b border-gray-100 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 py-3">
            <nav className="flex items-center gap-2 text-sm text-gray-400 flex-wrap">
              <Link href="/" className="hover:text-gray-700">Home</Link>
              <span>/</span>
              <Link href="/examples" className="hover:text-gray-700">Examples</Link>
              <span>/</span>
              <Link href={`/examples?tool=${ugc.tool_slug}`} className="hover:text-gray-700">{toolName}</Link>
              <span>/</span>
              <span className="text-gray-700 truncate max-w-[200px]">{ugc.title}</span>
            </nav>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 text-xs font-medium px-3 py-1 rounded-full mb-4">
              AI Generated Example
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{ugc.title}</h1>
            {ugc.keywords?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {ugc.keywords.map((kw: string) => (
                  <span key={kw} className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">{kw}</span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
                  <span className="text-sm font-medium text-gray-600">Generated Output</span>
                  <CopyButton text={ugc.content} />
                </div>
                <div className="p-5">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 font-mono">{ugc.content}</div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {[
                    { q: `What is this ${toolName} example?`, a: `A real AI-generated output from our ${toolName}. It shows what the tool produces for real use cases.` },
                    { q: "Can I use this output for free?", a: "Yes — start with 3 free uses per day, no credit card required." },
                    { q: "How do I generate my own version?", a: `Click "Try ${toolName}", fill in your details, and get a personalised result in seconds.` },
                    { q: "Is the output customisable?", a: "Absolutely. Each generation is unique to your inputs." },
                  ].map((faq, i) => (
                    <div key={i} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                      <h3 className="font-medium text-sm text-gray-900 mb-1">{faq.q}</h3>
                      <p className="text-sm text-gray-500">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 text-center">
                <p className="text-sm font-semibold text-gray-900 mb-1">Generate Your Own</p>
                <p className="text-xs text-gray-500 mb-4">Create a personalised version with {toolName} in seconds</p>
                <Link
                  href={`/tools/${ugc.tool_slug}`}
                  className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Try {toolName} →
                </Link>
                <p className="text-xs text-gray-400 mt-2">Free · No signup required</p>
              </div>

              {related && related.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">More {toolName} Examples</h3>
                  <div className="space-y-2">
                    {related.map((r) => (
                      <Link
                        key={r.id}
                        href={`/examples/${r.slug}`}
                        className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                      >
                        <span className="text-gray-400 group-hover:text-indigo-500 mt-0.5">↗</span>
                        <span className="text-xs text-gray-500 group-hover:text-gray-900 line-clamp-2">{r.title}</span>
                      </Link>
                    ))}
                  </div>
                  <Link href={`/examples?tool=${ugc.tool_slug}`} className="mt-3 text-xs text-indigo-600 hover:underline flex items-center gap-1">
                    View all examples →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Fallback：seo_examples（程序化 SEO）───────────────────────────────
  const { data } = await supabase
    .from("seo_examples")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!data) notFound();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: data.seo_title ?? data.example_type,
    description: data.seo_description,
    url: `${SITE_URL}/examples/${slug}`,
    publisher: { "@type": "Organization", name: "AI Tools Station", url: SITE_URL },
  };

  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Examples", url: `${SITE_URL}/examples` },
    { name: data.example_type, url: `${SITE_URL}/examples/${slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <main className="max-w-3xl mx-auto px-4 py-10">
        <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5">
          <Link href="/" className="hover:text-gray-600">Home</Link>
          <span>/</span>
          <Link href="/examples" className="hover:text-gray-600">Examples</Link>
          <span>/</span>
          <span className="text-gray-600 truncate">{data.example_type}</span>
        </nav>

        <h1 className="text-2xl font-bold text-gray-900 mb-6 leading-snug">{data.example_type}</h1>

        {data.tool_slug && (
          <div className="flex flex-wrap gap-3 mb-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <p className="text-sm text-gray-700 w-full font-medium">Create your own with AI — free to start</p>
            <Link href={`/tools/${data.tool_slug}`} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              Try the AI Tool →
            </Link>
            <Link href="/toolkits" className="border border-indigo-200 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors">
              Browse All Tools
            </Link>
          </div>
        )}

        {data.content && (
          <article className="prose prose-sm max-w-none text-gray-700 prose-headings:text-gray-900 prose-headings:font-semibold prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline prose-li:text-gray-700 mb-10">
            <ReactMarkdown>{data.content}</ReactMarkdown>
          </article>
        )}

        <InternalLinks currentSlug={slug} type="example" />
      </main>
    </>
  );
}
