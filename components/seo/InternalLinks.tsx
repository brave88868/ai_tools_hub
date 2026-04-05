import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";

interface Props {
  currentSlug: string;
  type: "tool" | "compare" | "alternative" | "problem" | "workflow" | "template" | "example" | "guide" | "intent";
}

interface LinkItem {
  slug: string;
  title: string;
  url: string;
}

const SINGLE_TABLE_MAP: Record<string, { table: string; titleField: string; urlPrefix: string }> = {
  tool:        { table: "tools",            titleField: "name",          urlPrefix: "/tools" },
  compare:     { table: "seo_comparisons",  titleField: "title",         urlPrefix: "/compare" },
  alternative: { table: "seo_alternatives", titleField: "title",         urlPrefix: "/alternatives" },
  problem:     { table: "seo_problems",     titleField: "seo_title",     urlPrefix: "/problems" },
  workflow:    { table: "seo_workflows",    titleField: "seo_title",     urlPrefix: "/workflows" },
};

type MultiQuery = { table: string; titleField: string; urlPrefix: string; limit: number };

const MULTI_TABLE_MAP: Record<string, MultiQuery[]> = {
  template: [
    { table: "seo_templates", titleField: "template_name", urlPrefix: "/templates",  limit: 3 },
    { table: "seo_guides",    titleField: "guide_topic",   urlPrefix: "/guides",     limit: 2 },
  ],
  example: [
    { table: "seo_examples",  titleField: "example_type",  urlPrefix: "/examples",   limit: 3 },
    { table: "seo_templates", titleField: "template_name", urlPrefix: "/templates",  limit: 2 },
  ],
  guide: [
    { table: "seo_guides",    titleField: "guide_topic",   urlPrefix: "/guides",     limit: 2 },
    { table: "seo_examples",  titleField: "example_type",  urlPrefix: "/examples",   limit: 2 },
    { table: "tools",         titleField: "name",          urlPrefix: "/tools",      limit: 2 },
  ],
  intent: [
    { table: "tools",            titleField: "name",  urlPrefix: "/tools",   limit: 3 },
    { table: "seo_comparisons",  titleField: "title", urlPrefix: "/compare", limit: 2 },
  ],
};

async function fetchLinks(supabase: ReturnType<typeof createAdminClient>, queries: MultiQuery[], currentSlug: string): Promise<LinkItem[]> {
  const results = await Promise.all(
    queries.map(async (q) => {
      const { data } = await supabase
        .from(q.table)
        .select(`slug, ${q.titleField}`)
        .neq("slug", currentSlug)
        .limit(q.limit);
      return (data ?? []).map((row) => {
        const r = row as unknown as Record<string, string | null>;
        return {
          slug: r.slug ?? "",
          title: r[q.titleField] ?? r.slug ?? "",
          url: `${q.urlPrefix}/${r.slug ?? ""}`,
        } as LinkItem;
      });
    })
  );
  return results.flat();
}

export default async function InternalLinks({ currentSlug, type }: Props) {
  const supabase = createAdminClient();

  let links: LinkItem[] = [];

  if (MULTI_TABLE_MAP[type]) {
    links = await fetchLinks(supabase, MULTI_TABLE_MAP[type], currentSlug);
  } else {
    const config = SINGLE_TABLE_MAP[type];
    if (!config) return null;

    const { data } = await supabase
      .from(config.table)
      .select(`slug, ${config.titleField}`)
      .neq("slug", currentSlug)
      .limit(4);

    if (!data || data.length === 0) return null;

    links = (data as unknown as Record<string, string | null>[]).map((row) => ({
      slug: row.slug ?? "",
      title: row[config.titleField] ?? row.slug ?? "",
      url: `${config.urlPrefix}/${row.slug ?? ""}`,
    }));
  }

  if (links.length === 0) return null;

  return (
    <div className="mt-10 pt-8 border-t border-gray-100">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">You may also like</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {links.map((link) => (
          <Link
            key={`${link.url}-${link.slug}`}
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
