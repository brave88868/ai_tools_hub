import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Tool Use Cases | AI Tools Hub",
  description: "Browse 1000+ AI tool use cases for every profession. Find how AI tools help software engineers, marketers, designers, lawyers, and more.",
  openGraph: {
    title: "AI Tool Use Cases | AI Tools Hub",
    description: "Browse 1000+ AI tool use cases for every profession.",
    siteName: "AI Tools Hub",
    type: "website",
  },
};

interface UseCaseRow {
  slug: string;
  title: string | null;
  tool_slug: string | null;
  meta: Record<string, string> | null;
}

export default async function UseCasesPage() {
  const supabase = createAdminClient();

  const { data: pages } = await supabase
    .from("seo_pages")
    .select("slug, title, tool_slug, meta")
    .eq("type", "use_case")
    .order("tool_slug")
    .limit(500);

  const rows = (pages ?? []) as unknown as UseCaseRow[];

  // Group by tool_slug, max 5 per tool
  const grouped = new Map<string, UseCaseRow[]>();
  for (const row of rows) {
    const key = row.tool_slug ?? "other";
    const existing = grouped.get(key) ?? [];
    if (existing.length < 5) {
      existing.push(row);
      grouped.set(key, existing);
    }
  }

  // Fetch tool names
  const toolSlugs = [...grouped.keys()].filter((s) => s !== "other");
  const { data: tools } = await supabase
    .from("tools")
    .select("slug, name")
    .in("slug", toolSlugs.slice(0, 100));

  const toolNameMap = new Map((tools ?? []).map((t) => [t.slug, t.name]));

  const toolGroups = [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">AI Tools for Every Profession</h1>
        <p className="text-gray-500 text-base max-w-xl mx-auto">
          Discover how AI tools help professionals across every industry work smarter.
        </p>
        <div className="mt-3 inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 text-xs text-indigo-600">
          <span className="font-semibold">{rows.length.toLocaleString()}</span>
          <span>use cases across {toolGroups.length} tools</span>
        </div>
      </div>

      {toolGroups.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-sm">No use cases generated yet.</p>
          <p className="text-xs mt-2">Run the use case generator in <Link href="/admin/seo" className="text-indigo-500 hover:underline">Admin → SEO</Link>.</p>
        </div>
      )}

      <div className="space-y-10">
        {toolGroups.map(([toolSlug, useCases]) => (
          <section key={toolSlug}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">
                <Link
                  href={`/tools/${toolSlug}`}
                  className="hover:text-indigo-600 transition-colors"
                >
                  {toolNameMap.get(toolSlug) ?? toolSlug}
                </Link>
              </h2>
              <Link
                href={`/tools/${toolSlug}`}
                className="text-xs text-indigo-500 hover:text-indigo-600"
              >
                Try tool →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {useCases.map((uc) => {
                const profession = uc.meta?.profession ?? "";
                return (
                  <Link
                    key={uc.slug}
                    href={`/use-cases/${uc.slug}`}
                    className="border border-gray-100 rounded-xl px-4 py-3 hover:border-indigo-200 hover:shadow-sm transition-all group"
                  >
                    <p className="text-sm font-medium text-gray-800 group-hover:text-indigo-600 line-clamp-2">
                      {uc.title ?? uc.slug}
                    </p>
                    {profession && (
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">
                        {profession.replace(/-/g, " ")}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {rows.length > 0 && (
        <div className="mt-12 text-center">
          <Link
            href="/toolkits"
            className="inline-block bg-black text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Browse All AI Tools →
          </Link>
        </div>
      )}
    </main>
  );
}
