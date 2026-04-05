import { createServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

// POST-only: prevents Next.js <Link> prefetch from auto-triggering sign-out.
// The Dashboard quick-link uses a <form method="POST"> to call this route.
export async function POST(request: Request) {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url));
}
