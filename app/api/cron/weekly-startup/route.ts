import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const cronAuth = `Bearer ${process.env.CRON_SECRET}`;
  const admin = createAdminClient();

  const steps: Record<string, unknown> = {};

  // Step 1: Discover 5 opportunities
  try {
    const res = await fetch(`${APP_URL}/api/operator/discover-opportunities`, {
      method: "POST",
      headers: { Authorization: cronAuth, "Content-Type": "application/json" },
      body: JSON.stringify({ count: 5 }),
    });
    steps.discover = res.ok ? await res.json() : { error: "fetch failed" };
  } catch (err) {
    steps.discover = { error: String(err) };
    console.error("[cron/weekly-startup] discover failed", err);
  }

  // Step 2: Analyze 3 opportunities
  try {
    const res = await fetch(`${APP_URL}/api/operator/analyze-market`, {
      method: "POST",
      headers: { Authorization: cronAuth, "Content-Type": "application/json" },
      body: JSON.stringify({ count: 3 }),
    });
    steps.analyze = res.ok ? await res.json() : { error: "fetch failed" };
  } catch (err) {
    steps.analyze = { error: String(err) };
    console.error("[cron/weekly-startup] analyze failed", err);
  }

  // Step 3: Generate startup ideas for high-score analyzed opportunities
  const generatedIdeas: unknown[] = [];
  try {
    const { data: topOpps } = await admin
      .from("startup_opportunities")
      .select("id, keyword, score")
      .eq("status", "analyzed")
      .gte("score", 70)
      .order("score", { ascending: false })
      .limit(3);

    for (const opp of topOpps ?? []) {
      try {
        const res = await fetch(`${APP_URL}/api/operator/generate-startup`, {
          method: "POST",
          headers: { Authorization: cronAuth, "Content-Type": "application/json" },
          body: JSON.stringify({ opportunity_id: (opp as { id: string }).id }),
        });
        if (res.ok) {
          const d = await res.json();
          generatedIdeas.push(d.idea);
        }
      } catch (err) {
        console.error("[cron/weekly-startup] generate-startup failed for", (opp as { id: string }).id, err);
      }
    }
    steps.generate = { generated: generatedIdeas.length, ideas: generatedIdeas };
  } catch (err) {
    steps.generate = { error: String(err) };
    console.error("[cron/weekly-startup] generate step failed", err);
  }

  console.log("[cron/weekly-startup] completed", JSON.stringify(steps));
  return Response.json({ success: true, steps });
}
