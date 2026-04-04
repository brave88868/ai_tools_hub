import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import SignupForm from "./SignupForm";

export const metadata: Metadata = {
  title: "Create Account | AI Tools Hub",
  description: "Create your AI Tools Hub account. Subscribe to any AI toolkit and start generating with unlimited access.",
};

export default async function SignupPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");
  return (
    <main className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create your account</h1>
          <p className="text-sm text-gray-500">
            Subscribe to any toolkit and unlock unlimited generations.
          </p>
        </div>

        <SignupForm />
      </div>
    </main>
  );
}
