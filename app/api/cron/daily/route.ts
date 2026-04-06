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
 * Step 12: Internal Links      → Claude Haiku injects 2-3 links into new seo_pages (Wednesdays only)
 * Step 13: Apply Referral Rewards → free_month_bundle → bundle subscription (Sundays only)
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

  // ── Step 12: Internal Link Injection for new SEO pages (每周三) ───────────
  const isWednesday = new Date().getDay() === 3;
  if (isWednesday) {
    try {
      const admin = createAdminClient();
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // 取最近 24h 生成的 seo_pages（有 content 的）
      const { data: newPages } = await admin
        .from("seo_pages")
        .select("id, slug, content, tool_slug, type")
        .gte("created_at", since)
        .not("content", "is", null)
        .limit(10);

      if (!newPages?.length) {
        log.step12_internal_links = { skipped: "no new pages in last 24h" };
      } else {
        // 取全部 active 工具做锚文本候选
        const { data: allTools } = await admin
          .from("tools")
          .select("slug, name")
          .eq("is_active", true)
          .limit(100);

        const toolList = (allTools ?? [])
          .map((t: { slug: string; name: string }) => `- ${t.name}: /tools/${t.slug}`)
          .join("\n");

        let injected = 0;
        const Anthropic = (await import("@anthropic-ai/sdk")).default;
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

        for (const page of newPages) {
          if (!page.content) continue;
          try {
            const msg = await anthropic.messages.create({
              model: "claude-haiku-4-5-20251001",
              max_tokens: 4000,
              messages: [{
                role: "user",
                content: `You are an SEO editor. Inject 2-3 natural internal links into the following content.

Available tools to link to:
${toolList}

Rules:
- Only link tool names that appear naturally in the text context
- Use markdown link format: [tool name](/tools/slug)
- Do NOT add links in headings
- Do NOT add duplicate links
- Return ONLY the updated content, no explanation

Content:
${page.content.substring(0, 3000)}`,
              }],
            });

            const updatedContent = (msg.content[0] as { type: string; text: string }).text?.trim();
            if (updatedContent && updatedContent.length > 100) {
              await admin
                .from("seo_pages")
                .update({ content: updatedContent })
                .eq("id", page.id);
              injected++;
            }
          } catch (innerErr) {
            console.error(`[cron/daily] Step 12 page ${page.slug} failed:`, innerErr);
          }
        }

        log.step12_internal_links = { pages_processed: newPages.length, links_injected: injected };
        stepsCompleted++;
        console.log("[cron/daily] Step 12: Internal link injection", log.step12_internal_links);
      }
    } catch (err) {
      log.step12_error = (err as Error).message;
      console.error("[cron/daily] Step 12 failed:", err);
    }
  } else {
    log.step12_internal_links = { skipped: "not Wednesday" };
  }

  // ── Step 13: Apply Referral Rewards (每周日) ────────────────────────────
  const isSunday = new Date().getDay() === 0;
  if (isSunday) {
    try {
      const result = await callStep("/api/admin/apply-referral-rewards", "POST");
      log.step13_referral_rewards = result;
      stepsCompleted++;
      console.log("[cron/daily] Step 13: Apply referral rewards", result);
    } catch (err) {
      log.step13_error = (err as Error).message;
      console.error("[cron/daily] Step 13 failed:", err);
    }
  } else {
    log.step13_referral_rewards = { skipped: "not Sunday" };
  }

  console.log(`[cron/daily] Completed ${stepsCompleted}/13 steps`);

  return NextResponse.json({
    success: true,
    steps_completed: stepsCompleted,
    timestamp: new Date().toISOString(),
    log,
  });
}
