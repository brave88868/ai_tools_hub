import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 80);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => ({}));
  // auto_approve_score: 0 = only manually approved; >0 = also auto-approve pending with score>=N
  const autoApproveScore = Number(body.auto_approve_score) || 0;
  const limit = Math.min(Number(body.limit) || 5, 20);

  const { admin } = auth;

  // Fetch opportunities to process
  const { data: opportunities } = await admin
    .from("tool_opportunities")
    .select("*")
    .or(
      autoApproveScore > 0
        ? `status.eq.approved,and(status.eq.pending,score.gte.${autoApproveScore})`
        : "status.eq.approved"
    )
    .limit(limit);

  if (!opportunities?.length) {
    return NextResponse.json({ success: true, created: 0, message: "No opportunities to process" });
  }

  // Load toolkit ID map
  const { data: toolkits } = await admin.from("toolkits").select("id, slug");
  const toolkitMap = new Map(
    (toolkits ?? []).map((t: { id: string; slug: string }) => [t.slug, t.id])
  );

  const created: Array<{ name: string; slug: string }> = [];

  for (const opp of opportunities) {
    const toolkitId = toolkitMap.get(opp.toolkit_slug);
    if (!toolkitId) {
      console.warn(`[auto-create-tool] Unknown toolkit_slug: ${opp.toolkit_slug}`);
      continue;
    }

    // Check slug uniqueness
    const { data: existing } = await admin
      .from("tools")
      .select("id")
      .eq("slug", opp.tool_slug)
      .maybeSingle();

    if (existing) {
      await admin.from("tool_opportunities").update({ status: "rejected" }).eq("id", opp.id);
      continue;
    }

    try {
      const prompt = `You are building a production-quality AI tool for a SaaS platform.

Tool name: "${opp.tool_name}"
Category: "${opp.toolkit_slug}"
Description: "${opp.description}"
Target keyword: "${opp.keyword}"

Generate a complete, high-quality tool configuration.

PROMPT TEMPLATE REQUIREMENTS:
- Start with STEP 1: Internal Analysis (AI thinks through the task silently)
- Then produce structured, professional output with clear headings
- Use {variable_name} placeholders for user inputs
- Be specific, practical, and results-oriented
- Length: 150-300 words

INPUTS SCHEMA REQUIREMENTS:
- 2-4 input fields max (keep it simple)
- Each field: {"name":"snake_case","label":"Display Label","type":"textarea|text","placeholder":"helpful hint","required":true}
- Primary input should be "textarea" type

Return ONLY valid JSON:
{
  "prompt_template": "STEP 1: INTERNAL ANALYSIS\\n...\\n\\nNow generate the output:\\n...",
  "inputs_schema": [{"name":"...","label":"...","type":"textarea","placeholder":"...","required":true}],
  "seo_title": "max 60 chars, include keyword",
  "seo_description": "max 155 chars, clear value proposition"
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const config = JSON.parse(completion.choices[0].message.content ?? "{}");
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
        created.push({ name: opp.tool_name, slug: finalSlug });
      } else {
        console.error(`[auto-create-tool] Insert error for ${finalSlug}:`, error);
      }
    } catch (err) {
      console.error(`[auto-create-tool] slug=${opp.tool_slug}`, err);
    }
  }

  return NextResponse.json({ success: true, created: created.length, tools: created });
}
