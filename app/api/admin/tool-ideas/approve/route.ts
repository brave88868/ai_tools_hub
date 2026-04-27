import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import { createAdminClient } from "@/lib/supabase";
import { openai } from "@/lib/openai";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function normalizeInputsSchema(schema: unknown): object[] {
  if (!Array.isArray(schema)) return [];
  return schema.map((field) => {
    if (!field || typeof field !== "object") return field as object;
    const f = field as Record<string, unknown>;
    if (f.type !== "select" || !Array.isArray(f.options)) return f as object;
    const normalizedOptions = (f.options as unknown[])
      .map((opt) => {
        if (typeof opt === "string") return opt;
        if (opt && typeof opt === "object") {
          const o = opt as Record<string, unknown>;
          const label = typeof o.label === "string" ? o.label : "";
          const value = typeof o.value === "string" ? o.value : "";
          return label || value || "";
        }
        return "";
      })
      .filter((s) => s.length > 0);
    return { ...f, options: normalizedOptions };
  });
}

async function generateToolAssets(
  toolName: string,
  description: string
): Promise<{ inputs_schema: object[]; prompt_template: string }> {
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `You are building an AI tool called "${toolName}".
Description: ${description}

Generate:
1. inputs_schema: 2-4 user input fields. Each field has: name, label, type, placeholder, required (bool).
   - type must be one of: "textarea", "text", "select"
   - If type is "select", you MUST also include "options": an ARRAY OF STRINGS (NOT objects).
     CORRECT format: "options": ["Beginner", "Intermediate", "Advanced"]
     WRONG format: "options": [{"label":"Beginner","value":"beginner"}]
   - If type is "textarea" or "text", do NOT include options.
2. prompt_template: A detailed, high-quality AI prompt (600+ words) using {variable} placeholders matching the input field names. Include:
   - Clear role/persona for the AI
   - Step-by-step analysis instructions (STEP 1: internal analysis)
   - Structured output format with sections
   - Professional tone
   - Specific, actionable guidance

Return JSON:
{
  "inputs_schema": [
    {"name":"text_input","label":"Text Input","type":"textarea","placeholder":"...","required":true},
    {"name":"choice","label":"Choice","type":"select","options":["Option A","Option B","Option C"],"required":true}
  ],
  "prompt_template": "full detailed prompt with {variable} placeholders"
}`,
      },
    ],
  });

  const raw = res.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as {
    inputs_schema?: object[];
    prompt_template?: string;
  };

  const rawSchema = parsed.inputs_schema ?? [
    { name: "input", label: "Your Input", type: "textarea", placeholder: "Enter details...", required: true },
  ];
  return {
    inputs_schema: normalizeInputsSchema(rawSchema),
    prompt_template: parsed.prompt_template ?? `You are an expert AI assistant for ${toolName}. Help the user with: {input}`,
  };
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { id, action } = await req.json();
  if (!id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const admin = createAdminClient();

  if (action === "reject") {
    const { error } = await admin.from("tool_ideas").update({ status: "rejected" }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, status: "rejected" });
  }

  // approve: load idea
  const { data: idea, error: ideaErr } = await admin
    .from("tool_ideas")
    .select("*")
    .eq("id", id)
    .single();

  if (ideaErr || !idea) {
    return NextResponse.json({ error: "Tool idea not found" }, { status: 404 });
  }

  // look up toolkit_id
  const { data: toolkit } = await admin
    .from("toolkits")
    .select("id")
    .eq("slug", idea.toolkit_slug)
    .single();

  if (!toolkit) {
    return NextResponse.json({ error: `Toolkit not found: ${idea.toolkit_slug}` }, { status: 400 });
  }

  // generate inputs_schema + prompt_template via OpenAI
  let inputs_schema: object[];
  let prompt_template: string;

  if (idea.prompt_template && idea.inputs_schema) {
    // already has assets from tool_ideas
    inputs_schema = idea.inputs_schema;
    prompt_template = idea.prompt_template;
  } else {
    try {
      const assets = await generateToolAssets(idea.tool_name, idea.description ?? "");
      inputs_schema = assets.inputs_schema;
      prompt_template = assets.prompt_template;
    } catch (err) {
      return NextResponse.json({ error: `OpenAI error: ${(err as Error).message}` }, { status: 500 });
    }
  }

  // build slug (dedup if needed)
  const baseSlug = idea.tool_slug ?? toSlug(idea.tool_name);
  const { data: existing } = await admin.from("tools").select("id").eq("slug", baseSlug).maybeSingle();
  const finalSlug = existing ? `${baseSlug}-${Date.now()}` : baseSlug;

  // insert into tools
  const { error: insertErr } = await admin.from("tools").insert({
    slug: finalSlug,
    name: idea.tool_name,
    description: idea.description ?? "",
    toolkit_id: toolkit.id,
    tool_type: "template",
    inputs_schema,
    prompt_template,
    is_active: true,
    auto_generated: true,
    generated_by: "tool_ideas",
    seo_title: idea.seo_title ?? `${idea.tool_name} | AI Tools Station`,
    seo_description: idea.seo_description ?? idea.description ?? "",
  });

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // mark idea as approved
  await admin.from("tool_ideas").update({ status: "approved" }).eq("id", id);

  return NextResponse.json({ ok: true, status: "approved", tool_slug: finalSlug });
}
