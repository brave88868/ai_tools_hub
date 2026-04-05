import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import LoginForm from "./LoginForm";
import ResendConfirmationBanner from "./ResendConfirmationBanner";

export const metadata: Metadata = {
  title: "Sign In | AI Tools Hub",
  description: "Sign in to AI Tools Hub. Subscribe to any AI toolkit and unlock unlimited generations.",
};

interface Props {
  searchParams: Promise<{ error?: string; next?: string; email?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error, next, email } = await searchParams;
  const destination = next || "/dashboard";

  // 已登录用户直接跳到目标页（保留 next 参数）
  if (user) redirect(destination);

  return (
    <main className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-4xl">
        {error === "confirmation_expired" && (
          <ResendConfirmationBanner email={email} />
        )}
        {error === "confirmation_failed" && (
          <div className="max-w-md mx-auto mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 text-center">
            Email confirmation failed. Please try signing up again or contact support.
          </div>
        )}
        <LoginForm next={destination} />
      </div>
    </main>
  );
}
