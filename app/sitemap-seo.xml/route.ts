import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

const SITE_URL = "https://www.aitoolsstation.com";

export const dynamic = "force-dynamic";

function urlEntry(loc: string, lastmod: string, priority = "0.7", changefreq = "monthly"): string {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

export async function GET() {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  // Only fetch types with confirmed working routes.
  // Excluded: saas_page (no route → 404), comparison/alternative/problem/template
  // (covered by sitemap-generators.xml or no dedicated route).
  //
  // Supabase max_rows=1000 per request — paginate use_case in parallel pages.
  const PAGE_SIZE = 1000;
  const USE_CASE_PAGES = 8; // covers up to 8000 rows (5939 currently)
  const [aiForRes, flatUseCasesRes, ...useCasePages] = await Promise.all([
    admin
      .from("seo_pages")
      .select("slug, created_at")
      .eq("type", "ai-for")
      .not("slug", "is", null)
      .not("content", "is", null)
      .range(0, 999),
    admin
      .from("seo_use_cases")
      .select("slug, created_at")
      .range(0, 1999),
    ...Array.from({ length: USE_CASE_PAGES }, (_, i) =>
      admin
        .from("seo_pages")
        .select("slug, created_at")
        .eq("type", "use_case")
        .not("slug", "is", null)
        .not("content", "is", null)
        .range(i * PAGE_SIZE, (i + 1) * PAGE_SIZE - 1)
    ),
  ]);

  const useCases = useCasePages.flatMap((p) => p.data ?? []);
  const aiFor = aiForRes.data;
  const flatUseCases = flatUseCasesRes.data;

  const entries: string[] = [];

  for (const page of useCases ?? []) {
    entries.push(urlEntry(`${SITE_URL}/use-cases/${page.slug}`, page.created_at ?? now));
  }

  for (const page of aiFor ?? []) {
    entries.push(urlEntry(`${SITE_URL}/ai-for/${page.slug}`, page.created_at ?? now));
  }

  for (const uc of flatUseCases ?? []) {
    entries.push(urlEntry(`${SITE_URL}/${uc.slug}`, uc.created_at ?? now, "0.8", "monthly"));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
