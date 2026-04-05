import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import { POST as generateUseCases } from "@/app/api/seo/generate-use-cases/route";
import { POST as generateComparisons } from "@/app/api/seo/generate-comparisons/route";
import { POST as generateProblems } from "@/app/api/seo/generate-problems/route";
import { POST as generateTemplates } from "@/app/api/seo/generate-templates/route";
import { POST as generateAlternatives } from "@/app/api/seo/generate-alternatives/route";
import { POST as generateAiFor } from "@/app/api/seo/generate-ai-for/route";

/**
 * POST /api/seo/generate
 * SSE streaming bulk generator — sends real-time progress to the client.
 * Auth: Admin Bearer token or CRON_SECRET.
 *
 * Uses direct function calls (no HTTP fetch) to avoid auth issues.
 * Generates ~27 pages:
 *   10 use cases + 5 comparisons + 3 problems + 2 templates + 2 alternatives + 5 ai-for
 */

export const maxDuration = 300; // 5 min (Vercel Pro)

// 构造带 CRON_SECRET 的内部 Request，绕过 HTTP 网络层
function makeInternalReq(body: object): NextRequest {
  return new NextRequest(
    new URL("/internal", "http://localhost"),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
      body: JSON.stringify(body),
    }
  );
}

const tasks = [
  { label: "Generating use cases (10)…",    handler: generateUseCases,    body: { count: 10 } },
  { label: "Generating comparisons (5)…",    handler: generateComparisons,  body: { count: 5 } },
  { label: "Generating problems (3)…",        handler: generateProblems,     body: { count: 3 } },
  { label: "Generating templates (2)…",       handler: generateTemplates,    body: { count: 2 } },
  { label: "Generating alternatives (2)…",    handler: generateAlternatives, body: { count: 2 } },
  { label: "Generating AI-for pages (5)…",    handler: generateAiFor,        body: { count: 5 } },
];

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isCron) {
    const auth = await requireAdmin(req);
    if (!auth) return unauthorized();
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      let totalGenerated = 0;
      const results: Record<string, unknown> = {};

      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        send({ message: task.label, step: i + 1, total_steps: tasks.length });

        try {
          const res = await task.handler(makeInternalReq(task.body));
          const data = await res.json().catch(() => ({})) as {
            generated?: number;
            skipped?: number;
            lastError?: string;
            error?: string;
            message?: string;
          };

          if (!res.ok) {
            const errMsg = data.error ?? `HTTP ${res.status}`;
            results[task.label] = data;
            send({ message: `✗ ${task.label.replace("…", "")} — ${errMsg}`, step: i + 1 });
            continue;
          }

          const generated = data.generated ?? 0;
          const skipped = data.skipped ?? 0;
          const lastError = data.lastError;
          totalGenerated += generated;
          results[task.label] = data;

          let detail = `${generated} generated`;
          if (skipped > 0) detail += `, ${skipped} skipped`;
          if (generated === 0 && lastError) detail += ` (err: ${lastError.slice(0, 80)})`;
          else if (generated === 0 && data.message) detail += ` (${data.message})`;

          send({ message: `✓ ${task.label.replace("…", "")} — ${detail}`, step: i + 1 });
        } catch (err) {
          const errMsg = (err as Error).message;
          results[task.label] = { error: errMsg };
          send({ message: `✗ ${task.label.replace("…", "")} — ${errMsg}`, step: i + 1 });
        }
      }

      send({ message: "DONE", total_generated: totalGenerated, results });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// GET for Vercel Cron (non-streaming, returns JSON)
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};
  for (const task of tasks) {
    try {
      const res = await task.handler(makeInternalReq(task.body));
      results[task.label] = await res.json().catch(() => ({}));
    } catch (err) {
      results[task.label] = { error: String(err) };
    }
  }

  return NextResponse.json({ ok: true, results });
}
