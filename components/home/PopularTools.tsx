import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";

const TOOLKIT_ICON: Record<string, string> = {
  jobseeker: "💼",
  creator: "🎬",
  marketing: "📣",
  business: "📊",
  legal: "⚖️",
  exam: "🎓",
};

export default async function PopularTools() {
  const supabase = createAdminClient();

  // Get top 6 tool slugs by usage count
  const { data: usageData } = await supabase
    .from("analytics_events")
    .select("tool_slug")
    .eq("event_type", "tool_use")
    .not("tool_slug", "is", null);

  // Count occurrences
  const counts: Record<string, number> = {};
  for (const row of usageData ?? []) {
    if (row.tool_slug) counts[row.tool_slug] = (counts[row.tool_slug] ?? 0) + 1;
  }
  const topSlugs = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([slug]) => slug);

  // Fetch tool details; fall back to sort_order if no usage data yet
  let tools: Array<{ slug: string; name: string; description: string | null; toolkitSlug: string }> = [];

  if (topSlugs.length >= 3) {
    const { data } = await supabase
      .from("tools")
      .select("slug, name, description, toolkits(slug)")
      .in("slug", topSlugs)
      .eq("is_active", true);

    tools = (data ?? []).map((t) => ({
      slug: t.slug,
      name: t.name,
      description: t.description,
      toolkitSlug: (Array.isArray(t.toolkits) ? t.toolkits[0]?.slug : (t.toolkits as { slug: string } | null)?.slug) ?? "",
    }));
    // Re-sort by original topSlugs order
    tools.sort((a, b) => topSlugs.indexOf(a.slug) - topSlugs.indexOf(b.slug));
  } else {
    const { data } = await supabase
      .from("tools")
      .select("slug, name, description, toolkits(slug)")
      .eq("is_active", true)
      .order("sort_order")
      .limit(6);

    tools = (data ?? []).map((t) => ({
      slug: t.slug,
      name: t.name,
      description: t.description,
      toolkitSlug: (Array.isArray(t.toolkits) ? t.toolkits[0]?.slug : (t.toolkits as { slug: string } | null)?.slug) ?? "",
    }));
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-1">Popular AI Tools</h2>
          <p className="text-gray-700 text-sm">Most used across our community</p>
        </div>
        <Link href="/toolkits" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
          View all 600+ tools →
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <div
            key={tool.slug}
            className="border border-gray-100 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-lg flex items-center justify-center text-base">
                {TOOLKIT_ICON[tool.toolkitSlug] ?? "🤖"}
              </div>
              <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">Free</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
              {tool.name}
            </h3>
            <p className="text-xs text-gray-700 leading-relaxed mb-3 line-clamp-2">{tool.description}</p>
            <Link href={`/tools/${tool.slug}`} className="text-xs font-medium text-indigo-500 hover:text-indigo-700 transition-colors">
              Use Tool →
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
