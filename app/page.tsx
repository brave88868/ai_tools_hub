import type { Metadata } from "next";
import Link from "next/link";
import Hero from "@/components/home/Hero";
import WhatYouCanCreate from "@/components/home/WhatYouCanCreate";
import ToolkitsByGroup from "@/components/home/ToolkitsByGroup";
import TrustSection from "@/components/home/TrustSection";
import FinalCTA from "@/components/home/FinalCTA";

export const metadata: Metadata = {
  title: { absolute: "AI Tools Station — 600+ Free AI Tools for Real Workflows" },
  description:
    "Generate resumes, marketing copy, YouTube scripts, business plans and more with 600+ free AI tools. Start free, no credit card required.",
  alternates: {
    canonical: "https://www.aitoolsstation.com",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.aitoolsstation.com/#organization",
      name: "AI Tools Station",
      url: "https://www.aitoolsstation.com",
      logo: "https://www.aitoolsstation.com/og-image.png",
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": "https://www.aitoolsstation.com/#website",
      url: "https://www.aitoolsstation.com",
      name: "AI Tools Station",
      publisher: { "@id": "https://www.aitoolsstation.com/#organization" },
      potentialAction: {
        "@type": "SearchAction",
        target: "https://www.aitoolsstation.com/tools?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const accessDenied = params?.error === "access_denied";

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {accessDenied && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 text-center">
          <p className="text-sm text-red-700 font-medium">
            Access denied — you do not have admin privileges.
          </p>
        </div>
      )}
      <Hero />
      <WhatYouCanCreate />
      <ToolkitsByGroup />
      <TrustSection />
      <FinalCTA />

      {/* Hidden nav for Google crawl discovery — not visible to users */}
      <nav aria-label="Site sections" className="sr-only">
        <Link href="/tools">All AI Tools</Link>
        <Link href="/toolkits">AI Toolkits</Link>
        <Link href="/use-cases">Use Cases</Link>
        <Link href="/blog">Blog</Link>
        <Link href="/toolkits">Pricing</Link>
        <Link href="/features">Features</Link>
        <Link href="/sitemap-index.xml">Sitemap</Link>
      </nav>
    </main>
  );
}
