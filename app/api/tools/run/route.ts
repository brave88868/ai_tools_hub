import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { runTemplateTool } from "@/services/tool-engine/template-engine";
import { runConfigTool } from "@/services/tool-engine/config-engine";
import { runCustomTool } from "@/services/tool-engine/custom-engine";

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tool_slug, inputs, session_id } = body;

    if (!tool_slug || !inputs) {
      return NextResponse.json(
        { success: false, error: "tool_slug and inputs are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const today = todayUTC();

    // ── 权限检查 ──────────────────────────────────────────────
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);

      if (user) {
        userId = user.id;

        // 获取该工具所属 toolkit slug（用于 bundle 订阅检查）
        const { data: toolCheck } = await supabase
          .from("tools")
          .select("toolkits(slug)")
          .eq("slug", tool_slug)
          .single();

        const earlyToolkitSlug =
          (toolCheck?.toolkits as unknown as { slug: string } | null)?.slug ?? "";

        // 付费判断：有 bundle 订阅 或 有对应 toolkit 的订阅
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "active")
          .or(`toolkit_slug.eq.bundle,toolkit_slug.eq.${earlyToolkitSlug}`)
          .limit(1)
          .maybeSingle();

        if (sub) {
          // 付费用户：每日最多 100 次
          const { count: todayCount } = await supabase
            .from("usage_logs")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("usage_date", today);

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
          // 已登录但未付费：今日 3 次 + 总计 30 次上限
          const { count: todayCount } = await supabase
            .from("usage_logs")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("usage_date", today);

          if ((todayCount ?? 0) >= 3) {
            return NextResponse.json(
              {
                success: false,
                error: "free_limit_reached",
                message: "You have used your 3 free uses today. Upgrade to continue.",
                upgrade_required: true,
              },
              { status: 403 }
            );
          }

          const { count: totalCount } = await supabase
            .from("usage_logs")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId);

          if ((totalCount ?? 0) >= 30) {
            return NextResponse.json(
              {
                success: false,
                error: "lifetime_limit_reached",
                message: "You have used all 30 lifetime free uses. Please subscribe to continue.",
                upgrade_required: true,
              },
              { status: 403 }
            );
          }
        }
      }
    } else {
      // 未登录用户：session_id 追踪
      if (!session_id) {
        return NextResponse.json(
          { success: false, error: "session_id is required for unauthenticated requests" },
          { status: 400 }
        );
      }

      const { count: todayCount } = await supabase
        .from("usage_logs")
        .select("*", { count: "exact", head: true })
        .eq("session_id", session_id)
        .eq("usage_date", today);

      if ((todayCount ?? 0) >= 3) {
        return NextResponse.json(
          {
            success: false,
            error: "free_limit_reached",
            message: "You have used your 3 free uses today. Sign up for more.",
            upgrade_required: true,
          },
          { status: 403 }
        );
      }

      const { count: totalCount } = await supabase
        .from("usage_logs")
        .select("*", { count: "exact", head: true })
        .eq("session_id", session_id);

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

    // ── 加载工具配置 ──────────────────────────────────────────
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

    // ── 路由到对应引擎 ────────────────────────────────────────
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

    // Legal Toolkit 合规 Disclaimer
    const toolkitSlug = (tool.toolkits as unknown as { slug: string } | null)?.slug;
    if (toolkitSlug === "legal") {
      output +=
        "\n\n---\n⚠️ **Disclaimer**: This tool provides general informational analysis only. It does not constitute legal advice. Please consult a qualified attorney for legal matters.";
    }

    // ── 记录使用日志 ──────────────────────────────────────────
    await supabase.from("usage_logs").insert({
      user_id: userId,
      tool_slug,
      toolkit_slug: toolkitSlug,
      session_id: session_id ?? null,
      usage_date: today,
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
