import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import SignupForm from "./SignupForm";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your AI Tools Station account. Subscribe to any AI toolkit and start generating with unlimited access.",
};

export default async function SignupPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");
  return (
    <main className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-4xl">
        <SignupForm />
      </div>
    </main>
  );
}
