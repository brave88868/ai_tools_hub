import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export async function POST(req: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
  }

  const { input, systemPrompt } = await req.json();

  if (!input?.trim() || !systemPrompt) {
    return NextResponse.json({ error: "Missing input or systemPrompt" }, { status: 400 });
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: "user", content: input }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[demo/generate]", res.status, err);
    return NextResponse.json({ error: "Generation failed" }, { status: 502 });
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? "";
  return NextResponse.json({ text });
}
