import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import OpenAI from "openai";
import {
  COMPETITOR_TOOLS,
  PROBLEM_SLUGS,
  WORKFLOW_SLUGS,
  INDUSTRY_SLUGS,
  KEYWORD_MODIFIERS,
  INTENT_SLUGS,
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

  // ── SEO Multiplier content generation ──────────────────────────────────────
  const multiplierStats = { keyword_pages: 0, templates: 0, examples: 0, guides: 0, intents: 0 };

  // 10 keyword pages
  try {
    const { data: tools } = await admin.from("tools").select("slug, name").eq("is_active", true).limit(20);
    const { data: existingKw } = await admin.from("seo_keyword_pages").select("slug");
    const existingKwSet = new Set((existingKw ?? []).map((r: { slug: string }) => r.slug));
    const kwCandidates: { keyword: string; slug: string; tool_slug: string }[] = [];
    for (const tool of tools ?? []) {
      for (const mod of KEYWORD_MODIFIERS) {
        const slug = `${tool.slug}-${mod}`;
        if (!existingKwSet.has(slug)) kwCandidates.push({ keyword: `${tool.name} ${mod}`, slug, tool_slug: tool.slug });
      }
    }
    const kwToGen = kwCandidates.sort(() => Math.random() - 0.5).slice(0, 10);
    for (const item of kwToGen) {
      try {
        const res = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: `Write a 600-word SEO page about "${item.keyword}" AI tool. Include: what it does, key features, who it's for, how to start. Return ONLY JSON: {"seo_title":"max 60 chars","seo_description":"max 155 chars","content":"markdown"}` }],
          temperature: 0.7, response_format: { type: "json_object" },
        });
        const article = JSON.parse(res.choices[0].message.content ?? "{}");
        const { error } = await admin.from("seo_keyword_pages").insert({
          keyword: item.keyword, slug: item.slug, tool_slug: item.tool_slug,
          seo_title: article.seo_title, seo_description: article.seo_description, content: article.content,
        });
        if (!error) multiplierStats.keyword_pages++;
      } catch { /* skip */ }
    }
  } catch { /* skip */ }

  // 3 templates
  try {
    const { data: tools } = await admin.from("tools").select("slug, name").eq("is_active", true).limit(20);
    const { data: existingTmpl } = await admin.from("seo_templates").select("slug");
    const existingTmplSet = new Set((existingTmpl ?? []).map((r: { slug: string }) => r.slug));
    const tmplCandidates = (tools ?? []).filter((t) => !existingTmplSet.has(`${t.slug}-template`)).slice(0, 3);
    for (const tool of tmplCandidates) {
      const slug = `${tool.slug}-template`;
      try {
        const res = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: `Write 700-word SEO page about "${tool.name} Template". Include: what it is, structure, example, tips, how AI helps. Return ONLY JSON: {"template_name":"string","seo_title":"max 60 chars","seo_description":"max 155 chars","content":"markdown"}` }],
          temperature: 0.7, response_format: { type: "json_object" },
        });
        const article = JSON.parse(res.choices[0].message.content ?? "{}");
        const { error } = await admin.from("seo_templates").insert({
          template_name: article.template_name ?? `${tool.name} Template`, slug, tool_slug: tool.slug,
          seo_title: article.seo_title, seo_description: article.seo_description, content: article.content,
        });
        if (!error) multiplierStats.templates++;
      } catch { /* skip */ }
    }
  } catch { /* skip */ }

  // 3 examples
  try {
    const { data: tools } = await admin.from("tools").select("slug, name").eq("is_active", true).limit(20);
    const { data: existingExmp } = await admin.from("seo_examples").select("slug");
    const existingExmpSet = new Set((existingExmp ?? []).map((r: { slug: string }) => r.slug));
    const exmpCandidates = (tools ?? []).filter((t) => !existingExmpSet.has(`${t.slug}-examples`)).slice(0, 3);
    for (const tool of exmpCandidates) {
      const slug = `${tool.slug}-examples`;
      try {
        const res = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: `Write 700-word SEO page showing real examples of "${tool.name}" AI tool outputs. Include: 3 before/after examples, what makes great output, mistakes to avoid. Return ONLY JSON: {"example_type":"string","seo_title":"max 60 chars","seo_description":"max 155 chars","content":"markdown"}` }],
          temperature: 0.7, response_format: { type: "json_object" },
        });
        const article = JSON.parse(res.choices[0].message.content ?? "{}");
        const { error } = await admin.from("seo_examples").insert({
          example_type: article.example_type ?? `${tool.name} Examples`, slug, tool_slug: tool.slug,
          seo_title: article.seo_title, seo_description: article.seo_description, content: article.content,
        });
        if (!error) multiplierStats.examples++;
      } catch { /* skip */ }
    }
  } catch { /* skip */ }

  // 5 guides
  try {
    const { data: tools } = await admin.from("tools").select("slug, name").eq("is_active", true).limit(10);
    const { data: existingGds } = await admin.from("seo_guides").select("slug");
    const existingGdsSet = new Set((existingGds ?? []).map((r: { slug: string }) => r.slug));
    const guideActions = ["write", "create", "generate", "optimize", "improve"];
    const gdsCandidates: { slug: string; tool_slug: string; topic: string }[] = [];
    for (const tool of tools ?? []) {
      for (const action of guideActions) {
        const slug = `how-to-${action}-with-${tool.slug}`;
        if (!existingGdsSet.has(slug)) gdsCandidates.push({ slug, tool_slug: tool.slug, topic: `How to ${action} with ${tool.name}` });
      }
    }
    const gdsToGen = gdsCandidates.sort(() => Math.random() - 0.5).slice(0, 5);
    for (const item of gdsToGen) {
      try {
        const res = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: `Write 700-word step-by-step guide: "${item.topic}". Include: overview, 5-7 steps, tips, mistakes to avoid, FAQ (2q). Return ONLY JSON: {"guide_topic":"string","seo_title":"max 60 chars","seo_description":"max 155 chars","content":"markdown"}` }],
          temperature: 0.7, response_format: { type: "json_object" },
        });
        const article = JSON.parse(res.choices[0].message.content ?? "{}");
        const { error } = await admin.from("seo_guides").insert({
          guide_topic: article.guide_topic ?? item.topic, slug: item.slug, tool_slug: item.tool_slug,
          seo_title: article.seo_title, seo_description: article.seo_description, content: article.content,
        });
        if (!error) multiplierStats.guides++;
      } catch { /* skip */ }
    }
  } catch { /* skip */ }

  // 2 intent pages
  try {
    const { data: existingInts } = await admin.from("seo_intents").select("slug");
    const existingIntsSet = new Set((existingInts ?? []).map((r: { slug: string }) => r.slug));
    const intCandidates = pickRandom(INTENT_SLUGS, existingIntsSet, (i) => i.slug, 2);
    for (const item of intCandidates) {
      try {
        const res = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: `Write 800-word SEO page: "Best AI Tools for ${item.intent} in 2025". Include: why AI matters, top 5 tools, how to choose, quick start, FAQ (3q). Return ONLY JSON: {"seo_title":"max 60 chars","seo_description":"max 155 chars","content":"markdown"}` }],
          temperature: 0.7, response_format: { type: "json_object" },
        });
        const article = JSON.parse(res.choices[0].message.content ?? "{}");
        const { error } = await admin.from("seo_intents").insert({
          intent: item.intent, slug: item.slug, category: item.category,
          seo_title: article.seo_title, seo_description: article.seo_description, content: article.content,
        });
        if (!error) multiplierStats.intents++;
      } catch { /* skip */ }
    }
  } catch { /* skip */ }

  console.log(`[cron/generate-blog] multiplier=${JSON.stringify(multiplierStats)}`);
  return Response.json({ success: true, articles_generated: articlesGenerated, seo: seoStats, multiplier: multiplierStats, errors });
}
