import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { createAdminClient } from "@/lib/supabase";
import { getCompare, getCompares } from "@/lib/seo/loaders";
import { faqSchema, breadcrumbSchema } from "@/lib/seo/schemas";
import FAQSection from "@/components/seo/FAQSection";
import Breadcrumb from "@/components/seo/Breadcrumb";
import InternalLinks from "@/components/seo/InternalLinks";

interface Props {
  params: Promise<{ slug: string }>;
}

const SITE_URL = "https://www.aitoolsstation.com";

export const dynamicParams = true;

export async function generateStaticParams() {
  return getCompares().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data: dbRow } = await supabase
    .from("seo_comparisons")
    .select("seo_title, seo_description, tool_a, tool_b")
    .eq("slug", slug)
    .single();

  if (dbRow) {
    const title = dbRow.seo_title ?? `${dbRow.tool_a} vs ${dbRow.tool_b} | AI Tools Station`;
    const description = dbRow.seo_description ?? `Compare ${dbRow.tool_a} and ${dbRow.tool_b}`;
    return {
      title, description,
      alternates: { canonical: `${SITE_URL}/compare/${slug}` },
      openGraph: { title, description, type: "article", url: `${SITE_URL}/compare/${slug}` },
      twitter: { card: "summary_large_image", title, description },
    };
  }

  const c = getCompare(slug);
  if (!c) return { title: "Not Found" };
  return {
    title: `${c.title} | AI Tools Station`,
    description: c.metaDescription,
    alternates: { canonical: `${SITE_URL}/compare/${slug}` },
    openGraph: { title: c.title, description: c.metaDescription, type: "article", url: `${SITE_URL}/compare/${slug}` },
  };
}

