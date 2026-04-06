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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("seo_workflows")
    .select("seo_title, seo_description, workflow")
    .eq("slug", slug)
    .single();

  if (!data) return { title: "Not Found" };

  const title = data.seo_title ?? `${data.workflow} | AI Tools Station`;
  const description = data.seo_description ?? `A complete AI-powered workflow guide for ${data.workflow}`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/workflows/${slug}` },
    openGraph: { title, description, type: "article", url: `${SITE_URL}/workflows/${slug}`, siteName: "AI Tools Station" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function WorkflowPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const [{ data }, { data: relatedTools }] = await Promise.all([
    supabase.from("seo_workflows").select("*").eq("slug", slug).single(),
    supabase
      .from("tools")
      .select("slug, name, description, toolkits(slug, name)")
      .eq("is_active", true)
      .order("sort_order")
      .limit(6),
  ]);

  if (!data) notFound();

  const workflowTitle = data.seo_title?.replace(" | AI Tools Station", "") ?? data.workflow;

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: workflowTitle,
    description: data.seo_description ?? "",
    step: [
      { "@type": "HowToStep", position: 1, text: "Plan and define your goals for the workflow" },
      { "@type": "HowToStep", position: 2, text: "Set up your AI tools and inputs" },
      { "@type": "HowToStep", position: 3, text: "Run each step of the workflow with AI assistance" },
      { "@type": "HowToStep", position: 4, text: "Review outputs and iterate as needed" },
      { "@type": "HowToStep", position: 5, text: "Export, publish, or act on your final results" },
    ],
  };

  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Workflows", url: `${SITE_URL}/workflows` },
    { name: workflowTitle, url: `${SITE_URL}/workflows/${slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <main className="max-w-3xl mx-auto px-4 py-10">
        <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5">
          <Link href="/" className="hover:text-gray-600">Home</Link>
          <span>/</span>
          <Link href="/toolkits" className="hover:text-gray-600">AI Tools</Link>
          <span>/</span>
          <span className="text-gray-600 truncate">{workflowTitle}</span>
        </nav>

        <div className="mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
            AI Workflow
          </span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6 leading-snug">{workflowTitle}</h1>

        {/* Article content */}
        {data.content && (
          <article className="prose prose-sm max-w-none text-gray-700 prose-headings:text-gray-900 prose-headings:font-semibold prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline prose-li:text-gray-700 mb-10">
            <ReactMarkdown>{data.content}</ReactMarkdown>
          </article>
        )}

        {/* Tools used in this workflow */}
        {(relatedTools ?? []).length > 0 && (
          <section className="mb-10">
            <h2 className="text-base font-semibold text-gray-900 mb-4">AI Tools for This Workflow</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(relatedTools ?? []).map((tool) => {
                const toolkit = tool.toolkits as unknown as { slug: string; name: string } | null;
                return (
                  <Link
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    className="border border-gray-100 rounded-xl p-4 hover:border-indigo-200 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-600">{tool.name}</span>
                      {toolkit && <span className="text-xs text-gray-400 capitalize">{toolkit.name}</span>}
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{tool.description}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl p-6 text-center mb-8">
          <p className="font-semibold text-sm mb-1">Run this workflow with AI Tools Station</p>
          <p className="text-indigo-100 text-xs mb-4">400+ AI tools · Free to start · No credit card</p>
          <Link href="/toolkits" className="inline-block bg-white text-indigo-700 px-5 py-2 rounded-xl text-sm font-medium hover:bg-indigo-50 transition-colors">
            Get Started Free →
          </Link>
        </div>

        <InternalLinks currentSlug={slug} type="workflow" />
      </main>
    </>
  );
}
