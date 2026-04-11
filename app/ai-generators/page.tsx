import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";
import GeneratorsGrid from "@/components/generators/GeneratorsGrid";

export const metadata: Metadata = {
  title: "Free AI Generators — 20+ Tools | AI Tools Station",
  description:
    "20+ free AI generators for resumes, cover letters, blog posts, emails, business plans and more. Professional quality in seconds.",
  alternates: { canonical: "https://www.aitoolsstation.com/ai-generators" },
};

export default async function AIGeneratorsPage() {
  const supabase = createAdminClient();

  const { data: generators } = await supabase
    .from("generators")
    .select("slug, title, description, category, meta_description")
    .eq("is_active", true)
    .order("created_at");

  const list = generators ?? [];

  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      {/* Hero */}
      <section className="text-center py-8 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Free AI Generators</h1>
        <p className="text-base text-gray-600 max-w-2xl mx-auto mb-4">
          Professional-quality content in seconds. No signup required for your first 3 uses.
        </p>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
          <span>✦ {list.length}+ AI Generators</span>
          <span>✦ Free to start</span>
          <span>✦ &lt;30s Generation</span>
        </div>
      </section>

      {/* Filter Tabs + Grid (client component) */}
      <GeneratorsGrid generators={list} />

      {/* Compare & Alternatives links */}
      <div className="flex flex-wrap gap-3 mt-8 mb-6">
        <Link
          href="/compare/ai-resume-generator-vs-chatgpt"
          className="inline-flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm transition-all bg-white"
        >
          ⚖️ Compare AI Tools →
        </Link>
        <Link
          href="/alternatives/jasper-ai-alternatives"
          className="inline-flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm transition-all bg-white"
        >
          🔄 Find Alternatives →
        </Link>
      </div>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-8 text-center text-white">
        <h2 className="text-2xl font-bold mb-2">Want 600+ AI Tools?</h2>
        <p className="text-indigo-100 mb-6">
          Explore our full toolkit library — resumes, marketing, legal, business, and more.
        </p>
        <Link
          href="/toolkits"
          className="inline-block bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-colors"
        >
          Explore All Toolkits →
        </Link>
      </section>
    </main>
  );
}
