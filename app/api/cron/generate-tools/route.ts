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
  const toolkits = ["jobseeker", "creator", "marketing", "business", "legal", "exam"];
  const selected = toolkits[(new Date().getDay() + 1) % toolkits.length];

  // ── 1. Legacy tool ideas (tool_ideas table) ────────────────────────
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

  // ── 2. Auto-create tools from high-score opportunities ────────────
  let autoCreated = 0;
  try {
    const { data: opportunities } = await admin
      .from("tool_opportunities")
      .select("*")
      .or("status.eq.approved,and(status.eq.pending,score.gte.80)")
      .limit(3);

    if (opportunities?.length) {
      const { data: toolkitRows } = await admin.from("toolkits").select("id, slug");
      const toolkitMap = new Map(
        (toolkitRows ?? []).map((t: { id: string; slug: string }) => [t.slug, t.id])
      );

      for (const opp of opportunities) {
        const toolkitId = toolkitMap.get(opp.toolkit_slug);
        if (!toolkitId) continue;

        const { data: dupCheck } = await admin.from("tools").select("id").eq("slug", opp.tool_slug).maybeSingle();
        if (dupCheck) {
          await admin.from("tool_opportunities").update({ status: "rejected" }).eq("id", opp.id);
          continue;
        }

        const genPrompt = `Build a production AI tool configuration for "${opp.tool_name}" (${opp.toolkit_slug} toolkit).
Description: "${opp.description}"
Return ONLY valid JSON:
{"prompt_template":"STEP 1: INTERNAL ANALYSIS\\n...\\n\\nNow generate output:\\n...","inputs_schema":[{"name":"...","label":"...","type":"textarea","placeholder":"...","required":true}],"seo_title":"max 60 chars","seo_description":"max 155 chars"}`;

        const genRes = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: genPrompt }],
          temperature: 0.7,
          response_format: { type: "json_object" },
        });

        const config = JSON.parse(genRes.choices[0].message.content ?? "{}");
        const finalSlug = opp.tool_slug || slugify(opp.tool_name);

        const { error } = await admin.from("tools").upsert({
          toolkit_id: toolkitId,
          slug: finalSlug,
          name: opp.tool_name,
          description: opp.description,
          tool_type: "template",
          prompt_template: config.prompt_template ?? null,
          inputs_schema: config.inputs_schema ?? null,
          output_format: "markdown",
          seo_title: config.seo_title ?? null,
          seo_description: config.seo_description ?? null,
          auto_generated: true,
          is_active: false,
          sort_order: 999,
        }, { onConflict: "slug", ignoreDuplicates: true });

        if (!error) {
          await admin.from("tool_opportunities").update({ status: "created" }).eq("id", opp.id);
          autoCreated++;
        }
      }
    }
  } catch (err) {
    console.error("[cron/generate-tools] auto-create step failed", err);
  }

  console.log(`[cron/generate-tools] toolkit=${selected} ideas_added=${ideasAdded} auto_created=${autoCreated}`);
  return Response.json({ success: true, toolkit: selected, ideas_added: ideasAdded, auto_created: autoCreated });
}
