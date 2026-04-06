import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase";

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: tool } = await supabase
    .from("tools")
    .select("name, description, seo_title, seo_description, toolkits(name)")
    .eq("slug", slug)
    .single();

  if (!tool) return { title: "AI Tool | AI Tools Station" };

  const toolkit = tool.toolkits as unknown as { name: string } | null;
  const title = tool.seo_title ?? `${tool.name}${toolkit ? ` — ${toolkit.name}` : ""} | AI Tools Station`;
  const description =
    tool.seo_description ?? tool.description ?? `Use ${tool.name} free — AI-powered tool for instant results.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://aitoolsstation.com/tools/${slug}`,
      siteName: "AI Tools Station",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function ToolSlugLayout({ children }: Props) {
  return <>{children}</>;
}
