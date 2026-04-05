import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import { createAdminClient } from "@/lib/supabase";
import { openai } from "@/lib/openai";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  let admin: ReturnType<typeof createAdminClient>;
  if (isCron) {
    admin = createAdminClient();
  } else {
    const auth = await requireAdmin(req);
    if (!auth) return unauthorized();
    admin = auth.admin;
  }

  const body = await req.json().catch(() => ({}));
  const count = Math.min(Number(body.count ?? 5), 20);

  // 取工具列表
  const { data: tools } = await admin
    .from("tools")
    .select("slug, name")
    .eq("is_active", true)
    .order("sort_order")
    .limit(40);

  if (!tools || tools.length === 0) {
    return NextResponse.json({ error: "No tools found" }, { status: 400 });
  }

  // 已有 template slug
  const { data: existing } = await admin
    .from("seo_pages")
    .select("slug")
    .eq("type", "template");
  const existingSet = new Set((existing ?? []).map((r: { slug: string }) => r.slug));

  const remaining = tools.filter((t) => !existingSet.has(`${t.slug}-template`));

  if (remaining.length === 0) {
    return NextResponse.json({ generated: 0, message: "All templates already generated" });
  }

  let generated = 0;
  let skipped = 0;
  let lastError: string | undefined;
  const toProcess = remaining.slice(0, count);

  for (const tool of toProcess) {
    const slug = `${tool.slug}-template`;
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: `Create a template page for: "${tool.name} Template"

Include:
1. What this template is for (1 paragraph)
2. The full template with [PLACEHOLDERS] in brackets
3. 3 filled-in examples showing the template in use
4. Customization tips
5. How to use AI to fill in this template automatically

Return JSON: { "title": "string", "seo_title": "max 60 chars", "seo_description": "max 155 chars", "content": "markdown" }`,
          },
        ],
        max_tokens: 1400,
      });

      const raw = completion.choices[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(raw) as {
        title?: string;
        seo_title?: string;
        seo_description?: string;
        content?: string;
      };

      const title = parsed.title ?? `${tool.name} Template — Free AI Template`;
      const seoTitle = parsed.seo_title ?? `Free ${tool.name} Template | AI Tools Hub`;
      const seoDesc = parsed.seo_description ?? `Download a free ${tool.name} template. Edit with AI in seconds.`;

      const { error } = await admin.from("seo_pages").insert({
        slug,
        type: "template",
        title,
        seo_title: seoTitle,
        seo_description: seoDesc,
        content: parsed.content ?? "",
        tool_slug: tool.slug,
        meta: { tool_name: tool.name },
      });

      if (!error) {
        generated++;
        // 同步 seo_templates
        await admin.from("seo_templates").upsert({
          slug,
          tool_slug: tool.slug,
          title,
          seo_title: seoTitle,
          seo_description: seoDesc,
          content: parsed.content ?? "",
        }, { onConflict: "slug", ignoreDuplicates: true });
      } else {
        lastError = error.message;
        skipped++;
      }
    } catch (err) {
      lastError = (err as Error).message;
      skipped++;
    }
  }

  if (generated > 0) fetch("https://aitoolsstation.com/api/seo/ping").catch(() => {});

  return NextResponse.json({ generated, skipped, lastError });
}
