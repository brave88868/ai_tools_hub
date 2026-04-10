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

const SITE_URL = "https://www.aitoolsstation.com";

export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("seo_alternatives")
    .select("seo_title, seo_description, tool_name")
    .eq("slug", slug)
    .single();

  if (!data) return { title: "Not Found" };

  const title = data.seo_title ?? `Best Alternatives to ${data.tool_name} | AI Tools Station`;
  const description = data.seo_description ?? `Find the best ${data.tool_name} alternatives. Compare features, pricing and use cases.`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/alternatives/${slug}` },
    openGraph: { title, description, type: "article", url: `${SITE_URL}/alternatives/${slug}`, siteName: "AI Tools Station" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function AlternativesPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("seo_alternatives")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!data) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: data.title ?? `Best Alternatives to ${data.tool_name}`,
    description: data.seo_description ?? "",
    author: { "@type": "Organization", name: "AI Tools Station" },
    publisher: { "@type": "Organization", name: "AI Tools Station", url: SITE_URL },
    url: `${SITE_URL}/alternatives/${slug}`,
    datePublished: data.created_at,
  };

  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Alternatives", url: `${SITE_URL}/alternatives` },
    { name: `${data.tool_name} Alternatives`, url: `${SITE_URL}/alternatives/${slug}` },
  ]);

  // Toolkit CTAs
  const toolkits = [
    { name: "Jobseeker Toolkit", slug: "jobseeker", desc: "Resume, cover letters & LinkedIn" },
    { name: "Creator Toolkit", slug: "creator", desc: "YouTube, blog & social media" },
    { name: "Marketing Toolkit", slug: "marketing", desc: "Copy, ads & landing pages" },
    { name: "Business Toolkit", slug: "business", desc: "Plans, proposals & emails" },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5">
          <Link href="/" className="hover:text-gray-600">Home</Link>
          <span>/</span>
          <Link href="/toolkits" className="hover:text-gray-600">Tools</Link>
          <span>/</span>
          <span className="text-gray-600 truncate">{data.tool_name} Alternatives</span>
        </nav>

        <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-snug">
          {data.title ?? `Best Alternatives to ${data.tool_name} in 2025`}
        </h1>

        {/* Article content */}
        {data.content ? (
          <article className="prose prose-sm max-w-none text-gray-700 prose-headings:text-gray-900 prose-headings:font-semibold prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline prose-li:text-gray-700 mb-10">
            <ReactMarkdown>{data.content}</ReactMarkdown>
          </article>
        ) : (
          <div className="mb-10 rounded-xl border border-gray-100 bg-gray-50 px-6 py-10 text-center text-gray-400 text-sm">
            Full alternatives guide coming soon — check back shortly.
          </div>
        )}

        {/* CTA — toolkit cards */}
        <section className="mb-10">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Try AI Tools Station — Free to Start</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {toolkits.map((tk) => (
              <Link
                key={tk.slug}
                href={`/toolkits/${tk.slug}`}
                className="border border-gray-100 rounded-xl p-4 hover:border-indigo-200 hover:shadow-sm transition-all group"
              >
                <div className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 mb-1">{tk.name}</div>
                <div className="text-xs text-gray-400">{tk.desc}</div>
              </Link>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Link href="/pricing" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              View pricing →
            </Link>
          </div>
        </section>

        <InternalLinks currentSlug={slug} type="alternative" />
      </main>
    </>
  );
}
