import type { MetadataRoute } from "next";

const SITE_URL = "https://aitoolsstation.com";

/**
 * /sitemap.xml — Sitemap Index
 * Lists all sub-sitemaps. Each sub-sitemap is served as a Route Handler.
 * Submit /sitemap-index.xml to Google Search Console for full coverage.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/sitemap-main.xml` },
    { url: `${SITE_URL}/sitemap-tools.xml` },
    { url: `${SITE_URL}/sitemap-seo.xml` },
    { url: `${SITE_URL}/sitemap-blog.xml` },
  ];
}
