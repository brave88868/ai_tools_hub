import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase";

const SITE_URL = "https://aitoolsstation.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient();

  const [
    { data: tools },
    { data: toolkits },
    { data: useCases },
    { data: blogPosts },
  ] = await Promise.all([
    supabase.from("tools").select("slug, updated_at").eq("is_active", true),
    supabase.from("toolkits").select("slug, updated_at").eq("is_active", true),
    supabase.from("tool_use_cases").select("slug, created_at"),
    supabase.from("blog_posts").select("slug, updated_at").eq("published", true),
  ]);

  const now = new Date().toISOString();

  return [
    // 静态页面
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE_URL}/toolkits`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/features`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },

    // Toolkit 页面
    ...(toolkits ?? []).map((kit) => ({
      url: `${SITE_URL}/toolkits/${kit.slug}`,
      lastModified: kit.updated_at ?? now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),

    // 工具页面
    ...(tools ?? []).map((tool) => ({
      url: `${SITE_URL}/tools/${tool.slug}`,
      lastModified: tool.updated_at ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),

    // Use-case 页面（/tools/[slug]/[usecase]）
    ...(useCases ?? []).map((uc) => {
      // slug 格式：resume-optimizer-for-data-analyst
      // URL：/tools/resume-optimizer/for-data-analyst
      const parts = uc.slug.split("-for-");
      const toolSlug = parts[0];
      const usecase = parts.slice(1).join("-for-");
      return {
        url: `${SITE_URL}/tools/${toolSlug}/for-${usecase}`,
        lastModified: uc.created_at ?? now,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      };
    }),

    // 博客文章
    ...(blogPosts ?? []).map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.updated_at ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
