import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildVariants(name: string, keyword: string): string[] {
  const n = name.toLowerCase();
  const k = keyword.toLowerCase();
  return [
    `${n} free`,
    `${n} online`,
    `${n} examples`,
    `${n} tips`,
    `${n} for beginners`,
    `best ${k}`,
    `${k} tool`,
    `how to ${k}`,
    `${k} generator free`,
    `${k} ai`,
    `${k} tutorial`,
    `${k} online free`,
    `${k} software`,
    `${k} app`,
    `${k} website`,
    `free ${k} generator`,
    `ai ${k} generator`,
    `${k} for students`,
    `${k} for professionals`,
    `${k} step by step`,
  ];
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { admin } = auth;
  const body = await req.json();
  const { project_id, count = 20 } = body as { project_id: string; count?: number };

  if (!project_id) {
    return NextResponse.json({ error: "project_id is required" }, { status: 400 });
  }

  const { data: project, error: projectError } = await admin
    .from("saas_projects")
    .select("id, name, slug, keyword, tagline, description")
    .eq("id", project_id)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const variants = buildVariants(project.name, project.keyword ?? project.name).slice(0, count);

  let generated = 0;
  const CONCURRENCY = 5;

  for (let i = 0; i < variants.length; i += CONCURRENCY) {
    const batch = variants.slice(i, i + CONCURRENCY);
    await Promise.allSettled(
      batch.map(async (variant) => {
        const slug = `${project.slug}-${variant.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

        const prompt = `Write a 500-word SEO page about "${variant}".
Include: what it is, key features, how to use, examples, FAQ (2 questions).
Return ONLY JSON: {"seo_title":"max 60 chars","seo_description":"max 155 chars","content":"markdown"}`;

        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 25000);

          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            response_format: { type: "json_object" },
          }, { signal: controller.signal as Parameters<typeof openai.chat.completions.create>[1] extends { signal?: AbortSignal } ? AbortSignal : never });
          clearTimeout(timeout);

          const parsed = JSON.parse(completion.choices[0].message.content ?? "{}");
          const { seo_title, seo_description, content } = parsed;

          await admin.from("seo_pages").upsert(
            {
              slug,
              title: seo_title ?? variant,
              meta_description: seo_description ?? "",
              content: content ?? "",
              type: "saas_page",
              tool_slug: project.slug,
              seo_title: seo_title ?? variant,
              seo_description: seo_description ?? "",
            },
            { onConflict: "slug" }
          );

          generated++;
        } catch {
          // skip failed variant
        }
      })
    );
  }

  // Update seo_pages_count
  await admin
    .from("saas_projects")
    .update({ seo_pages_count: generated })
    .eq("id", project_id);

  return NextResponse.json({ success: true, generated, project_id });
}
