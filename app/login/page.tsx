import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign In | AI Tools Hub",
  description: "Sign in to AI Tools Hub. Subscribe to any AI toolkit and unlock unlimited generations.",
};

export default async function LoginPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");
  return (
    <main className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-4xl">
        <LoginForm />
      </div>
    </main>
  );
}
