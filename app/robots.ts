import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/admin"],
      },
    ],
    sitemap: [
      "https://www.aitoolsstation.com/sitemap-index.xml",
      "https://www.aitoolsstation.com/sitemap-generators.xml",
    ],
  };
}
