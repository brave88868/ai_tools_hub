import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase";
import { getProfessions, getProfession } from "@/lib/seo/loaders";
import { faqSchema, howToSchema, breadcrumbSchema } from "@/lib/seo/schemas";
import FAQSection from "@/components/seo/FAQSection";
import Breadcrumb from "@/components/seo/Breadcrumb";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getProfessions().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = getProfession(slug);
  if (!p) return { title: "Not Found" };

  const siteUrl = "https://aitoolsstation.com";
  return {
    title: `${p.title} | AI Tools Hub`,
    description: p.metaDescription,
    alternates: { canonical: `${siteUrl}/ai-tools-for/${slug}` },
    openGraph: {
      title: p.title,
      description: p.metaDescription,
      type: "article",
      url: `${siteUrl}/ai-tools-for/${slug}`,
    },
  };
}

export default async function ProfessionPage({ params }: Props) {
  const { slug } = await params;
  const p = getProfession(slug);
  if (!p) notFound();

  // Fetch recommended tools from Supabase
  const supabase = createAdminClient();
  const { data: tools } = await supabase
    .from("tools")
    .select("slug, name, description, toolkits(slug)")
    .in("slug", p.recommendedTools)
    .eq("is_active", true);

  const orderedTools = p.recommendedTools
    .map((s) => tools?.find((t) => t.slug === s))
    .filter(Boolean) as NonNullable<typeof tools>;

  // Related professions (up to 6, excluding current)
  const allProfessions = getProfessions();
  const related = allProfessions.filter((r) => r.slug !== slug).slice(0, 6);

  const siteUrl = "https://aitoolsstation.com";
  const schemas = [
    howToSchema(p.h1, p.steps),
    faqSchema(p.faqs),
    breadcrumbSchema([
      { name: "Home", url: siteUrl },
      { name: "AI Tools For", url: `${siteUrl}/ai-tools-for` },
      { name: p.title, url: `${siteUrl}/ai-tools-for/${slug}` },
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
              { name: "AI Tools For", href: "/ai-tools-for" },
              { name: p.title, href: `/ai-tools-for/${slug}` },
            ]}
          />
        </div>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-4">
            {p.h1}
          </h1>
          <p className="text-gray-500 text-base md:text-lg leading-relaxed max-w-2xl">
            {p.intro}
          </p>
        </header>

        {/* Tool cards */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recommended Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orderedTools.map((tool) => {
              const toolkitSlug =
                Array.isArray(tool.toolkits)
                  ? (tool.toolkits[0] as { slug: string } | null)?.slug
                  : (tool.toolkits as { slug: string } | null)?.slug;
              const emoji =
                toolkitSlug === "jobseeker"
                  ? "💼"
                  : toolkitSlug === "creator"
                  ? "🎬"
                  : toolkitSlug === "marketing"
                  ? "📣"
                  : toolkitSlug === "business"
                  ? "📊"
                  : toolkitSlug === "legal"
                  ? "⚖️"
                  : "🎓";
              return (
                <div
                  key={tool.slug}
                  className="border border-gray-100 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50 transition-all group"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-lg flex items-center justify-center text-base flex-shrink-0">
                      {emoji}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {tool.name}
                      </h3>
                      <p className="text-xs text-gray-400 leading-relaxed mt-0.5 line-clamp-2">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/tools/${tool.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-600 transition-colors"
                  >
                    Try free →
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* Steps */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-5">How to Get Started</h2>
          <ol className="space-y-4">
            {p.steps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <div className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed pt-0.5">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ */}
        <section className="mb-10">
          <FAQSection faqs={p.faqs} />
        </section>

        {/* Related profession pages */}
        {related.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">AI Tools For Other Roles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {related.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/ai-tools-for/${rel.slug}`}
                  className="border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:border-indigo-200 hover:text-indigo-600 transition-all"
                >
                  {rel.title.replace(" in 2025", "").replace("Best AI Tools for ", "")}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
