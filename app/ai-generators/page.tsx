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
    <>
      {/* Hero */}
      <section className="bg-gradient-to-r from-indigo-50 to-violet-50 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Free AI Generators</h1>
          <p className="text-gray-600 text-base mb-4">
            Professional-quality content in seconds. No signup required for first 3 uses.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <span><span className="font-bold text-gray-900">{list.length}+</span> AI Generators</span>
            <span><span className="font-bold text-gray-900">Free</span> To start</span>
            <span><span className="font-bold text-gray-900">&lt;30s</span> Generation time</span>
          </div>
        </div>
      </section>

      {/* Filter Tabs + Grid (client, includes sticky bar) */}
      <GeneratorsGrid generators={list} />

      {/* Bottom CTA */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <section className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Access 600+ AI Tools</h2>
          <p className="text-indigo-100 mb-6">
            Resumes · Marketing · Business · Legal · Coding
          </p>
          <Link
            href="/toolkits"
            className="inline-block bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-colors"
          >
            Explore All Toolkits →
          </Link>
        </section>
      </div>
    </>
  );
}
