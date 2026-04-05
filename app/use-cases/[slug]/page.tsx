import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { createAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const SITE_URL = "https://aitoolsstation.com";

interface Props {
  params: Promise<{ slug: string }>;
}

interface SeoPagesRow {
  id: string;
  slug: string;
  type: string;
  title: string | null;
  seo_title: string | null;
  seo_description: string | null;
  content: string | null;
  tool_slug: string | null;
  meta: Record<string, string> | null;
  created_at: string;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("seo_pages")
    .select("seo_title, seo_description, title")
    .eq("slug", slug)
    .eq("type", "use_case")
    .maybeSingle();

  if (!data) {
    return { title: "AI Tool Use Case | AI Tools Hub" };
  }

  const title = data.seo_title ?? `${data.title} | AI Tools Hub`;
  const description = data.seo_description ?? "Discover how AI tools help professionals work smarter.";

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/use-cases/${slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/use-cases/${slug}`,
      siteName: "AI Tools Hub",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function UseCasePage({ params }: Props) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: page } = await supabase
    .from("seo_pages")
    .select("*")
    .eq("slug", slug)
    .eq("type", "use_case")
    .maybeSingle();

  if (!page) notFound();

  const row = page as unknown as SeoPagesRow;
  const profession = row.meta?.profession ?? "";

  const [{ data: tool }, { data: related }, { data: relatedTools }] = await Promise.all([
    supabase
      .from("tools")
      .select("slug, name, description")
      .eq("slug", row.tool_slug ?? "")
      .maybeSingle(),
    supabase
      .from("seo_pages")
      .select("slug, title, meta")
      .eq("type", "use_case")
      .eq("tool_slug", row.tool_slug ?? "")
      .neq("slug", slug)
      .limit(4),
    supabase
      .from("tools")
      .select("slug, name, description")
      .eq("is_active", true)
      .order("sort_order")
      .limit(4),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool?.name ?? row.tool_slug ?? "",
    applicationCategory: "BusinessApplication",
    description: row.seo_description ?? "",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    url: `${SITE_URL}/tools/${row.tool_slug}`,
  };

  const professionDisplay = profession
    ? profession.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : "";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-gray-600">Home</Link>
          <span>/</span>
          <Link href="/use-cases" className="hover:text-gray-600">Use Cases</Link>
          <span>/</span>
          <span className="text-gray-600 truncate">{row.title}</span>
        </nav>

        {/* H1 */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3 leading-snug">
          {row.title}
        </h1>

        {/* Sub-title */}
        {row.seo_description && (
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">{row.seo_description}</p>
        )}

        {/* Content */}
        {row.content && (
          <article className="prose prose-sm max-w-none text-gray-700 prose-headings:text-gray-900 prose-headings:font-semibold prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline prose-li:text-gray-700 mb-10">
            <ReactMarkdown>{row.content}</ReactMarkdown>
          </article>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl p-6 text-center text-white mb-8">
          <p className="font-semibold text-base mb-1">
            Try {tool?.name ?? row.tool_slug} Free
            {professionDisplay ? ` — Used by ${professionDisplay}s worldwide` : ""}
          </p>
          <p className="text-indigo-100 text-xs mb-4">
            No account required · 3 free uses per day
          </p>
          <Link
            href={`/tools/${row.tool_slug}`}
            className="inline-block bg-white text-indigo-600 px-5 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition-colors"
          >
            Start Free →
          </Link>
        </div>

        {/* Related Use Cases */}
        {(related ?? []).length > 0 && (
          <section className="mb-8">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              More Use Cases for {tool?.name ?? row.tool_slug}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(related ?? []).map((rel) => {
                const relMeta = rel.meta as Record<string, string> | null;
                return (
                  <Link
                    key={rel.slug}
                    href={`/use-cases/${rel.slug}`}
                    className="border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:border-indigo-200 hover:text-indigo-600 transition-all"
                  >
                    {rel.title ?? rel.slug}
                    {relMeta?.profession && (
                      <span className="block text-xs text-gray-400 mt-0.5 capitalize">
                        {relMeta.profession.replace(/-/g, " ")}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Related Tools */}
        {(relatedTools ?? []).length > 0 && (
          <section className="mb-8">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Related AI Tools</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(relatedTools ?? []).map((t) => (
                <Link
                  key={t.slug}
                  href={`/tools/${t.slug}`}
                  className="border border-gray-100 rounded-xl p-4 hover:border-indigo-200 hover:shadow-sm transition-all group"
                >
                  <div className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 mb-1">
                    {t.name}
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                    {t.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
