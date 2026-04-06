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
    .from("seo_guides")
    .select("seo_title, seo_description, guide_topic")
    .eq("slug", slug)
    .single();

  if (!data) return { title: "Not Found" };

  const title = data.seo_title ?? `${data.guide_topic} | AI Tools Station`;
  const description = data.seo_description ?? `Step-by-step guide: ${data.guide_topic}.`;
  return {
    title, description,
    alternates: { canonical: `${SITE_URL}/guides/${slug}` },
    openGraph: { title, description, type: "article", url: `${SITE_URL}/guides/${slug}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("seo_guides")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!data) notFound();

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: data.guide_topic,
    description: data.seo_description,
    url: `${SITE_URL}/guides/${slug}`,
  };

  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Guides", url: `${SITE_URL}/guides` },
    { name: data.guide_topic, url: `${SITE_URL}/guides/${slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <main className="max-w-3xl mx-auto px-4 py-10">
        <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5">
          <Link href="/" className="hover:text-gray-600">Home</Link>
          <span>/</span>
          <Link href="/guides" className="hover:text-gray-600">Guides</Link>
          <span>/</span>
          <span className="text-gray-600 truncate">{data.guide_topic}</span>
        </nav>

        <h1 className="text-2xl font-bold text-gray-900 mb-6 leading-snug">{data.guide_topic}</h1>

        {/* CTA */}
        {data.tool_slug && (
          <div className="flex flex-wrap gap-3 mb-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <p className="text-sm text-gray-700 w-full font-medium">
              Follow this guide with AI assistance — free to start
            </p>
            <Link
              href={`/tools/${data.tool_slug}`}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Try the AI Tool →
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

        <InternalLinks currentSlug={slug} type="guide" />
      </main>
    </>
  );
}
