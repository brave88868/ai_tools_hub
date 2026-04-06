import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { createAdminClient } from "@/lib/supabase";
import { breadcrumbSchema } from "@/lib/seo/schemas";
import InternalLinks from "@/components/seo/InternalLinks";

interface Props {
  params: Promise<{ slug: string }>;
}

const SITE_URL = "https://aitoolsstation.com";

export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("seo_keyword_pages")
    .select("seo_title, seo_description, keyword")
    .eq("slug", slug)
    .single();

  if (!data) return { title: "Not Found" };

  const title = data.seo_title ?? `${data.keyword} | AI Tools Station`;
  const description = data.seo_description ?? `Find the best AI tool for ${data.keyword}.`;
  return {
    title, description,
    alternates: { canonical: `${SITE_URL}/tools/keyword/${slug}` },
    openGraph: { title, description, type: "website", url: `${SITE_URL}/tools/keyword/${slug}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function KeywordPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("seo_keyword_pages")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!data) notFound();

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: data.seo_title ?? data.keyword,
    description: data.seo_description,
    url: `${SITE_URL}/tools/keyword/${slug}`,
  };

  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Tools", url: `${SITE_URL}/tools` },
    { name: data.keyword, url: `${SITE_URL}/tools/keyword/${slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <main className="max-w-3xl mx-auto px-4 py-10">
        <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5">
          <Link href="/" className="hover:text-gray-600">Home</Link>
          <span>/</span>
          <Link href="/tools" className="hover:text-gray-600">Tools</Link>
          <span>/</span>
          <span className="text-gray-600 truncate">{data.keyword}</span>
        </nav>

        <h1 className="text-2xl font-bold text-gray-900 mb-6 leading-snug">{data.keyword}</h1>

        {/* CTA */}
        {data.tool_slug && (
          <div className="flex flex-wrap gap-3 mb-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <p className="text-sm text-gray-700 w-full font-medium">
              Try this AI tool free — no signup required
            </p>
            <Link
              href={`/tools/${data.tool_slug}`}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Try for Free →
            </Link>
            <Link
              href="/toolkits"
              className="border border-indigo-200 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors"
            >
              Browse All Tools
            </Link>
          </div>
        )}

        {data.content && (
          <article className="prose prose-sm max-w-none text-gray-700 prose-headings:text-gray-900 prose-headings:font-semibold prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline prose-li:text-gray-700 mb-10">
            <ReactMarkdown>{data.content}</ReactMarkdown>
          </article>
        )}

        <InternalLinks currentSlug={slug} type="tool" />
      </main>
    </>
  );
}
