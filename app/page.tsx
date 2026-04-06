import type { Metadata } from "next";
import Link from "next/link";
import Hero from "@/components/home/Hero";
import SocialProof from "@/components/home/SocialProof";
import Toolkits from "@/components/home/Toolkits";
import PopularTools from "@/components/home/PopularTools";
import HowItWorks from "@/components/home/HowItWorks";
import ExampleResults from "@/components/home/ExampleResults";
import PricingPreview from "@/components/home/PricingPreview";
import FAQ from "@/components/home/FAQ";
import FinalCTA from "@/components/home/FinalCTA";

export const metadata: Metadata = {
  title: "AI Tools Station — 150+ Free AI Tools for Real Workflows",
  description:
    "Generate resumes, marketing copy, YouTube scripts, business plans and more with 150+ free AI tools. Start free, no credit card required.",
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
      {accessDenied && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 text-center">
          <p className="text-sm text-red-700 font-medium">
            Access denied — you do not have admin privileges.
          </p>
        </div>
      )}
      <Hero />
      <SocialProof />
      <Toolkits />
      <PopularTools />
      <HowItWorks />
      <ExampleResults />
      <PricingPreview />
      <FAQ />
      <FinalCTA />

      {/* Hidden nav for Google crawl discovery — not visible to users */}
      <nav aria-label="Site sections" className="sr-only">
        <Link href="/tools">All AI Tools</Link>
        <Link href="/toolkits">AI Toolkits</Link>
        <Link href="/use-cases">Use Cases</Link>
        <Link href="/blog">Blog</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/features">Features</Link>
        <Link href="/sitemap-index.xml">Sitemap</Link>
      </nav>
    </main>
  );
}
