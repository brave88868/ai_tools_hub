import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";

interface Props {
  params: Promise<{ slug: string }>;
}

interface SaasProject {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  tagline: string | null;
  description: string | null;
  keyword: string | null;
  primary_tool_slug: string | null;
  seo_pages_count: number;
  status: string;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("saas_projects")
    .select("name, tagline")
    .eq("slug", slug)
    .single();

  if (!data) return { title: "Not Found" };
  return {
    title: `${data.name} — Free AI Tool`,
    description: data.tagline ?? `${data.name} powered by AI`,
  };
}

export default async function SaasLandingPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: project } = await supabase
    .from("saas_projects")
    .select("id, name, slug, domain, tagline, description, keyword, primary_tool_slug, seo_pages_count, status")
    .eq("slug", slug)
    .single();

  if (!project) notFound();

  const p = project as SaasProject;

  // Load related SEO pages
  const toolSlugForPages = p.primary_tool_slug ?? p.slug;
  const { data: seoPages } = await supabase
    .from("seo_pages")
    .select("slug, title, seo_title")
    .eq("tool_slug", toolSlugForPages)
    .eq("type", "saas_page")
    .limit(12);

  // Build 3 feature bullets from description
  const desc = p.description ?? "";
  const sentences = desc.split(/\.|\n/).map((s) => s.trim()).filter(Boolean);
  const features = [
    { title: "AI-Powered", body: sentences[0] ?? `${p.name} uses cutting-edge AI to deliver results instantly.` },
    { title: "Free to Start", body: "No credit card required. Start generating results in seconds with our free plan." },
    { title: "Professional Results", body: sentences[1] ?? "Optimized outputs that save you hours of manual work every week." },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: p.name,
    description: p.tagline ?? p.description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    url: p.domain ? `https://${p.domain}` : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 text-white">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          {p.domain && (
            <p className="text-indigo-200 text-sm mb-3 font-mono">{p.domain}</p>
          )}
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">{p.name}</h1>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">{p.tagline}</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/toolkits"
              className="bg-white text-indigo-700 font-semibold px-7 py-3 rounded-xl hover:bg-indigo-50 transition-colors"
            >
              Try for Free →
            </Link>
            <Link
              href="/pricing"
              className="border border-white/40 text-white font-semibold px-7 py-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
          Why Choose {p.name}?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <div className="w-4 h-4 bg-indigo-600 rounded-sm" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Simple Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Free</h3>
              <div className="text-3xl font-extrabold text-gray-900 mb-4">$0</div>
              <ul className="space-y-2 text-sm text-gray-500 mb-8">
                <li>✓ 3 uses per day</li>
                <li>✓ All core features</li>
                <li>✓ No credit card required</li>
              </ul>
              <Link
                href="/login"
                className="block text-center border border-gray-300 text-gray-700 font-medium py-2.5 rounded-xl hover:border-indigo-400 hover:text-indigo-600 transition-colors"
              >
                Get Started Free
              </Link>
            </div>
            {/* Pro */}
            <div className="bg-indigo-600 text-white rounded-2xl p-8">
              <h3 className="text-lg font-bold mb-1">Pro</h3>
              <div className="text-3xl font-extrabold mb-4">$9<span className="text-lg font-normal text-indigo-200">/mo</span></div>
              <ul className="space-y-2 text-sm text-indigo-100 mb-8">
                <li>✓ 100 uses per day</li>
                <li>✓ All AI tools included</li>
                <li>✓ Priority support</li>
                <li>✓ Cancel anytime</li>
              </ul>
              <Link
                href="/pricing"
                className="block text-center bg-white text-indigo-700 font-semibold py-2.5 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Pages */}
      {seoPages && seoPages.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Learn More</h2>
          <p className="text-gray-400 text-sm mb-8">Guides and resources powered by {p.name}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {seoPages.map((page) => (
              <Link
                key={page.slug}
                href={`/use-cases/${page.slug}`}
                className="bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors truncate"
              >
                {page.seo_title ?? page.title ?? page.slug}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Footer CTA */}
      <section className="border-t border-gray-100 py-12">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-gray-400 text-sm mb-4">
            Powered by{" "}
            <Link href="/" className="text-indigo-600 hover:underline font-medium">
              AI Tools Hub
            </Link>
          </p>
          <Link
            href="/toolkits"
            className="inline-block bg-indigo-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Explore All AI Tools →
          </Link>
        </div>
      </section>
    </>
  );
}
