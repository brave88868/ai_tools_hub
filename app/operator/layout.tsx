import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase";

const NAV = [
  { label: "Overview", href: "/operator" },
  { label: "Tools", href: "/operator/tools" },
  { label: "SEO", href: "/operator/seo" },
  { label: "Blog", href: "/operator/blog" },
  { label: "Analytics", href: "/operator/analytics" },
  { label: "Feedback", href: "/operator/feedback" },
];

export default async function OperatorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: userRecord } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userRecord?.role !== "admin") redirect("/");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Operator top bar */}
      <div className="bg-black text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Operator</span>
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
