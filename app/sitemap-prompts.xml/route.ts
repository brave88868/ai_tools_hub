import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

const SITE_URL = "https://www.aitoolsstation.com";

export const dynamic = "force-dynamic";

function urlEntry(loc: string, lastmod: string, priority = "0.65", changefreq = "monthly"): string {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

export async function GET() {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: prompts } = await admin
    .from("ai_prompts")
    .select("slug, category, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(5000);

  const entries: string[] = [];

  // Prompts index page
  entries.push(urlEntry(`${SITE_URL}/prompts`, now, "0.85", "daily"));

  // Category pages (unique)
  const categories = [...new Set((prompts ?? []).map((p) => p.category))];
  for (const cat of categories) {
    entries.push(urlEntry(`${SITE_URL}/prompts/${cat}`, now, "0.8", "weekly"));
  }

  // Individual prompt detail pages
  for (const p of prompts ?? []) {
    const lastmod = p.created_at ? new Date(p.created_at).toISOString() : now;
    entries.push(urlEntry(`${SITE_URL}/prompts/${p.category}/${p.slug}`, lastmod, "0.65", "monthly"));
  }

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
