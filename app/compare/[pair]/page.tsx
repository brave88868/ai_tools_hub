import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompares, getCompare } from "@/lib/seo/loaders";
import { faqSchema, breadcrumbSchema } from "@/lib/seo/schemas";
import FAQSection from "@/components/seo/FAQSection";
import Breadcrumb from "@/components/seo/Breadcrumb";

interface Props {
  params: Promise<{ pair: string }>;
}

export async function generateStaticParams() {
  return getCompares().map((c) => ({ pair: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pair } = await params;
  const c = getCompare(pair);
  if (!c) return { title: "Not Found" };

  const siteUrl = "https://aitoolsstation.com";
  return {
    title: `${c.title} | AI Tools Hub`,
    description: c.metaDescription,
    alternates: { canonical: `${siteUrl}/compare/${pair}` },
    openGraph: {
      title: c.title,
      description: c.metaDescription,
      type: "article",
      url: `${siteUrl}/compare/${pair}`,
    },
  };
}

export default async function ComparePage({ params }: Props) {
  const { pair } = await params;
  const c = getCompare(pair);
  if (!c) notFound();

  const allCompares = getCompares();
  const related = c.relatedSlugs
    .map((s) => allCompares.find((r) => r.slug === s))
    .filter(Boolean) as typeof allCompares;

  const siteUrl = "https://aitoolsstation.com";
  const schemas = [
    faqSchema(c.faqs),
    breadcrumbSchema([
      { name: "Home", url: siteUrl },
      { name: "Compare", url: `${siteUrl}/compare` },
      { name: c.title, url: `${siteUrl}/compare/${pair}` },
    ]),
  ];

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb
            items={[
              { name: "Home", href: "/" },
              { name: "Compare", href: "/compare" },
              { name: `${c.toolA.name} vs ${c.toolB.name}`, href: `/compare/${pair}` },
            ]}
          />
        </div>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-4">
            {c.h1}
          </h1>
          <p className="text-gray-500 text-base md:text-lg leading-relaxed">{c.intro}</p>
        </header>

        {/* Winner card */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-8">
          <div className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-1">
            Our Verdict
          </div>
          <div className="text-lg font-bold text-gray-900 mb-1">
            {c.winner === "depends" ? "It depends on your use case" : `${c.winner} wins`}
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{c.winnerReason}</p>
        </div>

        {/* Comparison table */}
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

        {/* Tool detail cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {[
            { tool: c.toolA, isOurs: false },
            { tool: c.toolB, isOurs: !!c.toolB.slug },
          ].map(({ tool, isOurs }) => (
            <div
              key={tool.name}
              className={`border rounded-2xl p-5 ${isOurs ? "border-indigo-200 bg-indigo-50/30" : "border-gray-200"}`}
            >
              {isOurs && (
                <div className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-2">
                  AI Tools Hub
                </div>
              )}
              <h3 className="text-base font-bold text-gray-900 mb-1">{tool.name}</h3>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">{tool.tagline}</p>

              <div className="mb-3">
                <div className="text-xs font-semibold text-green-600 mb-1">Pros</div>
                <ul className="space-y-1">
                  {tool.pros.map((p, i) => (
                    <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                      <span className="text-green-500 flex-shrink-0">✓</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-3">
                <div className="text-xs font-semibold text-red-500 mb-1">Cons</div>
                <ul className="space-y-1">
                  {tool.cons.map((con, i) => (
                    <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                      <span className="text-red-400 flex-shrink-0">✗</span>
                      {con}
                    </li>
                  ))}
                </ul>
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
                <Link
                  href={`/tools/${tool.slug}`}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-600 transition-colors"
                >
                  Try free →
                </Link>
              )}
            </div>
          ))}
        </section>

        {/* FAQ */}
        <section className="mb-10">
          <FAQSection faqs={c.faqs} />
        </section>

        {/* Related comparisons */}
        {related.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Related Comparisons</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {related.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/compare/${rel.slug}`}
                  className="border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:border-indigo-200 hover:text-indigo-600 transition-all"
                >
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
