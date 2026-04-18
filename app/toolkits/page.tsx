import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase";
import ToolkitsPageClient from "@/components/toolkits/ToolkitsPageClient";

export const metadata: Metadata = {
  title: "AI Toolkits for Professional Workflows",
  description:
    "24 AI toolkits with 600+ tools for job seekers, marketers, developers, legal teams and more. From $9/mo — cancel anytime.",
  alternates: { canonical: "https://www.aitoolsstation.com/toolkits" },
};

const collectionJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": "https://www.aitoolsstation.com/toolkits",
  name: "AI Toolkits for Professional Workflows",
  description: "24 AI toolkits with 600+ tools for job seekers, marketers, developers, legal teams and more.",
  url: "https://www.aitoolsstation.com/toolkits",
  publisher: {
    "@type": "Organization",
    name: "AI Tools Station",
    url: "https://www.aitoolsstation.com",
  },
};

export default async function ToolkitsPage() {
  const supabase = createAdminClient();
  const { data: toolkits } = await supabase
    .from("toolkits")
    .select("slug, name, description, price_monthly, icon")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <ToolkitsPageClient toolkits={toolkits ?? []} />
    </>
  );
}
