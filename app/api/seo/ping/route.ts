import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/seo/ping
 * Pings Google and Bing with the sitemap URL so new pages get indexed faster.
 * Called by the daily cron after content generation.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  const isInternal = req.headers.get("x-internal-cron") === "1";

  if (!isCron && !isInternal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aitoolsstation.com";
  const sitemapUrl = encodeURIComponent(`${appUrl}/sitemap.xml`);

  const pings = [
    `https://www.google.com/ping?sitemap=${sitemapUrl}`,
    `https://www.bing.com/ping?sitemap=${sitemapUrl}`,
  ];

  const results: Record<string, string> = {};
  await Promise.allSettled(
    pings.map(async (url) => {
      try {
        const res = await fetch(url, { method: "GET" });
        results[url.includes("google") ? "google" : "bing"] = res.ok ? "ok" : `status:${res.status}`;
      } catch {
        results[url.includes("google") ? "google" : "bing"] = "error";
      }
    })
  );

  return NextResponse.json({ pinged: true, results });
}
