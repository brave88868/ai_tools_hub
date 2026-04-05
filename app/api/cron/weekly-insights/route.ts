import { NextRequest, NextResponse } from "next/server";
import { generateWeeklyInsights } from "@/lib/insights/generate";

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await generateWeeklyInsights();

  if ("skipped" in result) {
    return NextResponse.json({ success: true, message: "already generated this week" });
  }

  return NextResponse.json(result);
}
