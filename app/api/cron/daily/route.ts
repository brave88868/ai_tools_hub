import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

const STEP_TIMEOUT_MS = 90_000; // 90s per step max

/**
 * GET /api/cron/daily
 * 每日 6am UTC 自动运行全流水线
 * Auth: Bearer CRON_SECRET
 *
 * Step 1:  Market Scan         → /api/intelligence/scan-market
 * Step 2:  Opportunity Score   → /api/intelligence/score-opportunities
 * Step 3:  SEO Bulk Generate   → /api/seo/generate (~27 pages)
 * Step 4:  Blog Generation     → /api/operator/generate-blog
 * Step 5:  Startup Idea        → /api/operator/generate-startup (score >= 75)
 * Step 6:  Page Optimize       → /api/intelligence/optimize-pages
 * Step 7:  Record Metrics      → /api/intelligence/record-metrics
 * Step 8:  Sitemap Ping        → /api/seo/ping
 * Step 9:  Template Generation → /api/templates/generate (Mondays only)
 * Step 10: Examples Cleanup    → delete is_public=false older than 30d (1st of month)
 * Step 11: Prompts Generation  → /api/prompts/generate (Tuesdays only)
 */
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reqUrl = new URL(req.url);
  const appUrl = `${reqUrl.protocol}//${reqUrl.host}`;
  const authHeader = req.headers.get("authorization") ?? "";

  const log: Record<string, unknown> = {};
  let stepsCompleted = 0;

  async function callStep(
    path: string,
    method: "GET" | "POST",
    body?: object,
    extraHeaders?: Record<string, string>
  ): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), STEP_TIMEOUT_MS);
    try {
      const res = await fetch(`${appUrl}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
          ...extraHeaders,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timer);
      return await res.json().catch(() => ({ status: res.status }));
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  // ── Step 1: Market Scan ─────────────────────────────────────────────────
  try {
    const result = await callStep("/api/intelligence/scan-market", "POST");
    log.step1_market_scan = result;
    stepsCompleted++;
    console.log("[cron/daily] Step 1: Market scan", result);
  } catch (err) {
    log.step1_error = (err as Error).message;
    console.error("[cron/daily] Step 1 failed:", err);
  }

  // ── Step 2: Opportunity Scoring ─────────────────────────────────────────
  try {
    const result = await callStep("/api/intelligence/score-opportunities", "POST", { count: 3 });
    log.step2_opportunity_scoring = result;
    stepsCompleted++;
    console.log("[cron/daily] Step 2: Opportunity scoring", result);
  } catch (err) {
    log.step2_error = (err as Error).message;
    console.error("[cron/daily] Step 2 failed:", err);
  }

  // ── Step 3: SEO Bulk Generate ───────────────────────────────────────────
  try {
    const result = await callStep("/api/seo/generate", "POST", {});
    log.step3_seo_generation = result;
    stepsCompleted++;
    console.log("[cron/daily] Step 3: SEO generation", result);
  } catch (err) {
    log.step3_error = (err as Error).message;
    console.error("[cron/daily] Step 3 failed:", err);
  }

  // ── Step 4: Blog Generation ─────────────────────────────────────────────
  try {
    const result = await callStep("/api/operator/generate-blog", "POST", { count: 3 });
    log.step4_blog_generation = result;
    stepsCompleted++;
    console.log("[cron/daily] Step 4: Blog generation", result);
  } catch (err) {
    log.step4_error = (err as Error).message;
    console.error("[cron/daily] Step 4 failed:", err);
  }

  // ── Step 5: High-score Startup Idea ────────────────────────────────────
  try {
    const admin = createAdminClient();
    const { data: topScore } = await admin
      .from("opportunity_scores")
      .select("id, keyword")
      .gte("score", 75)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (topScore) {
      // 检查是否已有同名 startup idea
      const { data: existingIdea } = await admin
        .from("startup_ideas")
        .select("id")
        .ilike("keyword", topScore.keyword)
        .maybeSingle();

      if (!existingIdea) {
        // 找对应 opportunity
        const { data: opp } = await admin
          .from("startup_opportunities")
          .select("id")
          .ilike("keyword", topScore.keyword)
          .maybeSingle();

        if (opp) {
          const result = await callStep("/api/operator/generate-startup", "POST", {
            opportunity_id: opp.id,
          });
          log.step5_startup_generation = result;
          stepsCompleted++;
          console.log("[cron/daily] Step 5: Startup generation", result);
        } else {
          log.step5_startup_generation = { skipped: "no matching opportunity", keyword: topScore.keyword };
          stepsCompleted++;
        }
      } else {
        log.step5_startup_generation = { skipped: "idea already exists", keyword: topScore.keyword };
        stepsCompleted++;
      }
    } else {
      log.step5_startup_generation = { skipped: "no opportunity with score >= 75" };
      stepsCompleted++;
    }
    console.log("[cron/daily] Step 5:", log.step5_startup_generation);
  } catch (err) {
    log.step5_error = (err as Error).message;
    console.error("[cron/daily] Step 5 failed:", err);
  }

  // ── Step 6: Page Optimization ───────────────────────────────────────────
  try {
    const result = await callStep("/api/intelligence/optimize-pages", "POST", { count: 3 });
    log.step6_page_optimization = result;
    stepsCompleted++;
    console.log("[cron/daily] Step 6: Page optimization", result);
  } catch (err) {
    log.step6_error = (err as Error).message;
    console.error("[cron/daily] Step 6 failed:", err);
  }

  // ── Step 7: Revenue Metrics ─────────────────────────────────────────────
  try {
    const result = await callStep("/api/intelligence/record-metrics", "POST");
    log.step7_revenue_metrics = result;
    stepsCompleted++;
    console.log("[cron/daily] Step 7: Revenue metrics", result);
  } catch (err) {
    log.step7_error = (err as Error).message;
    console.error("[cron/daily] Step 7 failed:", err);
  }

  // ── Step 8: Sitemap Ping ────────────────────────────────────────────────
  try {
    const result = await callStep("/api/seo/ping", "GET", undefined, {
      "x-internal-cron": "1",
    });
    log.step8_sitemap_ping = result;
    stepsCompleted++;
    console.log("[cron/daily] Step 8: Sitemap ping", result);
  } catch (err) {
    log.step8_error = (err as Error).message;
    console.error("[cron/daily] Step 8 failed:", err);
  }

  // ── Step 9: Weekly Template Generation (每周一) ────────────────────────
  const isMonday = new Date().getDay() === 1;
  if (isMonday) {
    try {
      const result = await callStep("/api/templates/generate", "POST", undefined, {
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      });
      log.step9_template_generation = result;
      stepsCompleted++;
      console.log("[cron/daily] Step 9: Template generation", result);
    } catch (err) {
      log.step9_error = (err as Error).message;
      console.error("[cron/daily] Step 9 failed:", err);
    }
  } else {
    log.step9_template_generation = { skipped: "not Monday" };
  }

  // ── Step 10: Monthly Examples Cleanup (每月1日) ─────────────────────────
  const isFirstOfMonth = new Date().getDate() === 1;
  if (isFirstOfMonth) {
    try {
      const admin = createAdminClient();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { error } = await admin
        .from("generated_examples")
        .delete()
        .eq("is_public", false)
        .lt("created_at", thirtyDaysAgo.toISOString());

      if (error) throw error;
      log.step10_examples_cleanup = { ok: true };
      stepsCompleted++;
      console.log("[cron/daily] Step 10: Examples cleanup done");
    } catch (err) {
      log.step10_error = (err as Error).message;
      console.error("[cron/daily] Step 10 failed:", err);
    }
  } else {
    log.step10_examples_cleanup = { skipped: "not 1st of month" };
  }

  // ── Step 11: Weekly Prompts Generation (每周二) ─────────────────────────
  const isTuesday = new Date().getDay() === 2;
  if (isTuesday) {
    try {
      const result = await callStep("/api/prompts/generate", "POST", undefined, {
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      });
      log.step11_prompts_generation = result;
      stepsCompleted++;
      console.log("[cron/daily] Step 11: Prompts generation", result);
    } catch (err) {
      log.step11_error = (err as Error).message;
      console.error("[cron/daily] Step 11 failed:", err);
    }
  } else {
    log.step11_prompts_generation = { skipped: "not Tuesday" };
  }

  console.log(`[cron/daily] Completed ${stepsCompleted}/11 steps`);

  return NextResponse.json({
    success: true,
    steps_completed: stepsCompleted,
    timestamp: new Date().toISOString(),
    log,
  });
}
