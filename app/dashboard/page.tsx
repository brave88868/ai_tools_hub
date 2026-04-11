import type { Metadata } from "next";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import SubscriptionList from "@/components/SubscriptionList";
import ReferralBlock from "@/components/ReferralBlock";
import UpgradeCTA from "@/components/revenue/UpgradeCTA";
import InviteBanner from "@/components/InviteBanner";
import SignOutButton from "@/components/SignOutButton";
import DeleteAccountButton from "@/components/DeleteAccountButton";

export const metadata: Metadata = {
  title: "Dashboard | AI Tools Station",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ subscribed?: string }>;
}) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const params = await searchParams;
  const justSubscribed = params.subscribed ?? null;

  // 加载订阅（active + canceling 都显示）
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("toolkit_slug, status, current_period_end, stripe_subscription_id")
    .eq("user_id", user.id)
    .in("status", ["active", "canceling"]);

  const subs = subscriptions ?? [];

  // 用户角色 + 近 7 天 tool_use 次数（用于重度用户 CTA）
  const admin = createAdminClient();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: userRecord }, { count: recentToolUses }] = await Promise.all([
    admin.from("users").select("role").eq("id", user.id).single(),
    admin.from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("event_type", "tool_use")
      .gte("created_at", weekAgo),
  ]);

  const userRole = userRecord?.role ?? "user";
  const showUpgradeCTA = userRole === "user" && (recentToolUses ?? 0) > 5;

  // 今日使用次数
  const today = new Date().toISOString().slice(0, 10);
  const { count: todayCount } = await supabase
    .from("usage_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("usage_date", today);

  const { count: totalCount } = await supabase
    .from("usage_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Count includes canceling — user retains access until period ends
  const activeCount = subs.length;

  // (Referral stats are fetched client-side by ReferralBlock via /api/referral/stats)

  // Plan 标签：有任何 active/canceling 订阅 → 显示 toolkit 名称（不依赖 users.plan）
  let planLabel = "Free";
  if (subs.length > 0) {
    const names = subs.map(
      (s) => s.toolkit_slug.charAt(0).toUpperCase() + s.toolkit_slug.slice(1)
    );
    planLabel = names.length === 1 ? names[0] : `${names.length} Toolkits`;
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
        <p className="text-gray-400 text-sm">{user.email}</p>
      </div>

      {/* Invite friends banner */}
      <InviteBanner />

      {/* Heavy user upgrade CTA */}
      {showUpgradeCTA && (
        <div className="mb-6">
          <UpgradeCTA trigger="heavy_user" />
        </div>
      )}

      {/* 支付成功横幅 */}
      {justSubscribed && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl px-5 py-4 flex items-start gap-3">
          <span className="text-green-500 text-lg mt-0.5">✓</span>
          <div>
            <p className="text-sm font-medium text-green-800">
              Subscription activated!
            </p>
            <p className="text-xs text-green-600 mt-0.5">
              Your <span className="capitalize">{justSubscribed}</span> Toolkit is now active.
              If it doesn&apos;t appear below, wait a moment and refresh.
            </p>
          </div>
        </div>
      )}

      {/* 使用统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Today's uses", value: todayCount ?? 0 },
          { label: "Total uses", value: totalCount ?? 0 },
          { label: "Plan", value: planLabel },
          { label: "Active subscriptions", value: activeCount },
        ].map(({ label, value }) => (
          <div key={label} className="border border-gray-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* 订阅列表 */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Active Subscriptions</h2>
        <SubscriptionList subscriptions={subs} />
      </div>

      {/* Referral */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Invite Friends</h2>
        <ReferralBlock userId={user.id} />
      </div>

      {/* 快捷链接 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: "Browse Tools", href: "/toolkits" },
          { label: "Invite Friends", href: "/dashboard/referrals" },
          { label: "View Pricing", href: "/toolkits" },
        ].map(({ label, href }) => (
          <Link
            key={label}
            href={href}
            className="border border-gray-200 rounded-xl p-4 text-center text-sm text-gray-600 hover:border-gray-400 transition-colors"
          >
            {label}
          </Link>
        ))}
        <SignOutButton />
        <DeleteAccountButton />
      </div>
    </main>
  );
}
