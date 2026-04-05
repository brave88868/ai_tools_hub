import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

const SITE_URL = "https://aitoolsstation.com";
const MAX_PER_SITEMAP = 5000;

export const dynamic = "force-dynamic";

function urlEntry(loc: string, lastmod: string, priority = "0.7", changefreq = "monthly"): string {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

function typeToUrl(type: string, slug: string): string {
  switch (type) {
    case "use_case":     return `${SITE_URL}/use-cases/${slug}`;
    case "comparison":   return `${SITE_URL}/${slug}`;
    case "alternative":  return `${SITE_URL}/${slug}`;
    case "problem":      return `${SITE_URL}/${slug}`;
    case "template":     return `${SITE_URL}/templates/${slug}`;
    case "saas_page":    return `${SITE_URL}/saas/${slug}`;
    case "ai-for":       return `${SITE_URL}/ai-for/${slug}`;
    default:             return `${SITE_URL}/${slug}`;
  }
}

export async function GET() {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  // Fetch all seo_pages and seo_use_cases (flat routes)
  const [{ data: seoPages }, { data: flatUseCases }] = await Promise.all([
    admin
      .from("seo_pages")
      .select("slug, type, created_at")
      .not("type", "eq", "legacy")
      .order("created_at", { ascending: false })
      .limit(MAX_PER_SITEMAP),
    admin
      .from("seo_use_cases")
      .select("slug, created_at")
      .limit(2000),
  ]);

  const entries: string[] = [];

  for (const page of seoPages ?? []) {
    const loc = typeToUrl(page.type, page.slug);
    entries.push(urlEntry(loc, page.created_at ?? now, "0.7", "monthly"));
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
