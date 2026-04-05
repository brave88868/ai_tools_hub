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
    { data: comparisons },
    { data: alternatives },
    { data: industries },
    { data: problems },
    { data: workflows },
    { data: keywordPages },
    { data: templates },
    { data: examples },
    { data: guides },
    { data: intents },
    { data: flatUseCases },
    { data: flatComparisons },
    { data: flatAlternatives },
    { data: flatProblems },
  ] = await Promise.all([
    supabase.from("tools").select("slug, created_at").eq("is_active", true),
    supabase.from("toolkits").select("slug, created_at").eq("is_active", true),
    supabase.from("tool_use_cases").select("slug, created_at").then(
      (res) => res,
      () => ({ data: null })
    ),
    supabase.from("blog_posts").select("slug, updated_at").eq("published", true),
    supabase.from("seo_comparisons").select("slug, created_at").then(
      (res) => res,
      () => ({ data: null })
    ),
    supabase.from("seo_alternatives").select("slug, created_at").then(
      (res) => res,
      () => ({ data: null })
    ),
    supabase.from("seo_industries").select("slug, created_at").then(
      (res) => res,
      () => ({ data: null })
    ),
    supabase.from("seo_problems").select("slug, created_at").then(
      (res) => res,
      () => ({ data: null })
    ),
    supabase.from("seo_workflows").select("slug, created_at").then(
      (res) => res,
      () => ({ data: null })
    ),
    supabase.from("seo_keyword_pages").select("slug, created_at").then(
      (res) => res,
      () => ({ data: null })
    ),
    supabase.from("seo_templates").select("slug, created_at").then(
      (res) => res,
      () => ({ data: null })
    ),
    supabase.from("seo_examples").select("slug, created_at").then(
      (res) => res,
      () => ({ data: null })
    ),
    supabase.from("seo_guides").select("slug, created_at").then(
      (res) => res,
      () => ({ data: null })
    ),
    supabase.from("seo_intents").select("slug, created_at").then(
      (res) => res,
      () => ({ data: null })
    ),
    // 扁平路由
    supabase.from("seo_use_cases").select("slug, created_at").then(
      (res) => res,
      () => ({ data: null })
    ),
    supabase.from("seo_comparisons").select("flat_slug, created_at").not("flat_slug", "is", null).then(
      (res) => res,
      () => ({ data: null })
    ),
    supabase.from("seo_alternatives").select("flat_slug, created_at").not("flat_slug", "is", null).then(
      (res) => res,
      () => ({ data: null })
    ),
    supabase.from("seo_problems").select("flat_slug, created_at").not("flat_slug", "is", null).then(
      (res) => res,
      () => ({ data: null })
    ),
  ]);

  const now = new Date().toISOString();

  return [
    // 静态页面
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE_URL}/toolkits`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/features`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/roadmap`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },

    // Toolkit 页面
    ...(toolkits ?? []).map((kit) => ({
      url: `${SITE_URL}/toolkits/${kit.slug}`,
      lastModified: kit.created_at ?? now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),

    // 工具页面
    ...(tools ?? []).map((tool) => ({
      url: `${SITE_URL}/tools/${tool.slug}`,
      lastModified: tool.created_at ?? now,
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

    // 对比页面
    ...(comparisons ?? []).map((row) => ({
      url: `${SITE_URL}/compare/${row.slug}`,
      lastModified: row.created_at ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),

    // 替代品页面
    ...(alternatives ?? []).map((row) => ({
      url: `${SITE_URL}/alternatives/${row.slug}`,
      lastModified: row.created_at ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),

    // 行业页面
    ...(industries ?? []).map((row) => ({
      url: `${SITE_URL}/ai-tools-for/${row.slug}`,
      lastModified: row.created_at ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),

    // 问题解决页面
    ...(problems ?? []).map((row) => ({
      url: `${SITE_URL}/problems/${row.slug}`,
      lastModified: row.created_at ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),

    // 工作流页面
    ...(workflows ?? []).map((row) => ({
      url: `${SITE_URL}/workflows/${row.slug}`,
      lastModified: row.created_at ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),

    // 关键词页面
    ...(keywordPages ?? []).map((row) => ({
      url: `${SITE_URL}/tools/keyword/${row.slug}`,
      lastModified: row.created_at ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),

    // 模板页面
    ...(templates ?? []).map((row) => ({
      url: `${SITE_URL}/templates/${row.slug}`,
      lastModified: row.created_at ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),

    // 示例页面
    ...(examples ?? []).map((row) => ({
      url: `${SITE_URL}/examples/${row.slug}`,
      lastModified: row.created_at ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),

    // 指南页面
    ...(guides ?? []).map((row) => ({
      url: `${SITE_URL}/guides/${row.slug}`,
      lastModified: row.created_at ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.72,
    })),

    // 意图页面
    ...(intents ?? []).map((row) => ({
      url: `${SITE_URL}/best-ai-tools/${row.slug}`,
      lastModified: row.created_at ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),

    // ── 扁平路由（根路径，高 SEO 权重）──────────────────────────────
    // Use Case 页面
    ...(flatUseCases ?? []).map((row) => ({
      url: `${SITE_URL}/${row.slug}`,
      lastModified: row.created_at ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),

    // Comparison 页面（flat_slug）
    ...(flatComparisons ?? []).map((row: { flat_slug: string | null; created_at: string | null }) => ({
      url: `${SITE_URL}/${row.flat_slug}`,
      lastModified: row.created_at ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),

    // Alternatives 页面（flat_slug）
    ...(flatAlternatives ?? []).map((row: { flat_slug: string | null; created_at: string | null }) => ({
      url: `${SITE_URL}/${row.flat_slug}`,
      lastModified: row.created_at ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),

    // Problems 页面（flat_slug）
    ...(flatProblems ?? []).map((row: { flat_slug: string | null; created_at: string | null }) => ({
      url: `${SITE_URL}/${row.flat_slug}`,
      lastModified: row.created_at ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.72,
    })),
  ];
}
