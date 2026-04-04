import type { Metadata } from "next";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Dashboard | AI Tools Hub",
};

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 加载订阅
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("toolkit_slug, status, current_period_end")
    .eq("user_id", user.id)
    .eq("status", "active");

  // 加载今日使用次数
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

  const isPaid = (subscriptions?.length ?? 0) > 0;

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
        <p className="text-gray-400 text-sm">{user.email}</p>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Today's uses", value: todayCount ?? 0 },
          { label: "Total uses", value: totalCount ?? 0 },
          { label: "Plan", value: isPaid ? "Pro" : "Free" },
          { label: "Active subscriptions", value: subscriptions?.length ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="border border-gray-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Subscriptions */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Active Subscriptions</h2>
        {(subscriptions?.length ?? 0) === 0 ? (
          <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-400 text-sm mb-4">No active subscriptions yet.</p>
            <Link href="/pricing" className="inline-block bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors">
              View Plans →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {subscriptions!.map((sub) => (
              <div key={sub.toolkit_slug} className="border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900 capitalize">{sub.toolkit_slug} Toolkit</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Renews {new Date(sub.current_period_end).toLocaleDateString("en-AU")}
                  </div>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: "Browse Tools", href: "/toolkits" },
          { label: "View Pricing", href: "/pricing" },
          { label: "Sign Out", href: "/auth/signout" },
        ].map(({ label, href }) => (
          <Link key={label} href={href}
            className="border border-gray-200 rounded-xl p-4 text-center text-sm text-gray-600 hover:border-gray-400 transition-colors">
            {label}
          </Link>
        ))}
      </div>
    </main>
  );
}
