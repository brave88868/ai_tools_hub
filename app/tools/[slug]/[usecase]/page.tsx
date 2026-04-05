import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase";

interface Props {
  params: Promise<{ slug: string; usecase: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, usecase } = await params;
  const profession = usecase.replace(/^for-/, "").replace(/-/g, " ");
  const supabase = createAdminClient();

  const [{ data: tool }, { data: uc }] = await Promise.all([
    supabase.from("tools").select("name, seo_title").eq("slug", slug).single(),
    supabase
      .from("tool_use_cases")
      .select("title, meta_description")
      .eq("slug", `${slug}-${usecase}`)
      .maybeSingle(),
  ]);

  const title =
    uc?.title ??
    `${tool?.name ?? slug} for ${profession} | AI Tools Hub`;
  const description =
    uc?.meta_description ??
    `AI-powered ${tool?.name ?? slug} optimised for ${profession}s. Get professional results in seconds — free to try.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://aitoolsstation.com/tools/${slug}/${usecase}`,
      siteName: "AI Tools Hub",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function UseCasePage({ params }: Props) {
  const { slug, usecase } = await params;
  const profession = usecase.replace(/^for-/, "").replace(/-/g, " ");
  const supabase = createAdminClient();

  const [{ data: tool }, { data: uc }, { data: relatedTools }] = await Promise.all([
    supabase
      .from("tools")
      .select("name, description, toolkits(slug, name)")
      .eq("slug", slug)
      .eq("is_active", true)
      .single(),
    supabase
      .from("tool_use_cases")
      .select("*")
      .eq("slug", `${slug}-${usecase}`)
      .maybeSingle(),
    supabase
      .from("tools")
      .select("slug, name")
      .neq("slug", slug)
      .eq("is_active", true)
      .limit(4),
  ]);

  if (!tool) notFound();

  const toolkit = tool.toolkits as unknown as { slug: string; name: string } | null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description: uc?.meta_description ?? tool.description ?? "",
    url: `https://aitoolsstation.com/tools/${slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-gray-600">Home</Link>
          <span>/</span>
          <Link href={`/tools/${slug}`} className="hover:text-gray-600 capitalize">{tool.name}</Link>
          <span>/</span>
          <span className="text-gray-600 capitalize">For {profession}</span>
        </nav>

        {/* Hero */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3 leading-tight capitalize">
          {uc?.title ?? `${tool.name} for ${profession}`}
        </h1>
        <p className="text-gray-500 text-base leading-relaxed max-w-2xl mb-8">
          {uc?.meta_description ??
            `Use AI-powered ${tool.name} tailored for ${profession}s. Get professional results in seconds — free to try.`}
        </p>

        {/* SEO content */}
        {uc?.content && (
          <div className="prose prose-sm max-w-none text-gray-600 prose-headings:text-gray-900 mb-10 space-y-4">
            {String(uc.content).split("\n\n").map((para: string, i: number) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-6 mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-gray-900 mb-1">
              Try {tool.name} for free
            </div>
            <div className="text-xs text-gray-400">No credit card required · 3 free uses per day</div>
          </div>
          <Link
            href={`/tools/${slug}`}
            className="inline-block bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            Use This Tool →
          </Link>
        </div>

        {/* Related Tools */}
        {relatedTools && relatedTools.length > 0 && (
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Related Tools</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {relatedTools.map((t) => (
                <Link
                  key={t.slug}
                  href={`/tools/${t.slug}`}
                  className="border border-gray-200 rounded-xl p-3 text-xs text-gray-600 hover:border-indigo-200 transition-colors text-center"
                >
                  {t.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Toolkit link */}
        {toolkit && (
          <p className="text-xs text-gray-400">
            Part of the{" "}
            <Link href={`/toolkits/${toolkit.slug}`} className="text-indigo-500 hover:underline">
              {toolkit.name}
            </Link>
          </p>
        )}
      </main>
    </>
  );
}
