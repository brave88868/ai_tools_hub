import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import "@/styles/globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ReferralCapture from "@/components/ReferralCapture";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

const SITE_URL = "https://aitoolsstation.com";

export const metadata: Metadata = {
  title: {
    default: "AI Tools Hub — 50+ AI tools to boost productivity",
    template: "%s | AI Tools Hub",
  },
  description:
    "Free AI tools for resume optimization, content creation, marketing copy, business analysis, and legal documents.",
  metadataBase: new URL(SITE_URL),
  verification: {
    google: "ajg5WUsl3Y2Wud0Y81FGuVqt_cv022967bfCQblVZuQ",
  },
  openGraph: {
    type: "website",
    siteName: "AI Tools Hub",
    title: "AI Tools Hub — 50+ AI tools to boost productivity",
    description:
      "Free AI tools for resume optimization, content creation, marketing copy, business analysis, and legal documents.",
    url: SITE_URL,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "AI Tools Hub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@aitoolsstation",
    title: "AI Tools Hub — 50+ AI tools to boost productivity",
    description:
      "Free AI tools for resume optimization, content creation, marketing copy, business analysis, and legal documents.",
    images: [`${SITE_URL}/og-image.png`],
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
        <Suspense fallback={null}>
          <ReferralCapture />
        </Suspense>
        <Header />
        <div className="pt-14">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
