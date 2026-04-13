import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";
import Pagination from "@/components/Pagination";

export const metadata: Metadata = {
  title: "Blog | AI Tools Station",
  description:
    "AI tool guides, tips, and tutorials. Learn how to use AI tools for resume optimization, content creation, marketing, and more.",
  alternates: {
    canonical: "https://www.aitoolsstation.com/blog",
  },
};

const PAGE_SIZE = 9;

const CATEGORIES = [
  { label: "All", value: "all" },
  { label: "For Creators & Marketers", value: "creators" },
  { label: "For Business", value: "business" },
  { label: "For Job Seekers", value: "job-seekers" },
  { label: "For Legal & Compliance", value: "legal" },
  { label: "For Professionals", value: "professionals" },
  { label: "For Developers", value: "developers" },
];

function buildUrl(cat: string, pg: number) {
  const params = new URLSearchParams();
  if (cat !== "all") params.set("category", cat);
  if (pg > 1) params.set("page", String(pg));
  const qs = params.toString();
  return `/blog${qs ? `?${qs}` : ""}`;
}

interface Props {
  searchParams: Promise<{ category?: string; page?: string }>;
}

export default async function BlogPage({ searchParams }: Props) {
  const { category: categoryParam, page: pageParam } = await searchParams;
  const category = CATEGORIES.some((c) => c.value === categoryParam) ? (categoryParam ?? "all") : "all";
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = createAdminClient();

  let query = supabase
    .from("blog_posts")
    .select("slug, title, excerpt, seo_description, created_at", { count: "exact" })
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (category !== "all") {
    query = query.eq("category", category);
  }

  const { data: articles, count } = await query.range(offset, offset + PAGE_SIZE - 1);

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);
  const hasArticles = articles && articles.length > 0;

  return (
    <main className="max-w-6xl mx-auto px-4 pt-8 pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Blog</h1>
        <p className="text-gray-700 text-sm">AI tool guides, tips, and tutorials.</p>
      </div>

      {/* SEO Topic Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Topics:</span>
        <Link
          href="/compare/ai-resume-generator-vs-chatgpt"
          className="px-3 py-1 bg-gray-100 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-full text-xs font-medium text-gray-700 hover:text-indigo-700 transition-colors"
        >
          ⚖️ AI Tool Comparisons
        </Link>
        <Link
          href="/alternatives/jasper-ai-alternatives"
          className="px-3 py-1 bg-gray-100 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-full text-xs font-medium text-gray-700 hover:text-indigo-700 transition-colors"
        >
          🔄 AI Alternatives
        </Link>
        <Link
          href="/use-cases"
          className="px-3 py-1 bg-gray-100 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-full text-xs font-medium text-gray-700 hover:text-indigo-700 transition-colors"
        >
          🎯 Use Cases
        </Link>
      </div>

      {/* 分类 Tab */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.value}
            href={buildUrl(cat.value, 1)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              category === cat.value
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {cat.label}
          </Link>
        ))}
      </div>

      {hasArticles ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/blog/${article.slug}`}
                className="block border border-gray-200 rounded-xl p-5 hover:border-gray-400 hover:shadow-sm transition-all group"
              >
                <h2 className="text-sm font-semibold text-gray-900 mb-2 group-hover:text-black leading-snug">
                  {article.title}
                </h2>
                {(article.excerpt || article.seo_description) && (
                  <p className="text-xs text-gray-700 leading-relaxed line-clamp-2 mb-3">
                    {article.excerpt ?? article.seo_description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-600">
                    {new Date(article.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-gray-400">5 min read</span>
                </div>
              </Link>
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            basePath={category !== "all" ? `/blog?category=${category}` : "/blog"}
          />
        </>
      ) : (
        <div className="text-center py-8 border border-dashed border-gray-200 rounded-2xl">
          <div className="text-4xl mb-3">🚀</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h2>
          <p className="text-gray-700 text-sm max-w-md mx-auto leading-relaxed mb-3">
            AI tool guides and tutorials are being generated automatically.
          </p>
          <Link
            href="/toolkits"
            className="mt-4 inline-block bg-black text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Explore AI Tools →
          </Link>
        </div>
      )}
    </main>
  );
}
