import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://www.aitoolsstation.com/toolkits",
  },
};

export default function PricingPage() {
  redirect("/toolkits");
}
