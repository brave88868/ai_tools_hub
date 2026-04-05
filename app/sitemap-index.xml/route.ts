import { NextResponse } from "next/server";

const SITE_URL = "https://aitoolsstation.com";

/**
 * GET /sitemap-index.xml
 * Proper XML sitemapindex format — submit this URL to Google Search Console.
 * Includes all 4 sub-sitemaps covering every page on the site.
 */
export async function GET() {
  const now = new Date().toISOString();

  const sitemaps = [
    `${SITE_URL}/sitemap-main.xml`,
    `${SITE_URL}/sitemap-tools.xml`,
    `${SITE_URL}/sitemap-seo.xml`,
    `${SITE_URL}/sitemap-blog.xml`,
    `${SITE_URL}/sitemap-examples.xml`,
    `${SITE_URL}/sitemap-templates.xml`,
    `${SITE_URL}/sitemap-prompts.xml`,
  ];

  const entries = sitemaps
    .map((loc) => `  <sitemap>\n    <loc>${loc}</loc>\n    <lastmod>${now}</lastmod>\n  </sitemap>`)
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
