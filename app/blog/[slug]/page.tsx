import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { createAdminClient } from "@/lib/supabase";
import { injectInternalLinks } from "@/lib/internal-linking";

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

  const title = data.seo_title ?? data.title;
  const description = data.seo_description ?? data.excerpt ?? undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://aitoolsstation.com/blog/${slug}`,
      siteName: "AI Tools Hub",
      type: "article",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const [{ data: post }, { data: allTools }] = await Promise.all([
    supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .single(),
    supabase
      .from("tools")
      .select("slug, name, toolkits(slug)")
      .eq("is_active", true)
      .order("sort_order")
      .limit(20),
  ]);

  if (!post) notFound();

  // Inject internal links into article content
  const linkedContent = post.content
    ? injectInternalLinks(
        post.content,
        (allTools ?? []).map((t) => ({ slug: t.slug, name: t.name }))
      )
    : "";

  // Pick 4 related tools for the footer section
  const relatedTools = (allTools ?? []).slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seo_description ?? post.excerpt ?? "",
    datePublished: post.created_at,
    dateModified: post.updated_at ?? post.created_at,
    author: { "@type": "Organization", name: "AI Tools Hub" },
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

        {/* Article content with internal links injected */}
        {linkedContent && (
          <article className="prose prose-sm max-w-none text-gray-700 prose-headings:text-gray-900 prose-headings:font-semibold prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline prose-li:text-gray-700">
            <ReactMarkdown>{linkedContent}</ReactMarkdown>
          </article>
        )}

        {/* CTA Banner */}
        <div className="mt-10 bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-6 text-center">
          <p className="text-sm font-semibold text-gray-900 mb-1">
            Try these AI tools for free
          </p>
          <p className="text-xs text-gray-400 mb-4">No credit card required · 3 free uses per day</p>
          <Link
            href="/toolkits"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Start Free →
          </Link>
        </div>

        {/* Related Tools */}
        {relatedTools.length > 0 && (
          <div className="mt-10 pt-8 border-t border-gray-100">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Try These AI Tools</h2>
            <div className="grid grid-cols-2 gap-3">
              {relatedTools.map((tool) => {
                const toolkitSlug =
                  (tool.toolkits as unknown as { slug: string } | null)?.slug ?? "";
                return (
                  <Link
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    className="border border-gray-200 rounded-xl p-3 text-xs text-gray-600 hover:border-indigo-200 transition-colors"
                  >
                    <div className="font-medium text-gray-800 mb-0.5">{tool.name}</div>
                    {toolkitSlug && (
                      <div className="text-gray-400 capitalize">{toolkitSlug} Toolkit</div>
                    )}
                  </Link>
                );
              })}
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
