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

  // prompt_pages table: individual prompts at /ai-prompts/{slug}
  // (ai_prompts table is empty; prompt_pages has 60 rows with is_active field)
  const { data: prompts } = await admin
    .from("prompt_pages")
    .select("slug, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .range(0, 999);

  const entries: string[] = [];

  // Prompts index page
  entries.push(urlEntry(`${SITE_URL}/prompts`, now, "0.85", "daily"));

  // Individual prompt pages at /ai-prompts/{slug}
  for (const p of prompts ?? []) {
    const lastmod = p.created_at ? new Date(p.created_at).toISOString() : now;
    entries.push(urlEntry(`${SITE_URL}/ai-prompts/${p.slug}`, lastmod, "0.65", "monthly"));
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
