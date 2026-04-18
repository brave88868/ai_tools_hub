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
    .from("seo_problems")
    .select("seo_title, seo_description, problem")
    .eq("slug", slug)
    .single();

  if (!data) return { title: "Not Found" };

  const rawTitle = data.seo_title ?? data.problem;
  const title = rawTitle.replace(/ \| AI Tools Station$/, "");
  const description = data.seo_description ?? `A step-by-step AI-powered guide: ${data.problem}`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/problems/${slug}` },
    openGraph: { title, description, type: "article", url: `${SITE_URL}/problems/${slug}`, siteName: "AI Tools Station" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ProblemPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const [{ data }, { data: relatedTools }] = await Promise.all([
    supabase.from("seo_problems").select("*").eq("slug", slug).single(),
    supabase
      .from("tools")
      .select("slug, name, description, toolkits(slug, name)")
      .eq("is_active", true)
      .order("sort_order")
      .limit(4),
  ]);

  if (!data) notFound();

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: data.problem,
    description: data.seo_description ?? "",
    step: [
      { "@type": "HowToStep", position: 1, text: "Understand the requirements and gather your information" },
      { "@type": "HowToStep", position: 2, text: "Use an AI tool to generate a first draft" },
      { "@type": "HowToStep", position: 3, text: "Review, customise, and refine the output" },
      { "@type": "HowToStep", position: 4, text: "Finalise and implement your solution" },
    ],
  };

  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Guides", url: `${SITE_URL}/problems` },
    { name: data.problem, url: `${SITE_URL}/problems/${slug}` },
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
          <span className="text-gray-600 truncate">{data.problem}</span>
        </nav>

        <h1 className="text-2xl font-bold text-gray-900 mb-6 leading-snug capitalize">
          {data.seo_title?.replace(" | AI Tools Station", "") ?? data.problem}
        </h1>

        {/* Article content */}
        {data.content && (
          <article className="prose prose-sm max-w-none text-gray-700 prose-headings:text-gray-900 prose-headings:font-semibold prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline prose-li:text-gray-700 mb-10">
            <ReactMarkdown>{data.content}</ReactMarkdown>
          </article>
        )}

        {/* Related AI Tools */}
        {(relatedTools ?? []).length > 0 && (
          <section className="mb-10">
            <h2 className="text-base font-semibold text-gray-900 mb-4">AI Tools That Help</h2>
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
        <div className="bg-black text-white rounded-2xl p-6 text-center mb-8">
          <p className="font-semibold text-sm mb-1">Solve this faster with AI</p>
          <p className="text-gray-400 text-xs mb-4">3 free uses per day · No credit card required</p>
          <Link href="/toolkits" className="inline-block bg-white text-black px-5 py-2 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors">
            Start Free →
          </Link>
        </div>

        <InternalLinks currentSlug={slug} type="problem" />
      </main>
    </>
  );
}