export default async function ComparePage({ params }: Props) {
  const { slug } = await params;
  const supabase = createAdminClient();

  // ── DB-backed page ─────────────────────────────────────────────────────────
  const { data: dbRow } = await supabase
    .from("seo_comparisons")
    .select("*")
    .eq("slug", slug)
    .single();

  if (dbRow) {
    const { data: related } = await supabase
      .from("seo_comparisons")
      .select("slug, title, tool_a, tool_b")
      .or(`tool_a.eq.${dbRow.tool_a},tool_b.eq.${dbRow.tool_b}`)
      .neq("slug", slug)
      .limit(4);

    const faqJsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: `What is the difference between ${dbRow.tool_a} and ${dbRow.tool_b}?`,
          acceptedAnswer: { "@type": "Answer", text: `${dbRow.tool_a} and ${dbRow.tool_b} are both AI tools with different strengths. Read our full comparison to find the best fit for your workflow.` },
        },
        {
          "@type": "Question",
          name: `Which is better: ${dbRow.tool_a} or ${dbRow.tool_b}?`,
          acceptedAnswer: { "@type": "Answer", text: `The best choice depends on your use case. Our detailed comparison covers features, pricing, pros and cons of both tools.` },
        },
      ],
    };

    const breadcrumb = breadcrumbSchema([
      { name: "Home", url: SITE_URL },
      { name: "Compare", url: `${SITE_URL}/compare` },
      { name: `${dbRow.tool_a} vs ${dbRow.tool_b}`, url: `${SITE_URL}/compare/${slug}` },
    ]);

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

        <main className="max-w-3xl mx-auto px-4 py-10">
          <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5">
            <Link href="/" className="hover:text-gray-600">Home</Link>
            <span>/</span>
            <Link href="/compare" className="hover:text-gray-600">Compare</Link>
            <span>/</span>
            <span className="text-gray-600 truncate">{dbRow.tool_a} vs {dbRow.tool_b}</span>
          </nav>

          <h1 className="text-2xl font-bold text-gray-900 mb-6 leading-snug">
            {dbRow.title ?? `${dbRow.tool_a} vs ${dbRow.tool_b}: Which is Better?`}
          </h1>

          {/* CTA */}
          <div className="flex flex-wrap gap-3 mb-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <p className="text-sm text-gray-700 w-full font-medium">Try AI Tools Station — a powerful alternative, free to start</p>
            <Link href="/toolkits" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              Browse AI Tools →
            </Link>
            <Link href="/pricing" className="border border-indigo-200 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors">
              View Pricing
            </Link>
          </div>

          {/* Article content */}
          {dbRow.content ? (
            <article className="prose prose-sm max-w-none text-gray-700 prose-headings:text-gray-900 prose-headings:font-semibold prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline prose-li:text-gray-700 mb-10">
              <ReactMarkdown>{dbRow.content}</ReactMarkdown>
            </article>
          ) : (
            <div className="mb-10 rounded-xl border border-gray-100 bg-gray-50 px-6 py-10 text-center text-gray-400 text-sm">
              Full comparison coming soon — check back shortly.
            </div>
          )}

          {/* Related comparisons */}
          {(related ?? []).length > 0 && (
            <section className="mb-8">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Related Comparisons</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(related ?? []).map((rel) => (
                  <Link key={rel.slug} href={`/compare/${rel.slug}`} className="border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:border-indigo-200 hover:text-indigo-600 transition-all">
                    {rel.title ?? `${rel.tool_a} vs ${rel.tool_b}`}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <InternalLinks currentSlug={slug} type="compare" />
        </main>
      </>
    );
  }

  // ── Static fallback ────────────────────────────────────────────────────────
  const c = getCompare(slug);
  if (!c) notFound();

  const allCompares = getCompares();
  const related = c.relatedSlugs
    .map((s) => allCompares.find((r) => r.slug === s))
    .filter(Boolean) as typeof allCompares;

  const schemas = [
    faqSchema(c.faqs),
    breadcrumbSchema([
      { name: "Home", url: SITE_URL },
      { name: "Compare", url: `${SITE_URL}/compare` },
      { name: c.title, url: `${SITE_URL}/compare/${slug}` },
    ]),
  ];

  return (
    <>
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-6">
          <Breadcrumb items={[
            { name: "Home", href: "/" },
            { name: "Compare", href: "/compare" },
            { name: `${c.toolA.name} vs ${c.toolB.name}`, href: `/compare/${slug}` },
          ]} />
        </div>
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-4">{c.h1}</h1>
          <p className="text-gray-500 text-base md:text-lg leading-relaxed">{c.intro}</p>
        </header>
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-8">
          <div className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-1">Our Verdict</div>
          <div className="text-lg font-bold text-gray-900 mb-1">
            {c.winner === "depends" ? "It depends on your use case" : `${c.winner} wins`}
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{c.winnerReason}</p>
        </div>
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Feature Comparison</h2>
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 w-2/5">Feature</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">{c.toolA.name}</th>
                  <th className="text-left px-4 py-3 font-semibold text-indigo-600">{c.toolB.name}</th>
                </tr>
              </thead>
              <tbody>
                {c.comparisonRows.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="px-4 py-3 text-gray-500 font-medium">{row.feature}</td>
                    <td className="px-4 py-3 text-gray-600">{row.a}</td>
                    <td className="px-4 py-3 text-gray-900">{row.b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {[{ tool: c.toolA, isOurs: false }, { tool: c.toolB, isOurs: !!c.toolB.slug }].map(({ tool, isOurs }) => (
            <div key={tool.name} className={`border rounded-2xl p-5 ${isOurs ? "border-indigo-200 bg-indigo-50/30" : "border-gray-200"}`}>
              {isOurs && <div className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-2">AI Tools Station</div>}
              <h3 className="text-base font-bold text-gray-900 mb-1">{tool.name}</h3>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">{tool.tagline}</p>
              <div className="mb-3">
                <div className="text-xs font-semibold text-green-600 mb-1">Pros</div>
                <ul className="space-y-1">{tool.pros.map((p, i) => <li key={i} className="text-xs text-gray-600 flex gap-1.5"><span className="text-green-500 flex-shrink-0">✓</span>{p}</li>)}</ul>
              </div>
              <div className="mb-3">
                <div className="text-xs font-semibold text-red-500 mb-1">Cons</div>
                <ul className="space-y-1">{tool.cons.map((con, i) => <li key={i} className="text-xs text-gray-600 flex gap-1.5"><span className="text-red-400 flex-shrink-0">✗</span>{con}</li>)}</ul>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Best for</span>
                  <span className="text-xs text-gray-600 text-right max-w-[60%]">{tool.bestFor}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Pricing</span>
                  <span className="text-xs font-medium text-gray-900">{tool.pricing}</span>
                </div>
              </div>
              {isOurs && tool.slug && (
                <Link href={`/tools/${tool.slug}`} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-600 transition-colors">Try free →</Link>
              )}
            </div>
          ))}
        </section>
        <section className="mb-10"><FAQSection faqs={c.faqs} /></section>
        {related.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Related Comparisons</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {related.map((rel) => (
                <Link key={rel.slug} href={`/compare/${rel.slug}`} className="border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:border-indigo-200 hover:text-indigo-600 transition-all">
                  {rel.toolA.name} vs {rel.toolB.name}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
