import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";

interface Props {
  params: Promise<{ slug: string }>;
}

const SITE_URL = "https://aitoolsstation.com";

export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const audience = slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("seo_pages")
    .select("title, seo_title, seo_description")
    .eq("slug", slug)
    .eq("type", "ai-for")
    .single();

  const title = data?.seo_title || data?.title || `Best AI Tools for ${audience} in 2025`;
  const description =
    data?.seo_description ||
    `Discover the best AI tools built for ${audience}. Save time, automate tasks, and boost productivity with AI.`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/ai-for/${slug}` },
    openGraph: { title, description, type: "website", url: `${SITE_URL}/ai-for/${slug}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function AiForPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const audience = slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l: string) => l.toUpperCase());

  // DB 页面内容（可选）
  const { data: page } = await supabase
    .from("seo_pages")
    .select("title, content")
    .eq("slug", slug)
    .eq("type", "ai-for")
    .single();

  // 工具列表（最多 6 个）
  const { data: tools } = await supabase
    .from("tools")
    .select("slug, name, description")
    .eq("is_active", true)
    .limit(6);

  const title = page?.title || `Best AI Tools for ${audience}`;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8 flex-wrap">
          <Link href="/" className="hover:text-gray-700">Home</Link>
          <span>/</span>
          <span className="text-gray-700">AI For</span>
          <span>/</span>
          <span className="text-gray-700">{audience}</span>
        </nav>

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
            Curated for {audience}
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            The most powerful AI tools built for {audience.toLowerCase()}.
            Save hours every week with intelligent automation.
          </p>
        </div>

        {/* DB content */}
        {page?.content && (
          <div
            className="prose prose-sm max-w-none mb-12 text-gray-700"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        )}

        {/* Tools Grid */}
        {tools && tools.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Top AI Tools for {audience}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tools.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="group rounded-xl border border-gray-200 bg-white p-5 hover:border-indigo-300 hover:shadow-md transition-all"
                >
                  <h3 className="font-semibold text-gray-900 mb-1.5 group-hover:text-indigo-600 transition-colors">
                    {tool.name}
                  </h3>
                  {tool.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">{tool.description}</p>
                  )}
                  <span className="mt-3 inline-block text-xs text-indigo-600 font-medium">
                    Try free →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* FAQ */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">FAQ: AI for {audience}</h2>
          <div className="space-y-5">
            {[
              {
                q: `What are the best AI tools for ${audience.toLowerCase()}?`,
                a: `Our platform offers 600+ AI tools specifically useful for ${audience.toLowerCase()}, including generators for content, analysis, planning, and communication.`,
              },
              {
                q: "Are these tools free to use?",
                a: "Yes! Every tool offers a free tier — 3 uses per day with no credit card required. Upgrade to Pro for unlimited access.",
              },
              {
                q: "How much time can AI save?",
                a: `Most ${audience.toLowerCase()} report saving 5–15 hours per week by automating repetitive tasks with AI tools.`,
              },
            ].map((faq, i) => (
              <div key={i} className="border-b border-gray-100 last:border-0 pb-5 last:pb-0">
                <h3 className="font-medium text-sm text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-500">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 rounded-2xl border border-indigo-200 bg-indigo-50 p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Try Our AI Tools for Free
          </h2>
          <p className="text-gray-500 mb-6">
            No credit card required. Start generating in seconds.
          </p>
          <Link
            href="/toolkits"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white rounded-xl px-6 py-3 text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Browse All AI Tools →
          </Link>
        </div>
      </div>
    </div>
  );
}
