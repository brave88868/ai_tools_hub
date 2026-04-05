import { createAdminClient } from "@/lib/supabase";

export default async function AdminOverviewPage() {
  const supabase = createAdminClient();

  const [
    { count: toolCount },
    { count: useCaseCount },
    { count: blogCount },
    { count: userCount },
    { count: subCount },
    { count: ideaCount },
    { count: keywordCount },
  ] = await Promise.all([
    supabase.from("tools").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("tool_use_cases").select("*", { count: "exact", head: true }),
    supabase.from("blog_posts").select("*", { count: "exact", head: true }).eq("published", true),
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("tool_ideas").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("seo_keywords").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const stats = [
    { label: "Active Tools", value: toolCount ?? 0, color: "text-blue-600" },
    { label: "Use-case Pages", value: useCaseCount ?? 0, color: "text-purple-600" },
    { label: "Blog Posts", value: blogCount ?? 0, color: "text-green-600" },
    { label: "Users", value: userCount ?? 0, color: "text-gray-900" },
    { label: "Active Subscriptions", value: subCount ?? 0, color: "text-indigo-600" },
    { label: "Pending Tool Ideas", value: ideaCount ?? 0, color: "text-orange-600" },
    { label: "Pending Keywords", value: keywordCount ?? 0, color: "text-yellow-600" },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Admin Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className={`text-3xl font-bold mb-1 ${color}`}>{value.toLocaleString()}</div>
            <div className="text-xs text-gray-400">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
