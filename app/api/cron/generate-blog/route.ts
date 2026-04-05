import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import OpenAI from "openai";
import {
  COMPETITOR_TOOLS,
  PROBLEM_SLUGS,
  WORKFLOW_SLUGS,
  INDUSTRY_SLUGS,
  slugToTitle,
} from "@/lib/seo/seo-constants";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 80);
}

function pickRandom<T>(arr: T[], exclude: Set<string>, keyFn: (item: T) => string, n: number): T[] {
  const candidates = arr.filter((item) => !exclude.has(keyFn(item)));
  const shuffled = candidates.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
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

  // ── SEO content generation ──────────────────────────────────────────────
  const seoStats = { comparisons: 0, alternatives: 0, problems: 0, workflows: 0, industries: 0 };

  // 3 comparisons
  try {
    const { data: tools } = await admin.from("tools").select("slug, name").eq("is_active", true);
    const { data: existingComps } = await admin.from("seo_comparisons").select("slug");
    const existingCompSet = new Set((existingComps ?? []).map((r: { slug: string }) => r.slug));
    let compAttempts = 0;
    while (seoStats.comparisons < 3 && compAttempts < 20 && tools && tools.length >= 2) {
      compAttempts++;
      const idxA = Math.floor(Math.random() * tools.length);
      let idxB = Math.floor(Math.random() * tools.length);
      while (idxB === idxA) idxB = Math.floor(Math.random() * tools.length);
      const toolA = tools[idxA];
      const toolB = tools[idxB];
      const slug = `${toolA.slug}-vs-${toolB.slug}`;
      if (existingCompSet.has(slug) || existingCompSet.has(`${toolB.slug}-vs-${toolA.slug}`)) continue;
      try {
        const res = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: `Compare AI tools for SEO. Tool A: ${toolA.name}. Tool B: ${toolB.name}. Write 700-word comparison article. Return ONLY JSON: {"title":"string","seo_title":"max 60 chars","seo_description":"max 155 chars","content":"markdown"}` }],
          temperature: 0.7,
          response_format: { type: "json_object" },
        });
        const article = JSON.parse(res.choices[0].message.content ?? "{}");
        const { error } = await admin.from("seo_comparisons").insert({
          slug, tool_a: toolA.name, tool_b: toolB.name,
          title: article.title, seo_title: article.seo_title,
          seo_description: article.seo_description, content: article.content,
        });
        if (!error) { existingCompSet.add(slug); seoStats.comparisons++; }
      } catch { /* skip */ }
    }
  } catch { /* skip */ }

  // 2 alternatives
  try {
    const { data: existingAlts } = await admin.from("seo_alternatives").select("slug");
    const existingAltSet = new Set((existingAlts ?? []).map((r: { slug: string }) => r.slug));
    const altCandidates = pickRandom(
      COMPETITOR_TOOLS,
      existingAltSet,
      (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-alternatives",
      2
    );
    for (const toolName of altCandidates) {
      const slug = toolName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-alternatives";
      try {
        const res = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: `Write SEO article: "Top 10 Alternatives to ${toolName}". Return ONLY JSON: {"title":"string","seo_title":"max 60 chars","seo_description":"max 155 chars","content":"markdown 700 words"}` }],
          temperature: 0.7,
          response_format: { type: "json_object" },
        });
        const article = JSON.parse(res.choices[0].message.content ?? "{}");
        const { error } = await admin.from("seo_alternatives").insert({
          slug, tool_name: toolName, title: article.title,
          seo_title: article.seo_title, seo_description: article.seo_description, content: article.content,
        });
        if (!error) seoStats.alternatives++;
      } catch { /* skip */ }
    }
  } catch { /* skip */ }

  // 2 problems
  try {
    const { data: existingProbs } = await admin.from("seo_problems").select("slug");
    const existingProbSet = new Set((existingProbs ?? []).map((r: { slug: string }) => r.slug));
    const probCandidates = pickRandom(PROBLEM_SLUGS, existingProbSet, (s) => s, 2);
    for (const problemSlug of probCandidates) {
      const problemTitle = slugToTitle(problemSlug);
      try {
        const res = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: `Write how-to guide: "${problemTitle}". Include steps, AI tools, examples. Return ONLY JSON: {"seo_title":"max 60 chars","seo_description":"max 155 chars","content":"markdown 700 words"}` }],
          temperature: 0.7,
          response_format: { type: "json_object" },
        });
        const article = JSON.parse(res.choices[0].message.content ?? "{}");
        const { error } = await admin.from("seo_problems").insert({
          slug: problemSlug, problem: problemTitle,
          seo_title: article.seo_title, seo_description: article.seo_description, content: article.content,
        });
        if (!error) seoStats.problems++;
      } catch { /* skip */ }
    }
  } catch { /* skip */ }

  // 1 workflow
  try {
    const { data: existingWfs } = await admin.from("seo_workflows").select("slug");
    const existingWfSet = new Set((existingWfs ?? []).map((r: { slug: string }) => r.slug));
    const wfCandidates = pickRandom(WORKFLOW_SLUGS, existingWfSet, (s) => s, 1);
    for (const wfSlug of wfCandidates) {
      const wfTitle = slugToTitle(wfSlug);
      try {
        const res = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: `Write workflow guide: "${wfTitle}". Include steps, AI tools, time estimates. Return ONLY JSON: {"seo_title":"max 60 chars","seo_description":"max 155 chars","content":"markdown 700 words"}` }],
          temperature: 0.7,
          response_format: { type: "json_object" },
        });
        const article = JSON.parse(res.choices[0].message.content ?? "{}");
        const { error } = await admin.from("seo_workflows").insert({
          slug: wfSlug, workflow: wfTitle,
          seo_title: article.seo_title, seo_description: article.seo_description, content: article.content,
        });
        if (!error) seoStats.workflows++;
      } catch { /* skip */ }
    }
  } catch { /* skip */ }

  // 1 industry
  try {
    const { data: existingInds } = await admin.from("seo_industries").select("slug");
    const existingIndSet = new Set((existingInds ?? []).map((r: { slug: string }) => r.slug));
    const indCandidates = pickRandom(INDUSTRY_SLUGS, existingIndSet, (s) => s, 1);
    for (const indSlug of indCandidates) {
      const indTitle = slugToTitle(indSlug);
      try {
        const res = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: `Write SEO page: "Best AI Tools for ${indTitle}". Include challenges, solutions, tool recommendations. Return ONLY JSON: {"seo_title":"max 60 chars","seo_description":"max 155 chars","content":"markdown 700 words"}` }],
          temperature: 0.7,
          response_format: { type: "json_object" },
        });
        const article = JSON.parse(res.choices[0].message.content ?? "{}");
        const { error } = await admin.from("seo_industries").insert({
          slug: indSlug, industry: indTitle,
          seo_title: article.seo_title, seo_description: article.seo_description, content: article.content,
        });
        if (!error) seoStats.industries++;
      } catch { /* skip */ }
    }
  } catch { /* skip */ }

  console.log(`[cron/generate-blog] seo=${JSON.stringify(seoStats)}`);
  return Response.json({ success: true, articles_generated: articlesGenerated, seo: seoStats, errors });
}
