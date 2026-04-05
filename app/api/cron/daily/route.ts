import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 80);
}

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  const results: Record<string, unknown> = {};

  // ── 1. 生成 20 个新 SEO 关键词 ─────────────────────────────────────
  try {
    const toolkits = ["jobseeker", "creator", "marketing", "business", "legal", "exam"];
    const selected = toolkits[new Date().getDay() % toolkits.length]; // 每天轮换 toolkit

    const kwPrompt = `Generate 20 SEO blog keywords for an AI tools site focused on "${selected}". 3-8 words each.
Return ONLY: {"keywords":["keyword 1",...]}`;

    const kwRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: kwPrompt }],
      temperature: 0.8,
      response_format: { type: "json_object" },
    });

    const { keywords = [] } = JSON.parse(kwRes.choices[0].message.content ?? "{}");
    let kwAdded = 0;
    for (const kw of keywords as string[]) {
      const { error } = await admin.from("seo_keywords").insert({
        keyword: kw.toLowerCase().trim(),
        category: "blog",
        toolkit_slug: selected,
        status: "pending",
      });
      if (!error) kwAdded++;
    }
    results.keywords_added = kwAdded;
  } catch (err) {
    results.keywords_error = (err as Error).message;
  }

  // ── 2. 生成 3 篇博客文章 ─────────────────────────────────────────────
  try {
    const { data: pendingKw } = await admin
      .from("seo_keywords")
      .select("id, keyword, toolkit_slug")
      .eq("status", "pending")
      .limit(3);

    let articlesGenerated = 0;
    for (const kw of pendingKw ?? []) {
      const prompt = `Write a 800-1000 word SEO blog article about: "${kw.keyword}" for an AI tools platform.
Markdown format, practical tone, ## headings. No H1 in content.
Return ONLY valid JSON:
{"title":"max 70 chars","excerpt":"2 sentences","seo_title":"max 60 chars","seo_description":"max 155 chars","content":"full markdown"}`;

      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.75,
        response_format: { type: "json_object" },
      });

      const article = JSON.parse(res.choices[0].message.content ?? "{}");
      const baseSlug = slugify(article.title ?? kw.keyword);
      const { data: existing } = await admin.from("blog_posts").select("id").eq("slug", baseSlug).single();
      const finalSlug = existing ? `${baseSlug}-${Date.now()}` : baseSlug;

      const { error } = await admin.from("blog_posts").insert({
        slug: finalSlug, title: article.title, excerpt: article.excerpt,
        content: article.content, seo_title: article.seo_title,
        seo_description: article.seo_description, keywords: kw.keyword,
        published: true, auto_generated: true,
      });

      if (!error) {
        await admin.from("seo_keywords").update({ status: "used" }).eq("id", kw.id);
        articlesGenerated++;
      }
    }
    results.articles_generated = articlesGenerated;
  } catch (err) {
    results.articles_error = (err as Error).message;
  }

  // ── 3. 发现 3 个新工具 idea ─────────────────────────────────────────
  try {
    const toolkits = ["jobseeker", "creator", "marketing", "business", "legal", "exam"];
    const selected = toolkits[(new Date().getDay() + 1) % toolkits.length];

    const { data: existing } = await admin.from("tools").select("slug");
    const { data: existingIdeas } = await admin.from("tool_ideas").select("tool_slug");
    const usedSlugs = new Set([
      ...(existing ?? []).map((t: { slug: string }) => t.slug),
      ...(existingIdeas ?? []).map((i: { tool_slug: string }) => i.tool_slug),
    ]);

    const ideaPrompt = `Generate 3 new AI tool ideas for "${selected}" toolkit.
Avoid: ${[...usedSlugs].slice(0, 10).join(", ")}
Return ONLY: {"tools":[{"tool_name":"...","tool_slug":"...","description":"...","prompt_template":"...","seo_title":"...","seo_description":"..."}]}`;

    const ideaRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: ideaPrompt }],
      temperature: 0.9,
      response_format: { type: "json_object" },
    });

    const { tools: ideas = [] } = JSON.parse(ideaRes.choices[0].message.content ?? "{}");
    let ideasAdded = 0;
    for (const idea of ideas as Array<Record<string, string>>) {
      if (!idea.tool_slug || usedSlugs.has(idea.tool_slug)) continue;
      const { error } = await admin.from("tool_ideas").insert({ ...idea, toolkit_slug: selected, status: "pending" });
      if (!error) ideasAdded++;
    }
    results.ideas_added = ideasAdded;
  } catch (err) {
    results.ideas_error = (err as Error).message;
  }

  console.log("[cron/daily]", results);
  return Response.json({ success: true, ...results });
}
