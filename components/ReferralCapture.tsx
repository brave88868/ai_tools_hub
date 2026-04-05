"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ReferralCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (!ref) return;
    // Store in cookie for 30 days (auth/callback reads it)
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `referrer_code=${ref}; expires=${expires}; path=/; SameSite=Lax`;
  }, [searchParams]);

  return null;
}
