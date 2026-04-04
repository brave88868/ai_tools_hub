import type { Metadata } from "next";
import "@/styles/globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "AI Tools Hub — 50+ AI tools to boost productivity",
    template: "%s | AI Tools Hub",
  },
  description:
    "Free AI tools for resume optimization, content creation, marketing copy, business analysis, and legal documents.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Header />
        <div className="pt-14">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
