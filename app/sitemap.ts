import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase";
import { getUseCases, getCompares, getProfessions } from "@/lib/seo/loaders";

const SITE_URL = "https://aitoolsstation.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient();

  const [{ data: tools }, { data: toolkits }] = await Promise.all([
    supabase.from("tools").select("slug, updated_at").eq("is_active", true),
    supabase.from("toolkits").select("slug, updated_at").eq("is_active", true),
  ]);

  const useCases = getUseCases();
  const compares = getCompares();
  const professions = getProfessions();

  const now = new Date().toISOString();

  return [
    // Static pages
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/toolkits`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/pricing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },

    // Toolkit pages
    ...(toolkits ?? []).map((kit) => ({
      url: `${SITE_URL}/toolkits/${kit.slug}`,
      lastModified: kit.updated_at ?? now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),

    // Tool detail pages
    ...(tools ?? []).map((tool) => ({
      url: `${SITE_URL}/tools/${tool.slug}`,
      lastModified: tool.updated_at ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),

    // Use-case pages
    ...useCases.map((uc) => ({
      url: `${SITE_URL}/use-case/${uc.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),

    // Compare pages
    ...compares.map((c) => ({
      url: `${SITE_URL}/compare/${c.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),

    // Profession / ai-tools-for pages
    ...professions.map((p) => ({
      url: `${SITE_URL}/ai-tools-for/${p.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
