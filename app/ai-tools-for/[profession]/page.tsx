import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";

const PROFESSION_TOOLKITS: Record<string, string[]> = {
  "job-seeker": ["jobseeker"],
  "content-creator": ["creator"],
  "marketer": ["marketing"],
  "business-owner": ["business"],
  "lawyer": ["legal"],
  "student": ["exam"],
  "freelancer": ["jobseeker", "business"],
  "entrepreneur": ["business", "marketing"],
  "hr-professional": ["business", "jobseeker"],
  "writer": ["creator", "marketing"],
  "startup-founder": ["business", "marketing"],
};

interface Props {
  params: Promise<{ profession: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { profession } = await params;
  const name = profession.replace(/-/g, " ");
  const capitalised = name.charAt(0).toUpperCase() + name.slice(1);
  const title = `Best AI Tools for ${capitalised}s | AI Tools Hub`;
  const description = `Discover AI-powered tools built for ${name}s. Generators, optimisers, and writers — boost your productivity today.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://aitoolsstation.com/ai-tools-for/${profession}`,
      siteName: "AI Tools Hub",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ProfessionToolsPage({ params }: Props) {
  const { profession } = await params;
  const name = profession.replace(/-/g, " ");
  const capitalised = name.charAt(0).toUpperCase() + name.slice(1);

  const supabase = createAdminClient();
  const toolkitSlugs = PROFESSION_TOOLKITS[profession] ?? [];

  let tools;

  if (toolkitSlugs.length > 0) {
    const { data: toolkitRows } = await supabase
      .from("toolkits")
      .select("id")
      .in("slug", toolkitSlugs);

    const toolkitIds = (toolkitRows ?? []).map((t: { id: string }) => t.id);

    if (toolkitIds.length > 0) {
      const { data } = await supabase
        .from("tools")
        .select("slug, name, description, toolkits(slug, name)")
        .eq("is_active", true)
        .in("toolkit_id", toolkitIds)
        .order("sort_order")
        .limit(24);
      tools = data;
    }
  }

  if (!tools) {
    const { data } = await supabase
      .from("tools")
      .select("slug, name, description, toolkits(slug, name)")
      .eq("is_active", true)
      .order("sort_order")
      .limit(24);
    tools = data;
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `AI Tools for ${capitalised}s`,
    description: `A curated collection of AI tools for ${name}s`,
    url: `https://aitoolsstation.com/ai-tools-for/${profession}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            AI Tools for{" "}
            <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
              {capitalised}s
            </span>
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto text-base">
            AI-powered generators, optimisers, and writers built for your workflow. Free to try — no credit card required.
          </p>
        </div>

        {/* Tools grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {(tools ?? []).map((tool) => {
            const toolkit = tool.toolkits as unknown as { slug: string; name: string } | null;
            return (
              <div
                key={tool.slug}
                className="border border-gray-100 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs bg-gray-50 text-gray-400 px-2 py-0.5 rounded-full">
                    {toolkit?.name ?? "AI Tool"}
                  </span>
                  <span className="text-xs text-green-600 font-medium">Free</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  {tool.name}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-4 line-clamp-2">
                  {tool.description}
                </p>
                <Link
                  href={`/tools/${tool.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-600"
                >
                  Try free →
                </Link>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="bg-black text-white rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Get unlimited access</h2>
          <p className="text-gray-400 text-sm mb-5">
            Unlock all tools · Unlimited uses · Cancel anytime
          </p>
          <Link
            href="/pricing"
            className="inline-block bg-white text-black px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            View Pricing →
          </Link>
        </div>
      </main>
    </>
  );
}
