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

  const { data: pendingKw } = await admin
    .from("seo_keywords")
    .select("id, keyword, toolkit_slug")
    .eq("status", "pending")
    .limit(3);

  let articlesGenerated = 0;
  const errors: string[] = [];

  for (const kw of pendingKw ?? []) {
    try {
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
    } catch (err) {
      errors.push((err as Error).message);
    }
  }

  console.log(`[cron/generate-blog] generated=${articlesGenerated} errors=${errors.length}`);
  return Response.json({ success: true, articles_generated: articlesGenerated, errors });
}
