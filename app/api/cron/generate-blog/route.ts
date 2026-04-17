import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import OpenAI from "openai";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 80);
}

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();

  // Process exactly 1 pending keyword per invocation
  const { data: pendingKw } = await admin
    .from("seo_keywords")
    .select("id, keyword, toolkit_slug")
    .eq("status", "pending")
    .limit(1);

  const kw = pendingKw?.[0];
  if (!kw) {
    return Response.json({ success: true, articles_generated: 0, message: "no pending keywords" });
  }

  try {
    const prompt = `Write a 600-800 word SEO blog article about: "${kw.keyword}" for an AI tools platform.
Markdown format, practical tone, ## headings. No H1 in content.
Return ONLY valid JSON:
{"title":"max 70 chars","excerpt":"2 sentences","seo_title":"max 60 chars","seo_description":"max 155 chars","content":"full markdown"}`;

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.75,
      max_tokens: 1200,
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
      console.log(`[cron/generate-blog] generated: ${finalSlug}`);
      return Response.json({ success: true, articles_generated: 1, slug: finalSlug });
    }

    await admin.from("seo_keywords").update({ status: "failed" }).eq("id", kw.id);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  } catch (err) {
    await admin.from("seo_keywords").update({ status: "failed" }).eq("id", kw.id);
    console.error("[cron/generate-blog] error", err);
    return Response.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
