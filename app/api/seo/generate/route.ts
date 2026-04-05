import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";

/**
 * POST /api/seo/generate
 * SSE streaming bulk generator — sends real-time progress to the client.
 * Auth: Admin Bearer token or CRON_SECRET.
 *
 * Generates ~27 pages:
 *   10 use cases + 5 comparisons + 3 problems + 2 templates + 2 alternatives + 5 ai-for
 */

export const maxDuration = 300; // 5 min (Vercel Pro)

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isCron) {
    const auth = await requireAdmin(req);
    if (!auth) return unauthorized();
  }

  // Derive appUrl from the request so internal calls work on Vercel
  const reqUrl = new URL(req.url);
  const appUrl = `${reqUrl.protocol}//${reqUrl.host}`;

  const tasks = [
    { label: "Generating use cases (10)…",      path: "/api/seo/generate-use-cases",  body: { count: 10 } },
    { label: "Generating comparisons (5)…",      path: "/api/seo/generate-comparisons", body: { count: 5 } },
    { label: "Generating problems (3)…",          path: "/api/seo/generate-problems",    body: { count: 3 } },
    { label: "Generating templates (2)…",         path: "/api/seo/generate-templates",   body: { count: 2 } },
    { label: "Generating alternatives (2)…",      path: "/api/seo/generate-alternatives",body: { count: 2 } },
    { label: "Generating AI-for pages (5)…",      path: "/api/seo/generate-ai-for",      body: { count: 5 } },
  ];

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      let totalGenerated = 0;
      const results: Record<string, unknown> = {};

      for (const task of tasks) {
        send({ message: task.label, step: tasks.indexOf(task) + 1, total_steps: tasks.length });

        try {
          const res = await fetch(`${appUrl}${task.path}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.CRON_SECRET}`,
            },
            body: JSON.stringify(task.body),
          });
          const data = await res.json().catch(() => ({})) as {
            generated?: number;
            skipped?: number;
            lastError?: string;
            error?: string;
            message?: string;
          };

          if (!res.ok) {
            const errMsg = data.error ?? `HTTP ${res.status}`;
            results[task.path] = data;
            send({ message: `✗ ${task.label.replace("…", "")} — ${errMsg}`, step: tasks.indexOf(task) + 1 });
            continue;
          }

          const generated = data.generated ?? 0;
          const skipped = data.skipped ?? 0;
          const lastError = data.lastError;
          totalGenerated += generated;
          results[task.path] = data;

          let detail = `${generated} generated`;
          if (skipped > 0) detail += `, ${skipped} skipped`;
          if (generated === 0 && lastError) detail += ` (err: ${lastError.slice(0, 80)})`;
          else if (generated === 0 && data.message) detail += ` (${data.message})`;

          send({ message: `✓ ${task.label.replace("…", "")} — ${detail}`, step: tasks.indexOf(task) + 1 });
        } catch (err) {
          const errMsg = (err as Error).message;
          results[task.path] = { error: errMsg };
          send({ message: `✗ ${task.label.replace("…", "")} — ${errMsg}`, step: tasks.indexOf(task) + 1 });
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
      "X-Accel-Buffering": "no", // disable Nginx buffering on Vercel edge
    },
  });
}

// GET for Vercel Cron (non-streaming, returns JSON)
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reqUrl = new URL(req.url);
  const appUrl = `${reqUrl.protocol}//${reqUrl.host}`;

  const tasks = [
    { path: "/api/seo/generate-use-cases",   body: { count: 10 } },
    { path: "/api/seo/generate-comparisons",  body: { count: 5 } },
    { path: "/api/seo/generate-problems",     body: { count: 3 } },
    { path: "/api/seo/generate-templates",    body: { count: 2 } },
    { path: "/api/seo/generate-alternatives", body: { count: 2 } },
    { path: "/api/seo/generate-ai-for",       body: { count: 5 } },
  ];

  const results: Record<string, unknown> = {};
  for (const task of tasks) {
    try {
      const res = await fetch(`${appUrl}${task.path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.CRON_SECRET}` },
        body: JSON.stringify(task.body),
      });
      results[task.path] = await res.json().catch(() => ({}));
    } catch (err) {
      results[task.path] = { error: String(err) };
    }
  }

  return NextResponse.json({ ok: true, results });
}
