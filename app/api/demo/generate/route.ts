import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { input, systemPrompt } = await req.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("ANTHROPIC_API_KEY is not set");
      return NextResponse.json(
        { text: "AI service unavailable. Please try the full tool." },
        { status: 200 }
      );
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        system: systemPrompt ?? "You are a helpful assistant.",
        messages: [{ role: "user", content: input }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic API error:", err);
      return NextResponse.json(
        { text: "Generation failed. Please try the full tool." },
        { status: 200 }
      );
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? "No output generated.";
    return NextResponse.json({ text });
  } catch (error) {
    console.error("Route error:", error);
    return NextResponse.json(
      { text: "Something went wrong. Please try the full tool." },
      { status: 200 }
    );
  }
}
