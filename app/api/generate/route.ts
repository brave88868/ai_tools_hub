import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
  }

  const { prompt, systemPrompt } = await req.json();

  if (!prompt?.trim() || !systemPrompt) {
    return NextResponse.json({ error: "Missing prompt or systemPrompt" }, { status: 400 });
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[api/generate]", res.status, err);
    return NextResponse.json({ error: "Generation failed" }, { status: 502 });
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? "Unable to generate. Please try the full tool.";
  return NextResponse.json({ text });
}
