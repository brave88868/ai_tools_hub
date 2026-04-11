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
    { data: templatePages },
    { data: comparisons },
    { data: alternatives },
  ] = await Promise.all([
    admin.from("generators").select("slug").eq("is_active", true),
    admin.from("use_case_pages").select("slug").eq("is_active", true).limit(2000),
    admin.from("prompt_pages").select("slug").eq("is_active", true).limit(2000),
    admin.from("template_pages").select("slug").eq("is_active", true).limit(2000),
    admin.from("seo_comparisons").select("slug").not("content", "is", null).limit(5000),
    admin.from("seo_alternatives").select("slug").not("content", "is", null).limit(5000),
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

  // /templates/[slug] (generator template pages)
  for (const t of templatePages ?? []) {
    entries.push(url(`${SITE_URL}/templates/${t.slug}`, "0.65", "monthly"));
  }

  // /compare/[slug] (comparison articles with content)
  for (const c of comparisons ?? []) {
    entries.push(url(`${SITE_URL}/compare/${c.slug}`, "0.7", "monthly"));
  }

  // /alternatives/[slug] (alternatives articles with content)
  for (const a of alternatives ?? []) {
    entries.push(url(`${SITE_URL}/alternatives/${a.slug}`, "0.7", "monthly"));
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
