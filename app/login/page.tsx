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
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign in to AI Tools Hub</h1>
          <p className="text-sm text-gray-500">
            Subscribe to any toolkit and unlock unlimited generations.
          </p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
