import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

const DEFAULTS: Record<string, { headline: string; subtext: string; cta_label: string; cta_url: string }> = {
  daily_limit: {
    headline: "You've used all 3 free tools today",
    subtext: "Upgrade to Pro for 100 uses per day and unlimited access to all toolkits.",
    cta_label: "Upgrade to Pro →",
    cta_url: "/pricing",
  },
  lifetime_limit: {
    headline: "You've used all 30 lifetime free uses",
    subtext: "You're a power user! Upgrade to Pro to keep going.",
    cta_label: "Upgrade to Pro →",
    cta_url: "/pricing",
  },
  result_page: {
    headline: "Want to save and export your results?",
    subtext: "Pro users can download PDFs, save history, and run unlimited tools.",
    cta_label: "Unlock Pro Features →",
    cta_url: "/pricing",
  },
  heavy_user: {
    headline: "You're getting serious results",
    subtext: "You've used our tools multiple times this week. Pro will save you hours every day.",
    cta_label: "Go Pro Today →",
    cta_url: "/pricing",
  },
  dashboard: {
    headline: "Unlock your full potential",
    subtext: "Upgrade to Pro for unlimited daily uses, PDF exports, and priority support.",
    cta_label: "Upgrade Now →",
    cta_url: "/pricing",
  },
};

export async function GET(req: NextRequest) {
  const trigger = req.nextUrl.searchParams.get("trigger") ?? "result_page";

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("upgrade_prompts")
      .select("headline, subtext, cta_label, cta_url")
      .eq("trigger", trigger)
      .eq("is_active", true)
      .single();

    if (data) {
      return NextResponse.json(data);
    }
  } catch { /* fallback */ }

  return NextResponse.json(DEFAULTS[trigger] ?? DEFAULTS["result_page"]);
}
