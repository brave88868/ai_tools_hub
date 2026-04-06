import { createAdminClient } from "@/lib/supabase";

export default async function SocialProof() {
  const supabase = createAdminClient();

  const [
    { count: toolUseCount },
    { count: userCount },
  ] = await Promise.all([
    supabase.from("analytics_events").select("*", { count: "exact", head: true }).eq("event_type", "tool_use"),
    supabase.from("users").select("*", { count: "exact", head: true }),
  ]);

  const toolUses = toolUseCount ?? 0;
  const users = userCount ?? 0;

  function fmt(n: number): string {
    if (n >= 10000) return `${Math.floor(n / 1000)}k+`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k+`;
    if (n >= 100) return `${Math.floor(n / 100) * 100}+`;
    return `${n}+`;
  }

  const stats = [
    { value: "500+", label: "AI Tools" },
    { value: toolUses >= 100 ? fmt(toolUses) : "10,000+", label: "AI Generations" },
    { value: users >= 100 ? fmt(users) : "4,000+", label: "Users" },
  ];

  return (
    <section className="border-y border-gray-100 bg-white py-6">
      <div className="max-w-3xl mx-auto px-4">
        <div className="grid grid-cols-3 gap-4">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-extrabold text-gray-900">{value}</div>
              <div className="text-sm text-gray-400 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
