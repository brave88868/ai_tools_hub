import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { createAdminClient } from "@/lib/supabase";
import { breadcrumbSchema } from "@/lib/seo/schemas";
import InternalLinks from "@/components/seo/InternalLinks";
import { CopyButton } from "@/components/ui/CopyButton";

interface Props {
  params: Promise<{ slug: string }>;
}

const SITE_URL = "https://aitoolsstation.com";

export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();

  // 优先查 tool_templates（Module B UGC 模板）
  const { data: tt } = await supabase
    .from("tool_templates")
    .select("title, description, category")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (tt) {
    const title = `${tt.title} — Free Download`;
    const description = tt.description || `Free ${tt.title}. Download and customize with AI instantly.`;
    return {
      title, description,
      alternates: { canonical: `${SITE_URL}/templates/${slug}` },
      openGraph: { title, description, type: "article", url: `${SITE_URL}/templates/${slug}` },
    };
  }

  // Fallback: seo_templates
  const { data } = await supabase
    .from("seo_templates")
    .select("seo_title, seo_description, template_name")
    .eq("slug", slug)
    .single();

  if (!data) return { title: "Not Found" };

  const title = data.seo_title ?? `${data.template_name} Template | AI Tools Hub`;
  const description = data.seo_description ?? `Download and use the ${data.template_name} template.`;
  return {
    title, description,
    alternates: { canonical: `${SITE_URL}/templates/${slug}` },
    openGraph: { title, description, type: "article", url: `${SITE_URL}/templates/${slug}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function TemplatePage({ params }: Props) {
  const { slug } = await params;
  const supabase = createAdminClient();

  // ── 优先：tool_templates（Module B 可下载模板）────────────────────────
  const { data: template } = await supabase
    .from("tool_templates")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (template) {
    const { data: related } = await supabase
      .from("tool_templates")
      .select("id, title, slug")
      .eq("category", template.category)
      .neq("slug", slug)
      .eq("is_active", true)
      .limit(3);

    const toolName = template.tool_slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l: string) => l.toUpperCase());

    const formatCategory = (cat: string) =>
      cat.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());

    return (
      <div className="min-h-screen bg-white">
        {/* Breadcrumb */}
        <div className="border-b border-gray-100 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <nav className="flex items-center gap-2 text-sm text-gray-400 flex-wrap">
              <Link href="/" className="hover:text-gray-700">Home</Link>
              <span>/</span>
              <Link href="/templates" className="hover:text-gray-700">Templates</Link>
              <span>/</span>
              <Link href={`/templates?category=${template.category}`} className="hover:text-gray-700">
                {formatCategory(template.category)}
              </Link>
              <span>/</span>
              <span className="text-gray-700 truncate max-w-[180px]">{template.title}</span>
            </nav>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{template.title}</h1>
            {template.description && (
              <p className="text-gray-500">{template.description}</p>
            )}
            {template.download_count > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                ↓ Downloaded {template.download_count.toLocaleString()} times
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Template Preview */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
                  <span className="text-sm font-medium text-gray-600">Template Preview</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Free to download</span>
                    <CopyButton text={template.content} />
                  </div>
                </div>
                <div className="p-5">
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 font-mono">
                    {template.content}
                  </pre>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Download */}
              <a
                href={`/api/templates/download/${template.slug}`}
                download
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-xl px-4 py-3 text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                ↓ Download Template
              </a>

              {/* AI Customise CTA */}
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 text-center">
                <div className="text-2xl mb-2">✨</div>
                <p className="text-sm font-semibold text-gray-900 mb-1">Customise with AI</p>
                <p className="text-xs text-gray-500 mb-3">
                  Use {toolName} to generate a personalised version for your needs
                </p>
                <Link
                  href={`/tools/${template.tool_slug}`}
                  className="w-full inline-flex items-center justify-center gap-2 border border-indigo-300 text-indigo-700 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-indigo-100 transition-colors"
                >
                  Use {toolName} →
                </Link>
              </div>

              {/* Related Templates */}
              {related && related.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Related Templates</h3>
                  <div className="space-y-2">
                    {related.map((r) => (
                      <Link
                        key={r.id}
                        href={`/templates/${r.slug}`}
                        className="block text-xs text-gray-500 hover:text-indigo-600 transition-colors p-1.5 rounded hover:bg-gray-50"
                      >
                        {r.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Fallback：seo_templates（程序化 SEO 模板）────────────────────────
  const { data } = await supabase
    .from("seo_templates")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!data) notFound();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: data.seo_title ?? data.template_name,
    description: data.seo_description,
    url: `${SITE_URL}/templates/${slug}`,
    publisher: { "@type": "Organization", name: "AI Tools Hub", url: SITE_URL },
  };

  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Templates", url: `${SITE_URL}/templates` },
    { name: data.template_name, url: `${SITE_URL}/templates/${slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <main className="max-w-3xl mx-auto px-4 py-10">
        <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5">
          <Link href="/" className="hover:text-gray-600">Home</Link>
          <span>/</span>
          <Link href="/templates" className="hover:text-gray-600">Templates</Link>
          <span>/</span>
          <span className="text-gray-600 truncate">{data.template_name}</span>
        </nav>

        <h1 className="text-2xl font-bold text-gray-900 mb-6 leading-snug">{data.template_name}</h1>

        {data.tool_slug && (
          <div className="flex flex-wrap gap-3 mb-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <p className="text-sm text-gray-700 w-full font-medium">
              Generate this template instantly with AI — free to start
            </p>
            <Link
              href={`/tools/${data.tool_slug}`}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Try the AI Tool →
            </Link>
            <Link
              href="/toolkits"
              className="border border-indigo-200 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors"
            >
              Browse All Tools
            </Link>
          </div>
        )}

        {data.content && (
          <article className="prose prose-sm max-w-none text-gray-700 prose-headings:text-gray-900 prose-headings:font-semibold prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline prose-li:text-gray-700 mb-10">
            <ReactMarkdown>{data.content}</ReactMarkdown>
          </article>
        )}

        <InternalLinks currentSlug={slug} type="template" />
      </main>
    </>
  );
}
