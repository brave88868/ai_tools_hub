import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase";
import { getUseCases, getUseCase } from "@/lib/seo/loaders";
import { faqSchema, howToSchema, breadcrumbSchema } from "@/lib/seo/schemas";
import FAQSection from "@/components/seo/FAQSection";
import Breadcrumb from "@/components/seo/Breadcrumb";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const useCases = getUseCases();
  return useCases.map((uc) => ({ slug: uc.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const uc = getUseCase(slug);
  if (!uc) return { title: "Not Found" };

  const siteUrl = "https://aitoolsstation.com";
  return {
    title: `${uc.title} | AI Tools Station`,
    description: uc.metaDescription,
    alternates: { canonical: `${siteUrl}/use-case/${slug}` },
    openGraph: {
      title: uc.title,
      description: uc.metaDescription,
      type: "article",
      url: `${siteUrl}/use-case/${slug}`,
    },
  };
}

export default async function UseCasePage({ params }: Props) {
  const { slug } = await params;
  const uc = getUseCase(slug);
  if (!uc) notFound();

  // Fetch recommended tool metadata from Supabase
  const supabase = createAdminClient();
  const { data: tools } = await supabase
    .from("tools")
    .select("slug, name, description, toolkits(slug)")
    .in("slug", uc.recommendedTools)
    .eq("is_active", true);

  // Preserve recommendedTools ordering
  const orderedTools = uc.recommendedTools
    .map((s) => tools?.find((t) => t.slug === s))
    .filter(Boolean) as NonNullable<typeof tools>;

  // Related use cases (up to 6, excluding current)
  const allUseCases = getUseCases();
  const related = allUseCases.filter((u) => u.slug !== slug).slice(0, 6);

  // Structured data
  const siteUrl = "https://aitoolsstation.com";
  const schemas = [
    howToSchema(uc.h1, uc.steps),
    faqSchema(uc.faqs),
    breadcrumbSchema([
      { name: "Home", url: siteUrl },
      { name: "Use Cases", url: `${siteUrl}/use-case` },
      { name: uc.title, url: `${siteUrl}/use-case/${slug}` },
    ]),
  ];

  return (
    <>
      {/* Structured data */}
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
              { name: "Use Cases", href: "/use-case" },
              { name: uc.title, href: `/use-case/${slug}` },
            ]}
          />
        </div>

        {/* Hero */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-4">
            {uc.h1}
          </h1>
          <p className="text-gray-500 text-base md:text-lg leading-relaxed max-w-2xl">
            {uc.intro}
          </p>
        </header>

        {/* Recommended Tools */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Recommended AI Tools
          </h2>
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
          <h2 className="text-xl font-bold text-gray-900 mb-5">
            How to Get Started
          </h2>
          <ol className="space-y-4">
            {uc.steps.map((step, i) => (
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
          <FAQSection faqs={uc.faqs} />
        </section>

        {/* Related Use Cases */}
        {related.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Related Use Cases
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {related.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/use-case/${rel.slug}`}
                  className="border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:border-indigo-200 hover:text-indigo-600 transition-all"
                >
                  {rel.title.split(":")[0]}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
