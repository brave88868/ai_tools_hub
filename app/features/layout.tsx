import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feature Requests & Roadmap | AI Tools Station",
  description:
    "Vote on upcoming features, suggest new AI tools, and track the AI Tools Station product roadmap. Your feedback shapes what we build next.",
  alternates: { canonical: "https://www.aitoolsstation.com/features" },
};

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
