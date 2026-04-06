import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase";
import { runTemplateTool } from "@/services/tool-engine/template-engine";
import { runConfigTool } from "@/services/tool-engine/config-engine";
import { runCustomTool } from "@/services/tool-engine/custom-engine";

function getDateRange() {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const next = new Date(now);
  next.setUTCDate(next.getUTCDate() + 1);
  const tomorrow = next.toISOString().split("T")[0];
  return { today, tomorrow };
}

export async function POST(req: NextRequest) {
  // ── Cloudflare 源站保护 ──────────────────────────────────────────
  // 生产环境只接受经过 Cloudflare 转发的请求（携带 cf-ray header）
  // 直接裸打 Vercel 源站的请求（机器人绕过 Cloudflare）返回 403
  if (process.env.NODE_ENV === 'production') {
    const cfRay = req.headers.get('cf-ray')
    if (!cfRay) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }
  }
  // ────────────────────────────────────────────────────────────────
  try {
    const body = await req.json();
    const { tool_slug, inputs } = body;

    if (!tool_slug || !inputs) {
      return NextResponse.json(
        { success: false, error: "tool_slug and inputs are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { today, tomorrow } = getDateRange();

    // ── IP 封禁检查 ──────────────────────────────────────────────
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (clientIp !== "unknown") {
      const { data: bannedIp } = await supabase
        .from("banned_ips")
        .select("ip")
        .eq("ip", clientIp)
        .maybeSingle();

      if (bannedIp) {
        return NextResponse.json(
          { success: false, error: "Access denied" },
          { status: 403 }
        );
      }
    }
    // ─────────────────────────────────────────────────────────────

    // ── Auth resolution ───────────────────────────────────────────
    // If token exists but is invalid/expired, getUser returns user=null.
    // In that case we fall through to the anonymous path — no bypass.
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const { data: { user } } = token
      ? await supabase.auth.getUser(token)
      : { data: { user: null } };

    let userId: string | null = null;
    let sessionId: string | null = null;

    if (user) {
      // ── Authenticated user ──────────────────────────────────────
      userId = user.id;

      // 检查用户是否被封禁，同时读取 role + bonus_uses
      const { data: userRecord } = await supabase
        .from("users")
        .select("banned, role, bonus_uses")
        .eq("id", userId)
        .maybeSingle();

      if (userRecord?.banned) {
        return NextResponse.json(
          { success: false, error: "Access denied" },
          { status: 403 }
        );
      }

      // Admin: unlimited access — skip all rate limiting
      if (userRecord?.role !== "admin") {
        // Pro role (manually granted) counts as paid — skip subscription check
        const isPro = userRecord?.role === "pro";

        let hasPaidAccess = isPro;
        let earlyToolkitSlug = "";

        if (!isPro) {
          const { data: toolCheck } = await supabase
            .from("tools")
            .select("toolkits(slug)")
            .eq("slug", tool_slug)
            .single();

          earlyToolkitSlug =
            (toolCheck?.toolkits as unknown as { slug: string } | null)?.slug ?? "";

          const { data: sub } = await supabase
            .from("subscriptions")
            .select("id")
            .eq("user_id", userId)
            .eq("status", "active")
            .or(`toolkit_slug.eq.bundle,toolkit_slug.eq.${earlyToolkitSlug}`)
            .limit(1)
            .maybeSingle();

          hasPaidAccess = !!sub;
        }

        if (hasPaidAccess) {
          // Paid user (pro role or active subscription): 100/day
          const { count: todayCount } = await supabase
            .from("usage_logs")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .gte("created_at", `${today}T00:00:00.000Z`)
            .lt("created_at", `${tomorrow}T00:00:00.000Z`);

          if ((todayCount ?? 0) >= 100) {
            return NextResponse.json(
              {
                success: false,
                error: "daily_limit_reached",
                message: "You have reached your daily limit of 100 uses. Resets at midnight UTC.",
              },
              { status: 429 }
            );
          }
        } else {
          // Logged in free user: 3/day + 30 lifetime
          const { count: todayCount } = await supabase
            .from("usage_logs")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .gte("created_at", `${today}T00:00:00.000Z`)
            .lt("created_at", `${tomorrow}T00:00:00.000Z`);

          if ((todayCount ?? 0) >= 3) {
            return NextResponse.json(
              {
                success: false,
                error: "free_limit_reached",
                message: "You have used your 3 free uses today. Upgrade to continue.",
                upgrade_required: true,
                toolkit_slug: earlyToolkitSlug || null,
              },
              { status: 403 }
            );
          }

          const { count: totalCount } = await supabase
            .from("usage_logs")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId);

          const bonusUses = userRecord?.bonus_uses ?? 0;
          if ((totalCount ?? 0) >= 30 + bonusUses) {
            return NextResponse.json(
              {
                success: false,
                error: "lifetime_limit_reached",
                message: "You have used all 30 lifetime free uses. Please subscribe to continue.",
                upgrade_required: true,
                toolkit_slug: earlyToolkitSlug || null,
              },
              { status: 403 }
            );
          }
        }
      }
    } else {
      // ── Anonymous (no token, or invalid/expired token) ──────────
      // Use IP + User-Agent fingerprint — not bypassable via incognito/browser switch
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "unknown";
      const ua = req.headers.get("user-agent") || "unknown";
      const fingerprint = createHash("sha256").update(`${ip}:${ua}`).digest("hex");
      sessionId = fingerprint;

      const { count: todayCount } = await supabase
        .from("usage_logs")
        .select("*", { count: "exact", head: true })
        .eq("session_id", fingerprint)
        .gte("created_at", `${today}T00:00:00.000Z`)
        .lt("created_at", `${tomorrow}T00:00:00.000Z`);

      if ((todayCount ?? 0) >= 1) {
        return NextResponse.json(
          {
            success: false,
            error: "free_limit_reached",
            message: "Sign up for free to get 3 uses per day",
            upgrade_required: true,
          },
          { status: 403 }
        );
      }

      const { count: totalCount } = await supabase
        .from("usage_logs")
        .select("*", { count: "exact", head: true })
        .eq("session_id", fingerprint);

      if ((totalCount ?? 0) >= 30) {
        return NextResponse.json(
          {
            success: false,
            error: "lifetime_limit_reached",
            message: "You have used all 30 free uses. Please sign up and subscribe to continue.",
            upgrade_required: true,
          },
          { status: 403 }
        );
      }
    }

    // ── Load tool config ──────────────────────────────────────────
    const { data: tool, error: toolError } = await supabase
      .from("tools")
      .select("*, toolkits(slug)")
      .eq("slug", tool_slug)
      .eq("is_active", true)
      .single();

    if (toolError || !tool) {
      return NextResponse.json(
        { success: false, error: "Tool not found" },
        { status: 404 }
      );
    }

    // ── Route to engine ───────────────────────────────────────────
    let output: string;

    if (tool.tool_type === "template") {
      output = await runTemplateTool(tool, inputs);
    } else if (tool.tool_type === "config") {
      output = await runConfigTool(tool, inputs);
    } else if (tool.tool_type === "custom") {
      output = await runCustomTool(tool, inputs);
    } else {
      return NextResponse.json(
        { success: false, error: `Unknown tool_type: ${tool.tool_type}` },
        { status: 400 }
      );
    }

    // Legal Toolkit disclaimer
    const toolkitSlug = (tool.toolkits as unknown as { slug: string } | null)?.slug;
    if (toolkitSlug === "legal") {
      output +=
        "\n\n---\n⚠️ **Disclaimer**: This tool provides general informational analysis only. It does not constitute legal advice. Please consult a qualified attorney for legal matters.";
    }

    // ── Log usage ─────────────────────────────────────────────────
    await supabase.from("usage_logs").insert({
      user_id: userId,
      tool_slug,
      toolkit_slug: toolkitSlug,
      session_id: sessionId,
    });

    await supabase.from("analytics_events").insert({
      event_type: "tool_use",
      user_id: userId,
      tool_slug,
      toolkit_slug: toolkitSlug,
    });

    return NextResponse.json({
      success: true,
      output,
      output_format: tool.output_format ?? "text",
    });
  } catch (err: unknown) {
    console.error("[/api/tools/run]", {
      error: err instanceof Error ? err.message : err,
      stack: err instanceof Error ? err.stack : undefined,
    });
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
