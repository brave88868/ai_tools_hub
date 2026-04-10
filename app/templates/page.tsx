import { createAdminClient } from "@/lib/supabase";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Free AI Templates — Resumes, Emails & More | AI Tools Station",
  description:
    "Download free professional templates for resumes, emails, business plans, and more. Customise instantly with AI.",
};

interface Props {
  searchParams: Promise<{ category?: string }>;
}

export default async function TemplatesPage({ searchParams }: Props) {
  const { category } = await searchParams;
  const admin = createAdminClient();

  // 分类列表
  const { data: categoryRows } = await admin
    .from("tool_templates")
    .select("category")
    .eq("is_active", true);

  const uniqueCategories = [
    ...new Set((categoryRows ?? []).map((c) => c.category)),
  ];

  // 模板列表
  let query = admin
    .from("tool_templates")
    .select("id, tool_slug, title, slug, category, description, download_count")
    .eq("is_active", true)
    .order("download_count", { ascending: false })
    .limit(48);

  if (category) query = query.eq("category", category);

  const { data: templates } = await query;

  const formatCategory = (cat: string) =>
    cat.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="bg-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Free Templates</h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Professional templates ready to download. Customise with AI in seconds.
          </p>
        </div>

        {/* Category Filter */}
        {uniqueCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <Link
              href="/templates"
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                !category
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </Link>
            {uniqueCategories.map((cat) => (
              <Link
                key={cat}
                href={`/templates?category=${cat}`}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  category === cat
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {formatCategory(cat)}
              </Link>
            ))}
          </div>
        )}

        {/* Templates Grid */}
        {templates && templates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((t) => (
              <Link
                key={t.id}
                href={`/templates/${t.slug}`}
                className="group rounded-xl border border-gray-200 bg-white p-5 hover:border-indigo-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {formatCategory(t.category)}
                  </span>
                  {t.download_count > 0 && (
                    <span className="text-xs text-gray-400">
                      ↓ {t.download_count}
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-sm text-gray-900 mb-1.5 group-hover:text-indigo-600 transition-colors">
                  {t.title}
                </h3>
                {t.description && (
                  <p className="text-xs text-gray-400 line-clamp-2">{t.description}</p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg mb-2">No templates yet.</p>
            <p className="text-sm">Templates are generated automatically — check back soon!</p>
            <Link
              href="/toolkits"
              className="mt-4 inline-block bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Browse AI Tools →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
