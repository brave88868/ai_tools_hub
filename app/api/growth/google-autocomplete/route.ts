import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";

const SEED_KEYWORDS = [
  "resume summary", "cover letter", "youtube script", "marketing email",
  "business plan", "linkedin profile", "blog post", "social media post",
  "job description", "contract template", "cold email", "pitch deck",
];

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const count: number = Math.min(parseInt(body.count ?? "5", 10), 12);
  let seedKeywords: string[] = body.seed_keywords ?? [];

  const { admin } = auth;

  // 如果没传，从 growth_keywords 取最近 done 的作为种子
  if (seedKeywords.length === 0) {
    const { data: doneKws } = await admin
      .from("growth_keywords")
      .select("keyword")
      .eq("status", "done")
      .order("created_at", { ascending: false })
      .limit(10);
    seedKeywords = (doneKws ?? []).map((r: { keyword: string }) => r.keyword);
  }

  // 仍然没有，使用内置种子词
  if (seedKeywords.length === 0) {
    seedKeywords = SEED_KEYWORDS;
  }

  const seeds = seedKeywords.slice(0, count);

  // 取已存在的关键词用于去重
  const { data: existingKws } = await admin.from("growth_keywords").select("keyword");
  const existingSet = new Set((existingKws ?? []).map((r: { keyword: string }) => r.keyword.toLowerCase()));

  const discovered: string[] = [];
  const errors: string[] = [];

  for (const seed of seeds) {
    try {
      const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(seed)}`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; AI Tools Station Bot)",
          "Accept": "application/json",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        console.error(`[google-autocomplete] fetch failed for "${seed}": ${res.status}`);
        continue;
      }

      const data = await res.json();
      // Google Autocomplete 返回格式：[query, [suggestion1, suggestion2, ...], ...]
      const suggestions: string[] = Array.isArray(data[1]) ? data[1] : [];

      const filtered = suggestions.filter(
        (s) => typeof s === "string" && s.length > 5 && !existingSet.has(s.toLowerCase())
      );

      for (const suggestion of filtered) {
        const { error } = await admin.from("growth_keywords").insert({
          keyword: suggestion.toLowerCase().trim(),
          source: "autocomplete",
          status: "pending",
        });
        if (!error) {
          discovered.push(suggestion);
          existingSet.add(suggestion.toLowerCase());
        }
      }
    } catch (err) {
      const msg = (err as Error).message;
      console.error(`[google-autocomplete] error for "${seed}":`, msg);
      errors.push(`${seed}: ${msg}`);
    }
  }

  return NextResponse.json({ discovered: discovered.length, keywords: discovered, errors: errors.slice(0, 5) });
}
