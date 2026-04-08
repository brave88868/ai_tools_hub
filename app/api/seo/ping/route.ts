import { NextResponse } from "next/server";

const SITE_URL = "https://www.aitoolsstation.com";

/**
 * GET /api/seo/ping
 * Pings Google and Bing with the sitemap-index URL.
 * No auth required — only triggers external pings, no sensitive data.
 * Called fire-and-forget from SEO generation APIs and the daily cron.
 */
export async function GET() {
  const sitemapUrl = encodeURIComponent(`${SITE_URL}/sitemap-index.xml`);

  const pings = [
    { engine: "google", url: `https://www.google.com/ping?sitemap=${sitemapUrl}` },
    { engine: "bing",   url: `https://www.bing.com/ping?sitemap=${sitemapUrl}` },
  ];

  const results: Record<string, string> = {};
  await Promise.allSettled(
    pings.map(async ({ engine, url }) => {
      try {
        const res = await fetch(url, { method: "GET" });
        results[engine] = res.ok ? "ok" : `status:${res.status}`;
      } catch {
        results[engine] = "error";
      }
    })
  );

  return NextResponse.json({
    success: true,
    pinged_at: new Date().toISOString(),
    results,
  });
}
