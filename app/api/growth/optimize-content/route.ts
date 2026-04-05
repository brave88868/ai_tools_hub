import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface RankingRow {
  keyword: string;
  page_url: string;
  position: number;
  clicks: number;
  impressions: number;
}

interface ContentRow {
  seo_title?: string;
  content?: string;
}

// 根据 URL 前缀判断内容来自哪张表
function resolveTable(pageUrl: string): { table: string; slugField: string } | null {
  const path = pageUrl.replace(/^https?:\/\/[^/]+/, "");
  if (path.startsWith("/tools/keyword/")) return { table: "seo_keyword_pages", slugField: "slug" };
  if (path.startsWith("/templates/"))     return { table: "seo_templates",     slugField: "slug" };
  if (path.startsWith("/examples/"))      return { table: "seo_examples",      slugField: "slug" };
  if (path.startsWith("/guides/"))        return { table: "seo_guides",        slugField: "slug" };
  if (path.startsWith("/best-ai-tools/")) return { table: "seo_intents",       slugField: "slug" };
  if (path.startsWith("/problems/"))      return { table: "seo_problems",      slugField: "slug" };
  if (path.startsWith("/workflows/"))     return { table: "seo_workflows",     slugField: "slug" };
  if (path.startsWith("/compare/"))       return { table: "seo_comparisons",   slugField: "slug" };
  if (path.startsWith("/alternatives/"))  return { table: "seo_alternatives",  slugField: "slug" };
  if (path.startsWith("/tools/"))         return { table: "tools",             slugField: "slug" };
  if (path.startsWith("/blog/"))          return { table: "blog_posts",        slugField: "slug" };
  return null;
}

function extractSlug(pageUrl: string): string {
  return pageUrl.split("/").pop() ?? "";
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const limit: number = Math.min(parseInt(body.limit ?? "10", 10), 20);

  const { admin } = auth;

  // 取有曝光但少点击的页面（有潜力但 CTR 低）
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: lowCtrPages } = await admin
    .from("seo_rankings")
    .select("keyword, page_url, position, clicks, impressions")
    .gte("recorded_at", weekAgo)
    .lt("clicks", 5)
    .gt("impressions", 10)
    .order("impressions", { ascending: false })
    .limit(limit);

  if (!lowCtrPages || lowCtrPages.length === 0) {
    return NextResponse.json({
      suggestions: [],
      message: "No low-CTR pages found. Import ranking data first via POST /api/growth/import-rankings.",
    });
  }

  const suggestions: Array<{
    page_url: string;
    keyword: string;
    position: number;
    new_title: string;
    new_description: string;
    content_suggestions: string[];
    internal_links: string[];
  }> = [];

  for (const page of lowCtrPages as RankingRow[]) {
    try {
      // 根据 URL 找到内容
      const tableInfo = resolveTable(page.page_url);
      let seoTitle = "";
      let contentPreview = "";

      if (tableInfo) {
        const slug = extractSlug(page.page_url);
        const { data: contentRow } = await admin
          .from(tableInfo.table)
          .select("seo_title, content")
          .eq(tableInfo.slugField, slug)
          .single();

        const row = contentRow as ContentRow | null;
        seoTitle = row?.seo_title ?? "";
        contentPreview = (row?.content ?? "").slice(0, 500);
      }

      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: `Analyze this SEO page and suggest improvements.

Page URL: ${page.page_url}
Target keyword: ${page.keyword}
Current position: ${page.position ?? "unknown"}
Clicks: ${page.clicks}, Impressions: ${page.impressions}

Current title: ${seoTitle || "(not found)"}
Current content summary: ${contentPreview || "(not found)"}

Suggest:
1. Better title (max 60 chars, include keyword)
2. Better meta description (max 155 chars, compelling, include keyword)
3. Content improvements (3 specific actionable suggestions)
4. Internal linking opportunities (2-3 related page types to link to)

Return JSON: {
  "new_title": "...",
  "new_description": "...",
  "content_suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "internal_links": ["link suggestion 1", "link suggestion 2"]
}`,
        }],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const suggestion = JSON.parse(res.choices[0].message.content ?? "{}");
      suggestions.push({
        page_url: page.page_url,
        keyword: page.keyword,
        position: page.position ?? 0,
        new_title: suggestion.new_title ?? "",
        new_description: suggestion.new_description ?? "",
        content_suggestions: suggestion.content_suggestions ?? [],
        internal_links: suggestion.internal_links ?? [],
      });
    } catch (err) {
      console.error(`[optimize-content] error for ${page.page_url}:`, err);
    }
  }

  return NextResponse.json({ suggestions, analysed: lowCtrPages.length });
}
