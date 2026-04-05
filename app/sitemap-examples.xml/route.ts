import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

const SITE_URL = "https://aitoolsstation.com";

export const dynamic = "force-dynamic";

function urlEntry(loc: string, lastmod: string, priority = "0.6", changefreq = "monthly"): string {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

export async function GET() {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: examples } = await admin
    .from("generated_examples")
    .select("slug, updated_at")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(10000);

  const entries: string[] = [
    // Examples list page
    urlEntry(`${SITE_URL}/examples`, now, "0.8", "daily"),
  ];

  for (const ex of examples ?? []) {
    entries.push(
      urlEntry(
        `${SITE_URL}/examples/${ex.slug}`,
        ex.updated_at ?? now,
        "0.6",
        "monthly"
      )
    );
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
