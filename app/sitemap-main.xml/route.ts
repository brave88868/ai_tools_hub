import { NextResponse } from "next/server";

const SITE_URL = "https://aitoolsstation.com";

export const dynamic = "force-dynamic";

function urlEntry(loc: string, priority = "1.0", changefreq = "weekly"): string {
  return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

export async function GET() {
  const now = new Date().toISOString();

  const entries = [
    urlEntry(`${SITE_URL}/`, "1.0", "weekly"),
    urlEntry(`${SITE_URL}/toolkits`, "0.9", "weekly"),
    urlEntry(`${SITE_URL}/tools`, "0.9", "weekly"),
    urlEntry(`${SITE_URL}/pricing`, "0.8", "monthly"),
    urlEntry(`${SITE_URL}/blog`, "0.8", "daily"),
    urlEntry(`${SITE_URL}/features`, "0.6", "weekly"),
    urlEntry(`${SITE_URL}/roadmap`, "0.6", "weekly"),
    urlEntry(`${SITE_URL}/use-cases`, "0.8", "weekly"),
    urlEntry(`${SITE_URL}/saas`, "0.7", "weekly"),
    urlEntry(`${SITE_URL}/examples`, "0.8", "daily"),
    urlEntry(`${SITE_URL}/templates`, "0.8", "weekly"),
    urlEntry(`${SITE_URL}/prompts`, "0.85", "daily"),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Last-Modified": now,
    },
  });
}
