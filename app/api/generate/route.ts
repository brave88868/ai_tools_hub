import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt, systemPrompt } = await req.json();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { text: "AI service unavailable. Please try the full tool." },
        { status: 200 }
      );
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 400,
        messages: [
          { role: "system", content: systemPrompt ?? "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI API error:", err);
      return NextResponse.json(
        { text: "Generation failed. Please try the full tool." },
        { status: 200 }
      );
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? "No output generated.";
    return NextResponse.json({ text });
  } catch (error) {
    console.error("Route error:", error);
    return NextResponse.json(
      { text: "Something went wrong. Please try the full tool." },
      { status: 200 }
    );
  }
}
