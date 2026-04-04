import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Blog | AI Tools Hub",
  description:
    "AI tool guides, tips, and tutorials. Learn how to use AI tools for resume optimization, content creation, marketing, and more.",
};

export default async function BlogPage() {
  const supabase = createAdminClient();

  const { data: articles } = await supabase
    .from("seo_pages")
    .select("slug, title, meta_description, published_at")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(20);

  const hasArticles = articles && articles.length > 0;

  return (
    <main className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-1">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Blog</h1>
        <p className="text-gray-500">AI tool guides, tips, and tutorials.</p>
      </div>

      {hasArticles ? (
        <div className="space-y-6">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="block border border-gray-200 rounded-xl p-6 hover:border-gray-400 hover:shadow-sm transition-all group"
            >
              <h2 className="text-base font-semibold text-gray-900 mb-2 group-hover:text-black">
                {article.title}
              </h2>
              {article.meta_description && (
                <p className="text-sm text-gray-400 leading-relaxed line-clamp-2 mb-3">
                  {article.meta_description}
                </p>
              )}
              {article.published_at && (
                <span className="text-xs text-gray-400">
                  {new Date(article.published_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border border-dashed border-gray-200 rounded-2xl">
          <div className="text-4xl mb-3">🚀</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed mb-3">
            AI tool guides and tutorials are being generated automatically. This section will include articles on:
          </p>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>Resume optimization tips</li>
            <li>Content creation with AI</li>
            <li>Marketing automation guides</li>
            <li>AI productivity workflows</li>
          </ul>
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
