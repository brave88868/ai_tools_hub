import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { createAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const SITE_URL = "https://www.aitoolsstation.com";

interface Props {
  params: Promise<{ slug: string }>;
}

// ── Slug type detection ───────────────────────────────────────────────────────
function detectType(slug: string): "comparison" | "alternative" | "problem" | "usecase" | null {
  if (slug.includes("-vs-")) return "comparison";
  if (slug.endsWith("-alternatives")) return "alternative";
  if (slug.startsWith("how-to-")) return "problem";
  if (slug.startsWith("ai-") && slug.includes("-for-")) return "usecase";
  return null;
}

// ── generateMetadata ──────────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const type = detectType(slug);
  if (!type) return { title: "Not Found" };

  const supabase = createAdminClient();

  if (type === "comparison") {
    const { data } = await supabase
      .from("seo_comparisons")
      .select("seo_title, seo_description, tool_a, tool_b")
      .eq("flat_slug", slug)
      .maybeSingle();
    if (!data) return { title: "Not Found" };
    const title = data.seo_title ?? `${data.tool_a} vs ${data.tool_b} | AI Tools Station`;
    const description = data.seo_description ?? `Compare ${data.tool_a} and ${data.tool_b}`;
    return {
      title, description,
      alternates: { canonical: `${SITE_URL}/${slug}` },
      openGraph: { title, description, type: "article", url: `${SITE_URL}/${slug}` },
      twitter: { card: "summary_large_image", title, description },
    };
  }

  if (type === "alternative") {
    const { data } = await supabase
      .from("seo_alternatives")
      .select("seo_title, seo_description, tool_name")
      .eq("flat_slug", slug)
      .maybeSingle();
    if (!data) return { title: "Not Found" };
    const title = data.seo_title ?? `Best ${data.tool_name} Alternatives | AI Tools Station`;
    const description = data.seo_description ?? `Find the best ${data.tool_name} alternatives.`;
    return {
      title, description,
      alternates: { canonical: `${SITE_URL}/${slug}` },
      openGraph: { title, description, type: "article", url: `${SITE_URL}/${slug}` },
      twitter: { card: "summary_large_image", title, description },
    };
  }

  if (type === "problem") {
    const { data } = await supabase
      .from("seo_problems")
      .select("seo_title, seo_description, problem")
      .eq("flat_slug", slug)
      .maybeSingle();
    if (!data) return { title: "Not Found" };
    const title = data.seo_title ?? `${data.problem} | AI Tools Station`;
    const description = data.seo_description ?? `A step-by-step AI guide: ${data.problem}`;
    return {
      title, description,
      alternates: { canonical: `${SITE_URL}/${slug}` },
      openGraph: { title, description, type: "article", url: `${SITE_URL}/${slug}` },
      twitter: { card: "summary_large_image", title, description },
    };
  }

  // usecase
  const { data } = await supabase
    .from("seo_use_cases")
    .select("seo_title, seo_description, title")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return { title: "Not Found" };
  const title = data.seo_title ?? `${data.title} | AI Tools Station`;
  const description = data.seo_description ?? data.title ?? "";
  return {
    title, description,
    alternates: { canonical: `${SITE_URL}/${slug}` },
    openGraph: { title, description, type: "article", url: `${SITE_URL}/${slug}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function SlugPage({ params }: Props) {
  const { slug } = await params;
  const type = detectType(slug);
  if (!type) notFound();

  const supabase = createAdminClient();

  // ── Comparison ──────────────────────────────────────────────────────────────
  if (type === "comparison") {
    const { data } = await supabase
      .from("seo_comparisons")
      .select("*")
      .eq("flat_slug", slug)
      .maybeSingle();
    if (!data) notFound();

    const { data: related } = await supabase
      .from("seo_comparisons")
      .select("flat_slug, slug, tool_a, tool_b")
      .or(`tool_a.eq.${data.tool_a},tool_b.eq.${data.tool_b}`)
      .neq("flat_slug", slug)
      .not("flat_slug", "is", null)
      .limit(4);

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: `What is the difference between ${data.tool_a} and ${data.tool_b}?`,
          acceptedAnswer: { "@type": "Answer", text: `${data.tool_a} and ${data.tool_b} are both AI tools. Read our full comparison to find the best fit.` },
        },
        {
          "@type": "Question",
          name: `Which is better: ${data.tool_a} or ${data.tool_b}?`,
          acceptedAnswer: { "@type": "Answer", text: `The best choice depends on your use case. See our detailed comparison for features, pricing, pros and cons.` },
        },
      ],
    };

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <main className="max-w-3xl mx-auto px-4 py-10">
          <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5">
            <Link href="/" className="hover:text-gray-600">Home</Link>
            <span>/</span>
            <span className="text-gray-600 truncate">{data.tool_a} vs {data.tool_b}</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900 mb-6 leading-snug">
            {data.title ?? `${data.tool_a} vs ${data.tool_b}: Which AI Tool is Better?`}
          </h1>
          <div className="flex flex-wrap gap-3 mb-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <p className="text-sm text-gray-700 w-full font-medium">
              Try AI Tools Station — a powerful alternative, free to start
            </p>
            <Link href="/toolkits" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              Browse AI Tools →
            </Link>
            <Link href="/toolkits" className="border border-indigo-200 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors">
              View Pricing
            </Link>
          </div>
          {data.content && (
            <article className="prose prose-sm max-w-none text-gray-700 prose-headings:text-gray-900 prose-headings:font-semibold prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline prose-li:text-gray-700 mb-10">
              <ReactMarkdown>{data.content}</ReactMarkdown>
            </article>
          )}
          {(related ?? []).length > 0 && (
            <section className="mb-8">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Related Comparisons</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(related ?? []).map((rel) => (
                  <Link
                    key={rel.flat_slug ?? rel.slug}
                    href={`/${rel.flat_slug ?? rel.slug}`}
                    className="border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:border-indigo-200 hover:text-indigo-600 transition-all"
                  >
                    {rel.tool_a} vs {rel.tool_b}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>
      </>
    );
  }

  // ── Alternative ─────────────────────────────────────────────────────────────
  if (type === "alternative") {
    const { data } = await supabase
      .from("seo_alternatives")
      .select("*")
      .eq("flat_slug", slug)
      .maybeSingle();
    if (!data) notFound();

    const { data: related } = await supabase
      .from("seo_alternatives")
      .select("flat_slug, slug, tool_name")
      .neq("flat_slug", slug)
      .not("flat_slug", "is", null)
      .limit(4);

    const toolkits = [
      { name: "Jobseeker Toolkit", slug: "jobseeker", desc: "Resume, cover letters & LinkedIn" },
      { name: "Creator Toolkit", slug: "creator", desc: "YouTube, blog & social media" },
      { name: "Marketing Toolkit", slug: "marketing", desc: "Copy, ads & landing pages" },
      { name: "Business Toolkit", slug: "business", desc: "Plans, proposals & emails" },
    ];

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: data.title ?? `Best Alternatives to ${data.tool_name} in 2025`,
      description: data.seo_description ?? "",
      author: { "@type": "Organization", name: "AI Tools Station" },
      publisher: { "@type": "Organization", name: "AI Tools Station", url: SITE_URL },
      url: `${SITE_URL}/${slug}`,
      datePublished: data.created_at,
    };

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <main className="max-w-3xl mx-auto px-4 py-10">
          <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5">
            <Link href="/" className="hover:text-gray-600">Home</Link>
            <span>/</span>
            <span className="text-gray-600 truncate">{data.tool_name} Alternatives</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-snug">
            {data.title ?? `Best Alternatives to ${data.tool_name} in 2025`}
          </h1>
          {data.content && (
            <article className="prose prose-sm max-w-none text-gray-700 prose-headings:text-gray-900 prose-headings:font-semibold prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline prose-li:text-gray-700 mb-10">
              <ReactMarkdown>{data.content}</ReactMarkdown>
            </article>
          )}
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
              <Link href="/toolkits" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                View pricing →
              </Link>
            </div>
          </section>
          {(related ?? []).length > 0 && (
            <section className="mb-8">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Related Alternatives</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(related ?? []).map((rel) => (
                  <Link
                    key={rel.flat_slug ?? rel.slug}
                    href={`/${rel.flat_slug ?? rel.slug}`}
                    className="border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:border-indigo-200 hover:text-indigo-600 transition-all"
                  >
                    Best {rel.tool_name} Alternatives
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>
      </>
    );
  }

  // ── Problem ──────────────────────────────────────────────────────────────────
  if (type === "problem") {
    const [{ data }, { data: relatedTools }] = await Promise.all([
      supabase.from("seo_problems").select("*").eq("flat_slug", slug).maybeSingle(),
      supabase
        .from("tools")
        .select("slug, name, description, toolkits(slug, name)")
        .eq("is_active", true)
        .order("sort_order")
        .limit(4),
    ]);
    if (!data) notFound();

    const { data: related } = await supabase
      .from("seo_problems")
      .select("flat_slug, slug, problem")
      .neq("flat_slug", slug)
      .not("flat_slug", "is", null)
      .limit(4);

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

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
        <main className="max-w-3xl mx-auto px-4 py-10">
          <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5">
            <Link href="/" className="hover:text-gray-600">Home</Link>
            <span>/</span>
            <span className="text-gray-600 truncate">{data.problem}</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900 mb-6 leading-snug capitalize">
            {data.seo_title?.replace(" | AI Tools Station", "") ?? data.problem}
          </h1>
          {data.content && (
            <article className="prose prose-sm max-w-none text-gray-700 prose-headings:text-gray-900 prose-headings:font-semibold prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline prose-li:text-gray-700 mb-10">
              <ReactMarkdown>{data.content}</ReactMarkdown>
            </article>
          )}
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
          <div className="bg-black text-white rounded-2xl p-6 text-center mb-8">
            <p className="font-semibold text-sm mb-1">Use AI to do this automatically</p>
            <p className="text-gray-400 text-xs mb-4">3 free uses per day · No credit card required</p>
            <Link href="/toolkits" className="inline-block bg-white text-black px-5 py-2 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors">
              Start Free →
            </Link>
          </div>
          {(related ?? []).length > 0 && (
            <section className="mb-8">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Related Guides</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(related ?? []).map((rel) => (
                  <Link
                    key={rel.flat_slug ?? rel.slug}
                    href={`/${rel.flat_slug ?? rel.slug}`}
                    className="border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:border-indigo-200 hover:text-indigo-600 transition-all"
                  >
                    {rel.problem}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>
      </>
    );
  }

  // ── Use Case ─────────────────────────────────────────────────────────────────
  const { data } = await supabase
    .from("seo_use_cases")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) notFound();

  // Fetch tool info for CTA
  const { data: tool } = await supabase
    .from("tools")
    .select("slug, name")
    .eq("slug", data.tool_slug)
    .maybeSingle();

  // Related use cases (same tool, different professions)
  const { data: related } = await supabase
    .from("seo_use_cases")
    .select("slug, title, profession")
    .eq("tool_slug", data.tool_slug)
    .neq("slug", slug)
    .limit(4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool?.name ?? data.tool_slug,
    applicationCategory: "BusinessApplication",
    description: data.seo_description ?? data.title ?? "",
    url: `${SITE_URL}/tools/${data.tool_slug}`,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5">
          <Link href="/" className="hover:text-gray-600">Home</Link>
          <span>/</span>
          <Link href={`/tools/${data.tool_slug}`} className="hover:text-gray-600 capitalize">
            {tool?.name ?? data.tool_slug}
          </Link>
          <span>/</span>
          <span className="text-gray-600 truncate capitalize">{data.profession.replace(/-/g, " ")}</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900 mb-3 leading-snug">
          {data.title}
        </h1>
        {data.seo_description && (
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">{data.seo_description}</p>
        )}
        {data.content && (
          <article className="prose prose-sm max-w-none text-gray-700 prose-headings:text-gray-900 prose-headings:font-semibold prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline prose-li:text-gray-700 mb-10">
            <ReactMarkdown>{data.content}</ReactMarkdown>
          </article>
        )}
        {/* CTA */}
        <div className="bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl p-6 text-center text-white mb-8">
          <p className="font-semibold text-base mb-1">
            Try {tool?.name ?? data.tool_slug} free →
          </p>
          <p className="text-indigo-100 text-xs mb-4">No account required · 3 free uses per day</p>
          <Link
            href={`/tools/${data.tool_slug}`}
            className="inline-block bg-white text-indigo-600 px-5 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition-colors"
          >
            Use {tool?.name ?? data.tool_slug} →
          </Link>
        </div>
        {/* Related use cases */}
        {(related ?? []).length > 0 && (
          <section className="mb-8">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              More Use Cases for {tool?.name ?? data.tool_slug}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(related ?? []).map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/${rel.slug}`}
                  className="border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:border-indigo-200 hover:text-indigo-600 transition-all"
                >
                  {rel.title}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
