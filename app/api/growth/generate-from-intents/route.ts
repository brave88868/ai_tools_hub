import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

type IntentType = "tool" | "guide" | "example" | "template" | "problem" | "list";

const INTENT_ENDPOINT_MAP: Record<IntentType, string> = {
  tool:     "/api/growth/generate-keyword-pages",
  guide:    "/api/growth/generate-guides",
  example:  "/api/growth/generate-examples",
  template: "/api/growth/generate-templates",
  problem:  "/api/growth/generate-problems",
  list:     "/api/growth/generate-intents",
};

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const limit: number = Math.min(parseInt(body.limit ?? "10", 10), 30);
  const intentFilter: string | undefined = body.intent;

  const { admin } = auth;

  // 取 Bearer token 用于内部 API 调用
  const token = req.headers.get("authorization") ?? "";

  // 从 keyword_intents 取 pending 记录
  let query = admin
    .from("keyword_intents")
    .select("id, keyword, intent, target_slug, target_table")
    .eq("status", "pending")
    .limit(limit);

  if (intentFilter) {
    query = query.eq("intent", intentFilter);
  }

  const { data: intents } = await query;

  if (!intents || intents.length === 0) {
    return NextResponse.json({ generated: 0, breakdown: {} });
  }

  let generated = 0;
  const breakdown: Record<string, number> = {};
  const errors: string[] = [];

  for (const item of intents as Array<{ id: string; keyword: string; intent: string; target_slug: string; target_table: string }>) {
    const intent = item.intent as IntentType;
    const endpoint = INTENT_ENDPOINT_MAP[intent];

    if (!endpoint) {
      // 跳过不支持的意图（如 comparison、list）
      await admin.from("keyword_intents").update({ status: "skip" }).eq("id", item.id);
      continue;
    }

    try {
      // 根据意图构建请求体
      let requestBody: Record<string, unknown> = {};

      if (intent === "tool") {
        // generate-keyword-pages 需要具体的工具关键词
        // 先从 tools 表找匹配的工具
        const { data: tools } = await admin
          .from("tools")
          .select("slug, name")
          .eq("is_active", true)
          .limit(5);

        const toolMatch = (tools ?? []).find((t: { name: string }) =>
          item.keyword.toLowerCase().includes(t.name.toLowerCase())
        );

        requestBody = {
          keyword: item.keyword,
          tool_slug: toolMatch?.slug ?? null,
          count: 1,
        };
      } else if (intent === "guide") {
        requestBody = { topic: item.keyword, count: 1 };
      } else if (intent === "example") {
        requestBody = { topic: item.keyword, count: 1 };
      } else if (intent === "template") {
        requestBody = { topic: item.keyword, count: 1 };
      } else if (intent === "problem") {
        // generate-problems 直接生成，传 slug
        requestBody = { slug: item.target_slug, count: 1 };
      } else if (intent === "list") {
        requestBody = { topic: item.keyword, count: 1 };
      }

      const res = await fetch(`${APP_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Authorization": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (res.ok) {
        generated++;
        breakdown[intent] = (breakdown[intent] ?? 0) + 1;
        await admin.from("keyword_intents").update({ status: "generated" }).eq("id", item.id);
      } else {
        const errData = await res.json().catch(() => ({}));
        errors.push(`${item.keyword}: ${errData.error ?? res.status}`);
        // 不更新状态，保持 pending，下次重试
      }
    } catch (err) {
      const msg = (err as Error).message;
      console.error(`[generate-from-intents] error for "${item.keyword}":`, msg);
      errors.push(`${item.keyword}: ${msg}`);
    }
  }

  return NextResponse.json({ generated, breakdown, errors: errors.slice(0, 10) });
}
