import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI SaaS Products | AI Tools Hub",
  description: "Discover our collection of AI-powered micro-SaaS products",
};

export default async function SaasListPage() {
  const supabase = createAdminClient();

  const { data: projects } = await supabase
    .from("saas_projects")
    .select("id, name, slug, domain, tagline, seo_pages_count, created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .then((res) => res, () => ({ data: null }));

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">AI SaaS Products</h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Discover our collection of AI-powered micro-SaaS products built to save you time.
        </p>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">No products available yet. Check back soon.</p>
          <Link
            href="/toolkits"
            className="inline-block mt-6 bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Browse AI Tools →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {projects.map((p) => (
            <div key={p.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-lg font-bold text-gray-900 mb-1">{p.name}</h2>
              {p.tagline && (
                <p className="text-sm text-gray-500 mb-3 leading-relaxed">{p.tagline}</p>
              )}
              {p.domain && (
                <p className="text-xs text-gray-400 font-mono mb-4">{p.domain}</p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{p.seo_pages_count ?? 0} pages</span>
                <Link
                  href={`/saas/${p.slug}`}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  View →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
