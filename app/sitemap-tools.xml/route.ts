import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

const SITE_URL = "https://www.aitoolsstation.com";

export const dynamic = "force-dynamic";

function urlEntry(loc: string, lastmod: string, priority = "0.8", changefreq = "weekly"): string {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

export async function GET() {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const [{ data: tools }, { data: toolkits }] = await Promise.all([
    admin.from("tools").select("slug, created_at").eq("is_active", true),
    admin.from("toolkits").select("slug, created_at").eq("is_active", true),
  ]);

  const entries: string[] = [];

  for (const kit of toolkits ?? []) {
    entries.push(urlEntry(`${SITE_URL}/toolkits/${kit.slug}`, kit.created_at ?? now, "0.9", "weekly"));
  }

  for (const tool of tools ?? []) {
    entries.push(urlEntry(`${SITE_URL}/tools/${tool.slug}`, tool.created_at ?? now, "0.8", "weekly"));
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
