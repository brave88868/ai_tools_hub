import type { Metadata } from "next";
import Script from "next/script";
import "@/styles/globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata: Metadata = {
  title: {
    default: "AI Tools Hub — 50+ AI tools to boost productivity",
    template: "%s | AI Tools Hub",
  },
  description:
    "Free AI tools for resume optimization, content creation, marketing copy, business analysis, and legal documents.",
  verification: {
    google: "ajg5WUsl3Y2Wud0Y81FGuVqt_cv022967bfCQblVZuQ",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
        <Header />
        <div className="pt-14">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
