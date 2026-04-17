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
    const prompt = `Write a comprehensive, in-depth SEO blog article about: "${kw.keyword}".

STRICT REQUIREMENTS (non-negotiable):
- MINIMUM 1200 words of actual article content (aim for 1400-1500)
- Use ## markdown headings to organize at least 5 distinct sections
- Include at least 2 concrete examples or step-by-step walkthroughs
- End with an FAQ section containing 3-5 realistic user questions
- Write in clear, practical, human tone — not marketing fluff
- Do NOT pad with generic intros like "In today's fast-paced world..."
- Do NOT repeat the keyword excessively — integrate naturally
- No H1 in content (the page template adds it separately)

Return ONLY valid JSON (no markdown code fences, no preamble):
{"title":"SEO-optimized title, max 60 chars, keyword-rich","excerpt":"2-sentence summary for article preview, 150-200 chars","seo_title":"meta title, max 60 chars, can match title","seo_description":"meta description, exactly 150-160 chars, include keyword + hook","content":"full markdown article, MUST be 1200+ words"}`;

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.75,
      max_tokens: 3500,
      response_format: { type: "json_object" },
    });

    const article = JSON.parse(res.choices[0].message.content ?? "{}");

    // Reject thin content — enforce minimum word count before saving
    const wordCount = (article.content ?? "").split(/\s+/).filter(Boolean).length;
    if (wordCount < 1000) {
      console.warn(`[cron/generate-blog] thin content: ${wordCount} words for "${kw.keyword}"`);
      await admin.from("seo_keywords").update({ status: "failed" }).eq("id", kw.id);
      return Response.json({ success: false, reason: "thin_content", word_count: wordCount });
    }

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
