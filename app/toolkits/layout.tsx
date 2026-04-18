import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Toolkits — Curated Workflow Bundles",
  description:
    "Browse curated AI toolkits for job seekers, marketers, developers, and more. Each toolkit bundles the best AI tools for your workflow.",
  alternates: {
    canonical: "https://www.aitoolsstation.com/toolkits",
  },
};

export default function ToolkitsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
