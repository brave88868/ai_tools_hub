import { createAdminClient } from "@/lib/supabase";
import { openai } from "@/lib/openai";

export interface InsightsResult {
  success: true;
  week_start: string;
  week_end: string;
  report: string;
  email_sent: boolean;
  stats: WeekStats;
}

export interface InsightsSkipped {
  skipped: true;
}

interface WeekStats {
  page_views: number;
  tool_uses: number;
  signups: number;
  new_subs: number;
  new_leads: number;
  top_tools: string;
  daily_signups: string;
}

export async function generateWeeklyInsights(
  force = false
): Promise<InsightsResult | InsightsSkipped> {
  const admin = createAdminClient();

  // 1. 计算时间范围（UTC 日期）
  const now = new Date();
  const weekEndDate = new Date(now);
  weekEndDate.setUTCHours(0, 0, 0, 0);
  const weekStartDate = new Date(weekEndDate);
  weekStartDate.setUTCDate(weekStartDate.getUTCDate() - 7);

  const week_start = weekStartDate.toISOString().slice(0, 10);
  const week_end = weekEndDate.toISOString().slice(0, 10);
  const weekStartISO = weekStartDate.toISOString();

  // 2. 检查本周是否已生成
  if (!force) {
    const { data: existing } = await admin
      .from("weekly_insights")
      .select("id")
      .eq("week_start", week_start)
      .maybeSingle();
    if (existing) return { skipped: true };
  }

  // 3. 聚合 analytics_events（过去7天）
  const [
    { count: page_views },
    { count: tool_uses },
    { count: signups },
    { data: toolRows },
    { data: signupRows },
  ] = await Promise.all([
    admin
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "page_view")
      .gte("created_at", weekStartISO),
    admin
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "tool_use")
      .gte("created_at", weekStartISO),
    admin
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "signup")
      .gte("created_at", weekStartISO),
    // tool_slug 分组
    admin
      .from("analytics_events")
      .select("tool_slug")
      .eq("event_type", "tool_use")
      .not("tool_slug", "is", null)
      .gte("created_at", weekStartISO),
    // 每日注册
    admin
      .from("analytics_events")
      .select("created_at")
      .eq("event_type", "signup")
      .gte("created_at", weekStartISO),
  ]);

  // 聚合 top_tools
  const toolCounts: Record<string, number> = {};
  for (const row of toolRows ?? []) {
    if (row.tool_slug) {
      toolCounts[row.tool_slug] = (toolCounts[row.tool_slug] ?? 0) + 1;
    }
  }
  const top5 = Object.entries(toolCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([slug, n]) => `${slug}(${n}次)`)
    .join("、") || "暂无数据";

  // 聚合 daily_signups（最近7天每天）
  const dailyMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(weekEndDate);
    d.setUTCDate(d.getUTCDate() - i);
    dailyMap[d.toISOString().slice(0, 10)] = 0;
  }
  for (const row of signupRows ?? []) {
    const day = String(row.created_at).slice(0, 10);
    if (day in dailyMap) dailyMap[day]++;
  }
  const daily_signups_str = Object.entries(dailyMap)
    .map(([date, n]) => `${date.slice(5)}: ${n}人`)
    .join("，");

  // 4. 本周新增订阅
  const { count: new_subs } = await admin
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .gte("created_at", weekStartISO);

  // 5. 本周新增线索
  const { count: new_leads } = await admin
    .from("leads")
    .select("*", { count: "exact", head: true })
    .gte("created_at", weekStartISO);

  const stats: WeekStats = {
    page_views: page_views ?? 0,
    tool_uses: tool_uses ?? 0,
    signups: signups ?? 0,
    new_subs: new_subs ?? 0,
    new_leads: new_leads ?? 0,
    top_tools: top5,
    daily_signups: daily_signups_str,
  };

  // 6. OpenAI 生成报告
  const prompt = `AI Tools Station 本周运营数据（${week_start} 至 ${week_end}）：

- 页面浏览：${stats.page_views} 次
- 工具使用：${stats.tool_uses} 次
- 新注册用户：${stats.signups} 人
- 新订阅：${stats.new_subs} 笔
- 新线索：${stats.new_leads} 条
- Top 5 工具：${stats.top_tools}
- 每日注册：${stats.daily_signups}

请生成周报，包含：
1. 本周亮点（2-3条）
2. 需要关注的问题（1-2条）
3. 下周建议行动（2-3条）

总字数不超过400字，格式清晰。`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "你是一个 SaaS 增长顾问，请用简体中文生成周报。" },
      { role: "user", content: prompt },
    ],
    max_tokens: 800,
    temperature: 0.7,
  });

  const report = completion.choices[0]?.message?.content?.trim() ?? "报告生成失败，请重试。";

  // 7. 存入 weekly_insights（已有则 upsert）
  await admin.from("weekly_insights").upsert(
    { week_start, week_end, report, stats },
    { onConflict: "week_start" }
  );

  // 8. 发送邮件
  let email_sent = false;
  const resendKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (resendKey && adminEmail) {
    try {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "onboarding@resend.dev",
          to: adminEmail,
          subject: `AI Tools Station 周报 ${week_start} ~ ${week_end}`,
          text: `AI Tools Station 本周周报\n\n时间：${week_start} 至 ${week_end}\n\n${report}\n\n---\n数据摘要\n页面浏览：${stats.page_views} 次\n工具使用：${stats.tool_uses} 次\n新注册：${stats.signups} 人\n新订阅：${stats.new_subs} 笔\n新线索：${stats.new_leads} 条\nTop 工具：${stats.top_tools}`,
        }),
      });
      email_sent = emailRes.ok;
      if (!emailRes.ok) {
        const errBody = await emailRes.text().catch(() => "");
        console.warn("[weekly-insights] Email failed:", emailRes.status, errBody);
      }
    } catch (err) {
      console.warn("[weekly-insights] Email error:", err);
    }
  }

  // 9. 返回结果
  return { success: true, week_start, week_end, report, email_sent, stats };
}
