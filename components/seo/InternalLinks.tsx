import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";

interface Props {
  currentSlug: string;
  type: "tool" | "compare" | "alternative" | "problem" | "workflow";
}

interface LinkItem {
  slug: string;
  title: string;
  url: string;
}

const TABLE_MAP: Record<Props["type"], { table: string; titleField: string; urlPrefix: string }> = {
  tool:        { table: "tools",            titleField: "name",    urlPrefix: "/tools" },
  compare:     { table: "seo_comparisons",  titleField: "title",   urlPrefix: "/compare" },
  alternative: { table: "seo_alternatives", titleField: "title",   urlPrefix: "/alternatives" },
  problem:     { table: "seo_problems",     titleField: "seo_title", urlPrefix: "/problems" },
  workflow:    { table: "seo_workflows",    titleField: "seo_title", urlPrefix: "/workflows" },
};

export default async function InternalLinks({ currentSlug, type }: Props) {
  const supabase = createAdminClient();
  const config = TABLE_MAP[type];

  const { data } = await supabase
    .from(config.table)
    .select(`slug, ${config.titleField}`)
    .neq("slug", currentSlug)
    .limit(4);

  if (!data || data.length === 0) return null;

  const links: LinkItem[] = (data as unknown as Record<string, string | null>[]).map((row) => ({
    slug: row.slug ?? "",
    title: row[config.titleField] ?? row.slug ?? "",
    url: `${config.urlPrefix}/${row.slug ?? ""}`,
  }));

  return (
    <div className="mt-10 pt-8 border-t border-gray-100">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">You may also like</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {links.map((link) => (
          <Link
            key={link.slug}
            href={link.url}
            className="border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-700 hover:border-indigo-200 hover:text-indigo-600 transition-all line-clamp-1"
          >
            {link.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
