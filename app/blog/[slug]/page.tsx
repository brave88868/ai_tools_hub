import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { createAdminClient } from "@/lib/supabase";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("seo_title, seo_description, title, excerpt")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!data) return { title: "Blog | AI Tools Hub" };

  return {
    title: data.seo_title ?? data.title,
    description: data.seo_description ?? data.excerpt ?? undefined,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const [{ data: post }, { data: relatedTools }] = await Promise.all([
    supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .single(),
    supabase
      .from("tools")
      .select("slug, name, toolkit_slug")
      .limit(4),
  ]);

  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seo_description ?? post.excerpt ?? "",
    datePublished: post.created_at,
    dateModified: post.updated_at ?? post.created_at,
    author: {
      "@type": "Organization",
      name: "AI Tools Hub",
    },
    publisher: {
      "@type": "Organization",
      name: "AI Tools Hub",
      url: "https://aitoolsstation.com",
    },
    url: `https://aitoolsstation.com/blog/${slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="max-w-2xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5">
          <Link href="/blog" className="hover:text-gray-600">Blog</Link>
          <span>/</span>
          <span className="text-gray-600 truncate max-w-[200px]">{post.title}</span>
        </nav>

        {/* Header */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3 leading-snug">{post.title}</h1>
        {post.excerpt && (
          <p className="text-gray-500 text-sm mb-4 leading-relaxed">{post.excerpt}</p>
        )}
        <div className="text-xs text-gray-400 mb-8 pb-6 border-b border-gray-100">
          {new Date(post.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>

        {/* Article content */}
        {post.content && (
          <article className="prose prose-sm max-w-none text-gray-700 prose-headings:text-gray-900 prose-headings:font-semibold prose-a:text-black prose-a:underline prose-li:text-gray-700">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </article>
        )}

        {/* Related Tools */}
        {relatedTools && relatedTools.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-100">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Try These AI Tools</h2>
            <div className="grid grid-cols-2 gap-3">
              {relatedTools.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="border border-gray-200 rounded-xl p-3 text-xs text-gray-600 hover:border-gray-400 transition-colors"
                >
                  <div className="font-medium text-gray-800 mb-0.5">{tool.name}</div>
                  <div className="text-gray-400 capitalize">{tool.toolkit_slug} Toolkit</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back link */}
        <div className="mt-8">
          <Link href="/blog" className="text-xs text-gray-400 hover:text-gray-600 underline">
            ← Back to Blog
          </Link>
        </div>
      </main>
    </>
  );
}
