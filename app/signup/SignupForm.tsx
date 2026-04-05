"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleGoogleSignup() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: "https://www.aitoolsstation.com/auth/callback" },
    });
    if (error) setError(error.message);
    setLoading(false);
  }

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(password)) {
      setError("Password must contain both letters and numbers");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: "https://www.aitoolsstation.com/auth/callback" },
    });

    if (error) {
      setError(error.message);
    } else {
      // Supabase may create an unverified session after signUp().
      // Sign out so the header shows Sign In / Sign Up, not Dashboard.
      await supabase.auth.signOut();
      setSuccess(true);
      // Explicitly refresh once so the server component picks up the
      // cleared session. This is safe because we call it once here,
      // not inside onAuthStateChange (which caused an infinite loop).
      router.refresh();
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto border border-gray-200 rounded-2xl p-8 bg-white shadow-sm text-center">
        <div className="text-4xl mb-4">📧</div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Check your email</h2>
        <p className="text-sm text-gray-400">
          We sent a confirmation link to <strong>{email}</strong>. Click the link to activate your account.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
      {/* Left — brand panel */}
      <div className="hidden md:block">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          ✦ AI Tools Station
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Start for free</h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          3 free uses per day. No credit card required.
        </p>
        <div className="space-y-3">
          {[
            "Resume & cover letter optimization",
            "YouTube & blog content creation",
            "Marketing copy & ads",
            "Business proposals & contracts",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-4 h-4 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center text-xs">✓</span>
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Right — form */}
      <div className="border border-gray-200 rounded-2xl p-7 bg-white shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Create your account</h1>
        <p className="text-sm text-gray-400 mb-6">Start free — no credit card required.</p>

        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailSignup} className="space-y-3">
          <input type="email" placeholder="Email address" required value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          <input type="password" placeholder="Password" required value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          <input type="password" placeholder="Confirm password" required value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
