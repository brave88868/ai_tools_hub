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

  const { data: templates } = await admin
    .from("tool_templates")
    .select("slug, created_at")
    .eq("is_active", true)
    .order("download_count", { ascending: false })
    .limit(5000);

  const entries: string[] = [
    // Templates list page
    urlEntry(`${SITE_URL}/templates`, now, "0.8", "weekly"),
  ];

  for (const t of templates ?? []) {
    entries.push(
      urlEntry(
        `${SITE_URL}/templates/${t.slug}`,
        t.created_at ?? now,
        "0.7",
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
