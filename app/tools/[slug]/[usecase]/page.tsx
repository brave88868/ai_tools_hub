import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase";

interface Props {
  params: Promise<{ slug: string; usecase: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, usecase } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("tool_use_cases")
    .select("seo_title, seo_description, title")
    .eq("slug", `${slug}-${usecase}`)
    .single();

  if (!data) return { title: "AI Tool | AI Tools Hub" };

  return {
    title: data.seo_title ?? data.title ?? "AI Tool | AI Tools Hub",
    description: data.seo_description ?? undefined,
  };
}

export default async function UseCasePage({ params }: Props) {
  const { slug, usecase } = await params;
  const usecaseSlug = `${slug}-${usecase}`;

  const supabase = createAdminClient();

  const [{ data: page }, { data: tool }, { data: relatedTools }] = await Promise.all([
    supabase
      .from("tool_use_cases")
      .select("*")
      .eq("slug", usecaseSlug)
      .single(),
    supabase
      .from("tools")
      .select("name, description, toolkit_slug")
      .eq("slug", slug)
      .single(),
    supabase
      .from("tools")
      .select("slug, name")
      .neq("slug", slug)
      .limit(4),
  ]);

  if (!page) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool?.name ?? page.title,
    description: page.seo_description ?? page.content?.slice(0, 155),
    applicationCategory: "BusinessApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    url: `https://aitoolsstation.com/tools/${slug}/${usecase}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5">
          <Link href="/toolkits" className="hover:text-gray-600">Tools</Link>
          <span>/</span>
          <Link href={`/tools/${slug}`} className="hover:text-gray-600 capitalize">
            {tool?.name ?? slug}
          </Link>
          <span>/</span>
          <span className="text-gray-600 capitalize">{usecase.replace(/-/g, " ")}</span>
        </nav>

        {/* Hero */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{page.title}</h1>
        {page.seo_description && (
          <p className="text-gray-500 text-base mb-8 max-w-2xl">{page.seo_description}</p>
        )}

        {/* SEO content */}
        {page.content && (
          <div className="prose prose-sm max-w-none text-gray-600 mb-10 space-y-4">
            {page.content.split("\n\n").map((para: string, i: number) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-gray-900 mb-1">
              Try {tool?.name ?? slug} for free
            </div>
            <div className="text-xs text-gray-400">
              No account required · 3 free uses per day
            </div>
          </div>
          <Link
            href={`/tools/${slug}`}
            className="inline-block bg-black text-white text-sm px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-colors whitespace-nowrap"
          >
            Use This Tool →
          </Link>
        </div>

        {/* Related Tools */}
        {relatedTools && relatedTools.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-4">Related Tools</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {relatedTools.map((t) => (
                <Link
                  key={t.slug}
                  href={`/tools/${t.slug}`}
                  className="border border-gray-200 rounded-xl p-3 text-xs text-gray-600 hover:border-gray-400 transition-colors text-center"
                >
                  {t.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
