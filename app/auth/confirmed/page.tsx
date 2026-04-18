import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Email Confirmed",
};

export default function EmailConfirmedPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        {/* Icon */}
        <div className="text-6xl mb-6">✅</div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Email Confirmed!</h1>

        {/* Description */}
        <p className="text-gray-500 text-sm mb-8">
          Your email has been verified. You can now sign in to your account.
        </p>

        {/* CTA */}
        <Link
          href="/login"
          className="inline-block bg-indigo-600 text-white text-sm font-medium px-8 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Sign In →
        </Link>
      </div>
    </div>
  );
}
