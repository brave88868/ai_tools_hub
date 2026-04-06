import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";

const TOOLKIT_COLORS: Record<string, string> = {
  jobseeker: "border-l-blue-400",
  creator: "border-l-purple-400",
  marketing: "border-l-orange-400",
  business: "border-l-green-400",
  legal: "border-l-red-400",
  exam: "border-l-yellow-400",
};

export default async function Toolkits() {
  const supabase = createAdminClient();

  const [{ data: toolkits }, { data: bundle }] = await Promise.all([
    supabase
      .from("toolkits")
      .select("slug, name, description, price_monthly, icon")
      .eq("is_active", true)
      .neq("slug", "bundle")
      .order("sort_order"),
    supabase
      .from("toolkits")
      .select("price_monthly, description")
      .eq("slug", "bundle")
      .single(),
  ]);

  const bundlePrice = bundle?.price_monthly ?? 49;
  const toolkitCount = (toolkits ?? []).length;

  return (
    <section className="bg-gray-50 py-14 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">{toolkitCount} Professional Toolkits</h2>
          <p className="text-gray-500">Every toolkit includes 10+ AI tools built for your workflow</p>
        </div>

        {/* Bundle Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl py-5 px-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-2xl mb-1">⚡</div>
              <h3 className="text-white font-bold text-lg mb-0.5">All Toolkits Bundle</h3>
              <p className="text-white/70 text-sm">{bundle?.description ?? `Get unlimited access to all ${toolkitCount} toolkits — best value`}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-white font-bold text-2xl">${bundlePrice}<span className="text-base font-normal text-white/70">/mo</span></span>
              <Link
                href="/pricing"
                className="bg-white text-indigo-600 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                Get Bundle →
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(toolkits ?? []).map((kit) => (
            <Link
              key={kit.slug}
              href={`/toolkits/${kit.slug}`}
              className={`border-l-4 ${TOOLKIT_COLORS[kit.slug] ?? "border-l-gray-300"} border border-gray-100 rounded-2xl p-5 bg-white hover:shadow-md transition-all group`}
            >
              <div className="text-2xl mb-3">{kit.icon}</div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">{kit.name}</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">{kit.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">${kit.price_monthly}/month</span>
                <span className="text-xs text-indigo-500 group-hover:text-indigo-700 transition-colors">Explore →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
