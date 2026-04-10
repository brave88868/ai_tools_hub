import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

const SITE_URL = "https://www.aitoolsstation.com";

export const dynamic = "force-dynamic";

function url(loc: string, priority = "0.8", changefreq = "weekly"): string {
  return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

export async function GET() {
  const admin = createAdminClient();

  const [
    { data: generators },
    { data: useCasePages },
    { data: promptPages },
  ] = await Promise.all([
    admin.from("generators").select("slug").eq("is_active", true),
    admin.from("use_case_pages").select("slug").eq("is_active", true).limit(2000),
    admin.from("prompt_pages").select("slug").eq("is_active", true).limit(2000),
  ]);

  const entries: string[] = [];

  // /ai-generators/[slug]
  for (const g of generators ?? []) {
    entries.push(url(`${SITE_URL}/ai-generators/${g.slug}`, "0.8", "weekly"));
  }

  // /use-cases/[slug] (generator persona pages)
  for (const uc of useCasePages ?? []) {
    entries.push(url(`${SITE_URL}/use-cases/${uc.slug}`, "0.7", "monthly"));
  }

  // /ai-prompts/[slug]
  for (const p of promptPages ?? []) {
    entries.push(url(`${SITE_URL}/ai-prompts/${p.slug}`, "0.6", "monthly"));
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
