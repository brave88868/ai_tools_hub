import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Blog | AI Tools Station",
  description:
    "AI tool guides, tips, and tutorials. Learn how to use AI tools for resume optimization, content creation, marketing, and more.",
};

const PAGE_SIZE = 12;

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function BlogPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = createAdminClient();

  const { data: articles, count } = await supabase
    .from("blog_posts")
    .select("slug, title, excerpt, seo_description, created_at", { count: "exact" })
    .eq("published", true)
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);
  const hasArticles = articles && articles.length > 0;

  return (
    <main className="max-w-4xl mx-auto px-4 pt-6 pb-12">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Blog</h1>
        <p className="text-gray-500 text-sm">AI tool guides, tips, and tutorials.</p>
      </div>

      {hasArticles ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
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
                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-3">
                    {article.excerpt ?? article.seo_description}
                  </p>
                )}
                <span className="text-xs text-gray-300">
                  {new Date(article.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </Link>
            ))}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {page > 1 && (
                <Link
                  href={`/blog?page=${page - 1}`}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
                >
                  ← Prev
                </Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - page) <= 2)
                .map((p) => (
                  <Link
                    key={p}
                    href={`/blog?page=${p}`}
                    className={`px-3 py-1.5 text-xs border rounded-lg transition-colors ${
                      p === page
                        ? "bg-black text-white border-black"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {p}
                  </Link>
                ))}
              {page < totalPages && (
                <Link
                  href={`/blog?page=${page + 1}`}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
                >
                  Next →
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 border border-dashed border-gray-200 rounded-2xl">
          <div className="text-4xl mb-3">🚀</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed mb-3">
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
