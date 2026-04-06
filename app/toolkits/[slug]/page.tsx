import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import ComplianceDisclaimer from "@/components/ComplianceDisclaimer";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data: kit } = await supabase
    .from("toolkits")
    .select("name, description")
    .eq("slug", slug)
    .single();
  return {
    title: kit ? `${kit.name} — AI Tools Hub` : "Toolkit",
    description: kit?.description ?? "",
  };
}

export default async function ToolkitPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: kit } = await supabase
    .from("toolkits")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!kit) notFound();

  const { data: tools } = await supabase
    .from("tools")
    .select("slug, name, description, tool_type")
    .eq("toolkit_id", kit.id)
    .eq("is_active", true)
    .order("sort_order");

  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-sm text-gray-400 mb-6">
        <Link href="/toolkits" className="hover:text-gray-600">Toolkits</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-600">{kit.name}</span>
      </div>

      <div className="mb-10">
        <div className="text-4xl mb-3">{kit.icon}</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{kit.name}</h1>
        <p className="text-gray-500 mb-4">{kit.description}</p>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            <strong className="text-gray-900">${kit.price_monthly}</strong>/month
          </span>
          <span className="text-sm text-gray-400">{tools?.length ?? 0} tools included</span>
        </div>
      </div>

      {slug === "legal" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-xs text-amber-700">
          ⚠️ These tools provide general informational analysis only. They do not constitute legal advice.
        </div>
      )}

      {slug === "compliance" && (
        <div className="mb-8">
          <ComplianceDisclaimer />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(tools ?? []).map((tool) => (
          <Link
            key={tool.slug}
            href={`/tools/${tool.slug}`}
            className="border border-gray-200 rounded-xl p-5 hover:border-gray-400 hover:shadow-sm transition-all group"
          >
            <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-black">{tool.name}</h3>
            <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-3">{tool.description}</p>
            <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">Try tool →</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
