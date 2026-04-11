import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const OPENAI_KEY = process.env.OPENAI_API_KEY ?? "";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.aitoolsstation.com";
const CRON_SECRET = process.env.CRON_SECRET ?? "";

const CONCURRENCY = 3;
const BATCH_LIMIT = 10;

async function openaiChat(prompt: string, maxTokens = 1200): Promise<Record<string, string>> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return JSON.parse(data.choices[0]?.message?.content ?? "{}");
}

async function processInBatches<T>(
  items: T[],
  fn: (item: T) => Promise<void>
): Promise<{ ok: number; fail: number }> {
  const results = { ok: 0, fail: 0 };
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    await Promise.allSettled(
      items.slice(i, i + CONCURRENCY).map(async (item) => {
        try {
          await fn(item);
          results.ok++;
        } catch {
          results.fail++;
        }
      })
    );
  }
  return results;
}

export async function GET(req: NextRequest) {
  // Auth check
  const authHeader = req.headers.get("authorization");
  const cronSecret = req.nextUrl.searchParams.get("secret");
  const isAuthorized =
    authHeader === `Bearer ${CRON_SECRET}` ||
    cronSecret === CRON_SECRET ||
    req.headers.get("x-vercel-cron") === "1";

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const log: string[] = [];

  // ── Step 1: Fill seo_comparisons ──────────────────────────────────────────
  try {
    const { data: comparisons } = await supabase
      .from("seo_comparisons")
      .select("id, slug, tool_a, tool_b")
      .is("content", null)
      .limit(BATCH_LIMIT);

    const rows = comparisons ?? [];
    log.push(`comparisons_pending: ${rows.length}`);

    const r = await processInBatches(rows, async (row) => {
      const result = await openaiChat(
        `Write a detailed SEO comparison article: "${row.tool_a}" vs "${row.tool_b}".
Return ONLY valid JSON:
{
  "content": "800-1000 word Markdown comparison with: intro, feature comparison table (Markdown syntax), pros/cons for each tool, pricing comparison, who each is best for, and conclusion with recommendation."
}`,
        1600
      );
      await supabase
        .from("seo_comparisons")
        .update({ content: result.content ?? "" })
        .eq("id", row.id);
    });
    log.push(`comparisons_filled: ${r.ok}, fail: ${r.fail}`);
  } catch (e) {
    log.push(`comparisons_error: ${(e as Error).message?.slice(0, 100)}`);
  }

  // ── Step 2: Fill seo_alternatives ─────────────────────────────────────────
  try {
    const { data: alternatives } = await supabase
      .from("seo_alternatives")
      .select("id, slug, tool_name")
      .is("content", null)
      .limit(BATCH_LIMIT);

    const rows = alternatives ?? [];
    log.push(`alternatives_pending: ${rows.length}`);

    const r = await processInBatches(rows, async (row) => {
      const result = await openaiChat(
        `Write a detailed SEO article: best alternatives to "${row.tool_name}".
Return ONLY valid JSON:
{
  "content": "700-900 word Markdown article with: intro, list of 5-7 alternatives (each with a short paragraph), comparison table (tool/best-for/price columns), and conclusion. Mention AI Tools Station as one alternative."
}`,
        1600
      );
      await supabase
        .from("seo_alternatives")
        .update({ content: result.content ?? "" })
        .eq("id", row.id);
    });
    log.push(`alternatives_filled: ${r.ok}, fail: ${r.fail}`);
  } catch (e) {
    log.push(`alternatives_error: ${(e as Error).message?.slice(0, 100)}`);
  }

  // ── Step 3: Fill template_pages ───────────────────────────────────────────
  try {
    const { data: templates } = await supabase
      .from("template_pages")
      .select("id, slug, title, generator_id")
      .is("template_content", null)
      .eq("is_active", true)
      .limit(BATCH_LIMIT);

    const rows = templates ?? [];
    log.push(`templates_pending: ${rows.length}`);

    // Fetch generator titles
    const genIds = [...new Set(rows.map((r) => r.generator_id).filter(Boolean))];
    const genMap: Record<string, { title: string }> = {};
    if (genIds.length) {
      const { data: gens } = await supabase
        .from("generators")
        .select("id, title")
        .in("id", genIds);
      (gens ?? []).forEach((g) => { genMap[g.id] = g; });
    }

    const r = await processInBatches(rows, async (row) => {
      const gen = genMap[row.generator_id ?? ""];
      const toolName = gen?.title ?? row.title;
      const isExample = row.slug.endsWith("-example");

      const result = await openaiChat(
        isExample
          ? `Write a realistic, complete AI-generated example for: ${toolName.toLowerCase()}. Write actual content (not instructions). Use concrete details.
Return ONLY valid JSON:
{ "template_content": "200-300 word example output as Markdown" }`
          : `Create a professional, structured template for: ${toolName.toLowerCase()}. Use [PLACEHOLDER] format.
Return ONLY valid JSON:
{ "template_content": "200-300 word template as Markdown with [PLACEHOLDERS] and section headers" }`,
        800
      );
      await supabase
        .from("template_pages")
        .update({ template_content: result.template_content ?? "" })
        .eq("id", row.id);
    });
    log.push(`templates_filled: ${r.ok}, fail: ${r.fail}`);
  } catch (e) {
    log.push(`templates_error: ${(e as Error).message?.slice(0, 100)}`);
  }

  // ── Step 4: Ping sitemap ───────────────────────────────────────────────────
  try {
    const pingRes = await fetch(`${SITE_URL}/api/seo/ping`, {
      signal: AbortSignal.timeout(15000),
    });
    log.push(`sitemap_ping: ${pingRes.status}`);
  } catch (e) {
    log.push(`sitemap_ping_error: ${(e as Error).message?.slice(0, 80)}`);
  }

  return NextResponse.json({ ok: true, log, ts: new Date().toISOString() });
}
