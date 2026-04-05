import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import { openai } from "@/lib/openai";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { admin } = auth;

  // Fetch features with more than 5 votes
  const { data: features } = await admin
    .from("features")
    .select("title, description, toolkit, votes, status")
    .gt("votes", 5)
    .order("votes", { ascending: false })
    .limit(50);

  if (!features || features.length === 0) {
    // Fall back to all features if none have 5+ votes
    const { data: allFeatures } = await admin
      .from("features")
      .select("title, description, toolkit, votes, status")
      .order("votes", { ascending: false })
      .limit(30);

    if (!allFeatures || allFeatures.length === 0) {
      return NextResponse.json({ analysis: "No feature requests found yet." });
    }

    return runAnalysis(allFeatures);
  }

  return runAnalysis(features);
}

async function runAnalysis(
  features: { title: string; description: string | null; toolkit: string | null; votes: number; status: string }[]
) {
  const featureList = features
    .map(
      (f, i) =>
        `${i + 1}. [${f.toolkit ?? "General"}] ${f.title} — ${f.votes} votes${
          f.description ? ` | ${f.description}` : ""
        }`
    )
    .join("\n");

  const prompt = `You are a product analyst. Analyse the following feature requests from users of an AI tools SaaS platform and provide a concise report.

Feature Requests:
${featureList}

Provide your analysis in this exact format:

## Top 3 Most Requested Categories
1. [Category] — [explanation]
2. [Category] — [explanation]
3. [Category] — [explanation]

## Common User Pain Points
- [Pain point 1]
- [Pain point 2]
- [Pain point 3]
- [Pain point 4]

## Suggested New Tools to Build
1. [Tool name] — [why users need it, which toolkit it fits]
2. [Tool name] — [why users need it, which toolkit it fits]
3. [Tool name] — [why users need it, which toolkit it fits]

## Summary
[2-3 sentence executive summary with the most important insight]

Keep each point concise and actionable.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.5,
    max_tokens: 800,
  });

  const analysis = response.choices[0]?.message?.content ?? "Analysis unavailable.";
  return NextResponse.json({ analysis });
}
