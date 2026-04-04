import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign In | AI Tools Hub",
  description: "Sign in to AI Tools Hub. Subscribe to any AI toolkit and unlock unlimited generations.",
};

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const { error } = await searchParams;

  return (
    <main className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-4xl">
        {error === "confirmation_failed" && (
          <div className="max-w-md mx-auto mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 text-center">
            Email confirmation failed. Please try signing up again or contact support.
          </div>
        )}
        <LoginForm />
      </div>
    </main>
  );
}
