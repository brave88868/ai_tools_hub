import { createAdminClient } from "@/lib/supabase";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AI Generated Examples | AI Tools Station",
  description:
    "Browse real AI-generated examples. See what our AI tools can create — resumes, cover letters, business plans, and more.",
};

interface Props {
  searchParams: Promise<{ tool?: string; page?: string }>;
}

export default async function ExamplesPage({ searchParams }: Props) {
  const { tool, page } = await searchParams;
  const currentPage = parseInt(page || "1");
  const pageSize = 24;
  const offset = (currentPage - 1) * pageSize;

  const admin = createAdminClient();

  // 工具列表（用于筛选 tab）
  const { data: toolList } = await admin
    .from("generated_examples")
    .select("tool_slug")
    .eq("is_public", true);

  const uniqueTools = [...new Set((toolList ?? []).map((t) => t.tool_slug))];

  // 查询 examples（支持按工具筛选）
  let query = admin
    .from("generated_examples")
    .select("id, tool_slug, title, slug, keywords, created_at", { count: "exact" })
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (tool) query = query.eq("tool_slug", tool);

  const { data: examples, count } = await query;

  const totalPages = Math.ceil((count || 0) / pageSize);

  function formatToolName(slug: string) {
    return slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">AI Generated Examples</h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Real outputs from our AI tools. See what&apos;s possible — then create your own.
          </p>
        </div>

        {/* Tool Filter */}
        {uniqueTools.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <Link
              href="/examples"
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                !tool
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All Tools
            </Link>
            {uniqueTools.map((t) => (
              <Link
                key={t}
                href={`/examples?tool=${t}`}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  tool === t
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {formatToolName(t)}
              </Link>
            ))}
          </div>
        )}

        {/* Examples Grid */}
        {examples && examples.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {examples.map((ex) => (
              <Link
                key={ex.id}
                href={`/examples/${ex.slug}`}
                className="group rounded-xl border border-gray-200 bg-white p-5 hover:border-indigo-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                    {formatToolName(ex.tool_slug)}
                  </span>
                  <span className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity text-sm">→</span>
                </div>
                <h3 className="font-medium text-sm text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                  {ex.title}
                </h3>
                {ex.keywords?.slice(0, 3).map((kw: string) => (
                  <span key={kw} className="inline-block text-xs text-gray-400 mr-1">
                    #{kw}
                  </span>
                ))}
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg mb-2">No examples yet.</p>
            <p className="text-sm">Start using a tool to generate the first one!</p>
            <Link
              href="/toolkits"
              className="mt-4 inline-block bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Browse AI Tools →
            </Link>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/examples?${tool ? `tool=${tool}&` : ""}page=${p}`}
                className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-colors ${
                  p === currentPage
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
