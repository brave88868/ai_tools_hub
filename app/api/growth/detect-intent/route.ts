import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type IntentType = "tool" | "guide" | "example" | "template" | "comparison" | "problem" | "list";

function buildTargetInfo(keyword: string, intent: IntentType): { target_slug: string; target_table: string } {
  const base = keyword.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 80);

  switch (intent) {
    case "tool":
      return { target_slug: base, target_table: "seo_keyword_pages" };
    case "guide":
      return { target_slug: `how-to-${base}`, target_table: "seo_guides" };
    case "example":
      return { target_slug: `${base}-examples`, target_table: "seo_examples" };
    case "template":
      return { target_slug: `${base}-template`, target_table: "seo_templates" };
    case "comparison":
      // comparison 需要两个工具名，标记为 skip
      return { target_slug: base, target_table: "seo_comparisons" };
    case "problem":
      return { target_slug: base, target_table: "seo_problems" };
    case "list":
      return { target_slug: base, target_table: "seo_intents" };
    default:
      return { target_slug: base, target_table: "seo_keyword_pages" };
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const limit: number = Math.min(parseInt(body.limit ?? "30", 10), 100);

  const { admin } = auth;

  // 取 pending/processing 状态的关键词
  const { data: pendingKws } = await admin
    .from("growth_keywords")
    .select("id, keyword")
    .in("status", ["pending", "processing"])
    .limit(limit);

  if (!pendingKws || pendingKws.length === 0) {
    return NextResponse.json({ classified: 0, breakdown: {} });
  }

  const keywords = pendingKws.map((k: { keyword: string }) => k.keyword);

  let results: Array<{ keyword: string; intent: IntentType }> = [];

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "user",
        content: `Classify each keyword into one of these intents:
- tool: user wants a tool/generator/maker
- guide: user wants to learn how to do something
- example: user wants to see examples
- template: user wants a template
- comparison: user wants to compare tools
- problem: user wants to solve a specific problem
- list: user wants a list of tools/resources

Keywords to classify:
${JSON.stringify(keywords)}

Return JSON: { "results": [{ "keyword": "...", "intent": "..." }, ...] }`,
      }],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(res.choices[0].message.content ?? "{}");
    results = (parsed.results ?? []) as Array<{ keyword: string; intent: IntentType }>;
  } catch (err) {
    console.error("[detect-intent] OpenAI error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  // 取已存在的 keyword_intents 去重
  const { data: existingIntents } = await admin.from("keyword_intents").select("keyword");
  const existingIntentSet = new Set((existingIntents ?? []).map((r: { keyword: string }) => r.keyword.toLowerCase()));

  const breakdown: Record<string, number> = {};
  let classified = 0;

  const kwIdMap = new Map(pendingKws.map((k: { id: string; keyword: string }) => [k.keyword, k.id]));

  for (const result of results) {
    if (!result.keyword || !result.intent) continue;
    if (existingIntentSet.has(result.keyword.toLowerCase())) continue;

    // comparison 需要两个工具名，跳过自动生成
    if (result.intent === "comparison") {
      breakdown["comparison"] = (breakdown["comparison"] ?? 0) + 1;
      continue;
    }

    const { target_slug, target_table } = buildTargetInfo(result.keyword, result.intent);

    const { error } = await admin.from("keyword_intents").insert({
      keyword: result.keyword,
      intent: result.intent,
      target_slug,
      target_table,
      status: "pending",
    });

    if (!error) {
      classified++;
      existingIntentSet.add(result.keyword.toLowerCase());
      breakdown[result.intent] = (breakdown[result.intent] ?? 0) + 1;
    }
  }

  // 批量更新对应 growth_keywords status = done
  const processedIds = results
    .map((r) => kwIdMap.get(r.keyword))
    .filter(Boolean) as string[];

  if (processedIds.length > 0) {
    await admin.from("growth_keywords").update({ status: "done" }).in("id", processedIds);
  }

  return NextResponse.json({ classified, breakdown });
}
