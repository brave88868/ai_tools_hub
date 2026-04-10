import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Free AI Generators — 20+ Tools | AI Tools Station",
  description:
    "20+ free AI generators for resumes, cover letters, blog posts, emails, business plans and more. Professional quality in seconds.",
  alternates: { canonical: "https://www.aitoolsstation.com/ai-generators" },
};

const CATEGORY_LABELS: Record<string, string> = {
  career:     "Career",
  business:   "Business",
  marketing:  "Marketing",
  content:    "Content",
  hr:         "HR & Hiring",
  seo:        "SEO",
  productivity:"Productivity",
  education:  "Education",
  sales:      "Sales",
  legal:      "Legal",
};

const CATEGORY_ICONS: Record<string, string> = {
  career:     "💼",
  business:   "📊",
  marketing:  "📣",
  content:    "✍️",
  hr:         "👥",
  seo:        "🔍",
  productivity:"⚡",
  education:  "🎓",
  sales:      "📈",
  legal:      "⚖️",
};

export default async function AIGeneratorsPage() {
  const supabase = createAdminClient();

  const { data: generators } = await supabase
    .from("generators")
    .select("slug, title, description, category, meta_description")
    .eq("is_active", true)
    .order("created_at");

  const list = generators ?? [];

  // Group by category
  const grouped = list.reduce<Record<string, typeof list>>((acc, gen) => {
    const cat = gen.category ?? "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(gen);
    return acc;
  }, {});

  const categories = Object.keys(grouped);

  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      {/* Hero */}
      <section className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Free AI Generators
        </h1>
        <p className="text-base text-gray-600 max-w-2xl mx-auto">
          Professional-quality content in seconds. No signup required for your first 3 uses.
        </p>
      </section>

      {/* Stats bar */}
      <div className="flex flex-wrap justify-center gap-8 mb-8 py-4 border-y border-gray-100 bg-gray-50 rounded-xl">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{list.length}+</div>
          <div className="text-sm text-gray-500">AI Generators</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">Free</div>
          <div className="text-sm text-gray-500">To start</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">&lt;30s</div>
          <div className="text-sm text-gray-500">Generation time</div>
        </div>
      </div>

      {/* Generators by category */}
      {categories.map((cat) => (
        <section key={cat} className="mb-8">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-2xl">{CATEGORY_ICONS[cat] ?? "🤖"}</span>
            <h2 className="text-xl font-bold text-gray-900 border-l-4 border-indigo-500 pl-3">
              {CATEGORY_LABELS[cat] ?? cat}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {grouped[cat].map((gen) => (
              <Link
                key={gen.slug}
                href={`/ai-generators/${gen.slug}`}
                className="border border-gray-100 rounded-2xl p-5 bg-white hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5 transition-all group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{CATEGORY_ICONS[gen.category ?? ""] ?? "🤖"}</span>
                  <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {gen.title}
                  </h3>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 mb-3">
                  {gen.meta_description ?? gen.description}
                </p>
                <span className="text-xs font-medium text-indigo-500 group-hover:text-indigo-700 transition-colors">
                  Try free →
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {/* Bottom CTA */}
      <section className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-8 text-center text-white mt-4">
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
