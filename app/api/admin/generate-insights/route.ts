import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import { generateWeeklyInsights } from "@/lib/insights/generate";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const force: boolean = body.force ?? true;

  const result = await generateWeeklyInsights(force);
  return NextResponse.json(result);
}
