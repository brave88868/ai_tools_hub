import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase";

const NAV = [
  { label: "Overview", href: "/admin" },
  { label: "Users", href: "/admin/users" },
  { label: "Toolkits", href: "/admin/toolkits" },
  { label: "Tools", href: "/admin/tools-manage" },
  { label: "AI Tools", href: "/admin/tools" },
  { label: "SEO", href: "/admin/seo" },
  { label: "Blog", href: "/admin/blog" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "Feedback", href: "/admin/feedback" },
  { label: "Pricing", href: "/admin/pricing" },
  { label: "Referrals", href: "/admin/referrals" },
  { label: "Growth", href: "/admin/growth" },
  { label: "Revenue", href: "/admin/revenue" },
  { label: "SaaS Factory", href: "/admin/saas" },
  { label: "Startup Gen", href: "/admin/startup" },
  { label: "Intelligence", href: "/admin/intelligence" },
  { label: "🩺 Health", href: "/admin/health" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const admin = createAdminClient();
  const { data: userRecord, error: dbError } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  // 诊断日志（可在 Vercel Functions 日志中查看）
  console.log("[admin/layout] user:", user.email, user.id);
  console.log("[admin/layout] userRecord:", userRecord, "dbError:", dbError?.message);

  // 判断逻辑：DB role=admin  OR  email 匹配 ADMIN_EMAIL 环境变量（兜底）
  const adminEmail = process.env.ADMIN_EMAIL;
  const isAdmin =
    userRecord?.role === "admin" ||
    (adminEmail && user.email === adminEmail);

  if (!isAdmin) {
    console.warn("[admin/layout] Access denied for:", user.email, "role:", userRecord?.role);
    redirect("/?error=access_denied");
  }

  // 如果 email 匹配但 DB 里 role 还不是 admin，自动同步
  if (adminEmail && user.email === adminEmail && userRecord?.role !== "admin") {
    console.log("[admin/layout] Auto-upgrading role to admin for:", user.email);
    await admin
      .from("users")
      .upsert({ id: user.id, email: user.email, role: "admin", plan: "pro" }, { onConflict: "id" });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin top bar */}
      <div className="bg-black text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</span>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs text-gray-300 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white">
          ← Back to Dashboard
        </Link>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-8">{children}</div>
    </div>
  );
}
