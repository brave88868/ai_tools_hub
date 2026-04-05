import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import { openai } from "@/lib/openai";
import {
  PROFESSIONS,
  toProfessionSlug,
  toPageSlug,
} from "@/lib/seo-keywords";

const CONCURRENCY = 5;
const TIMEOUT_MS = 25_000;

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();
  const { admin } = auth;

  const body = await req.json().catch(() => ({}));
  const count = Math.min(Number(body.count ?? 20), 50);
  const toolSlugFilter: string | undefined = body.tool_slug;
  const generateAll: boolean = body.all === true;

  // 1. 取工具列表
  let toolsQuery = admin.from("tools").select("slug, name").eq("is_active", true);
  if (toolSlugFilter) toolsQuery = toolsQuery.eq("slug", toolSlugFilter);
  else if (!generateAll) toolsQuery = toolsQuery.order("sort_order").limit(20);
  const { data: tools } = await toolsQuery;

  if (!tools || tools.length === 0) {
    return NextResponse.json({ error: "No tools found" }, { status: 400 });
  }

  // 2. 取已存在 slug
  const { data: existing } = await admin
    .from("seo_pages")
    .select("slug")
    .eq("type", "use_case");
  const existingSet = new Set((existing ?? []).map((r: { slug: string }) => r.slug));
  const totalExisting = existingSet.size;

  // 3. 构建待生成队列
  const queue: Array<{ tool: { slug: string; name: string }; profession: string; slug: string }> = [];
  for (const tool of tools) {
    for (const profession of PROFESSIONS) {
      const profSlug = toProfessionSlug(profession);
      const slug = toPageSlug(tool.slug, profSlug);
      if (!existingSet.has(slug)) {
        queue.push({ tool, profession, slug });
      }
    }
  }

  // 随机打乱并截取
  queue.sort(() => Math.random() - 0.5);
  const batch = queue.slice(0, count);

  // 4. 并发生成（最多 CONCURRENCY 个并发）
  let generated = 0;
  let skipped = 0;

  async function generateOne(item: typeof batch[0]): Promise<void> {
    const { tool, profession, slug } = item;
    const profSlug = toProfessionSlug(profession);

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const completion = await openai.chat.completions.create(
        {
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "user",
              content: `Write an SEO-optimized landing page for:

Tool: ${tool.name}
Target user: ${profession}s

Structure:

**Introduction** (2 paragraphs)
Why ${profession}s need AI assistance for this task.

**How ${tool.name} Helps ${profession}s**
Specific workflows and use cases for this profession.

**3 Key Benefits**
Concrete, measurable benefits with specific examples.

**Step-by-Step Example**
A real-world example of a ${profession} using this tool.

**Getting Started**
How to begin using the tool immediately.

Target length: 900-1100 words.
Include natural keyword variations.

Return JSON:
{
  "title": "AI ${tool.name} for ${profession}s | AI Tools Hub",
  "seo_title": "max 60 chars",
  "seo_description": "max 155 chars",
  "content": "full markdown content"
}`,
            },
          ],
          max_tokens: 1600,
        },
        { signal: controller.signal }
      );

      clearTimeout(timer);

      const raw = completion.choices[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(raw) as {
        title?: string;
        seo_title?: string;
        seo_description?: string;
        content?: string;
      };

      const row = {
        slug,
        type: "use_case",
        title: parsed.title ?? `AI ${tool.name} for ${profession}s`,
        seo_title: parsed.seo_title ?? `AI ${tool.name} for ${profession}s | AI Tools Hub`,
        seo_description:
          parsed.seo_description ??
          `How ${profession}s use ${tool.name} to work smarter and faster.`,
        content: parsed.content ?? "",
        tool_slug: tool.slug,
        meta: { profession: profSlug, tool_name: tool.name },
      };

      const { error } = await admin.from("seo_pages").insert(row);
      if (!error) generated++;
      else skipped++;
    } catch {
      skipped++;
    }
  }

  // Chunked concurrency
  for (let i = 0; i < batch.length; i += CONCURRENCY) {
    const chunk = batch.slice(i, i + CONCURRENCY);
    await Promise.allSettled(chunk.map(generateOne));
  }

  // Fire-and-forget sitemap ping
  if (generated > 0) {
    const reqUrl = new URL("https://aitoolsstation.com/api/seo/ping");
    fetch(reqUrl.toString()).catch(() => {});
  }

  return NextResponse.json({ generated, skipped, total_existing: totalExisting });
}
