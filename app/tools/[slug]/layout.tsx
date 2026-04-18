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

  if (!tool) return { title: "AI Tool" };

  const toolkit = tool.toolkits as unknown as { name: string } | null;
  const rawTitle = tool.seo_title ?? `${tool.name}${toolkit ? ` — ${toolkit.name}` : ""}`;
  const title = rawTitle.replace(/ \| AI Tools Station$/, "");

  const shortDesc = tool.seo_description ?? tool.description ?? "";
  const description =
    shortDesc.length >= 120
      ? shortDesc
      : `${tool.name} is a free AI tool${toolkit ? ` in the ${toolkit.name} toolkit` : ""}. ${shortDesc ? shortDesc + " " : ""}Generate professional-quality results instantly — no signup required. Part of AI Tools Station's 600+ tool library.`;

  const ogImage = "https://www.aitoolsstation.com/og-image.png";

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.aitoolsstation.com/tools/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.aitoolsstation.com/tools/${slug}`,
      siteName: "AI Tools Station",
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default function ToolSlugLayout({ children }: Props) {
  return <>{children}</>;
}
