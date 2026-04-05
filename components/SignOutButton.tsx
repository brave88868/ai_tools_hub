"use client";

export default function SignOutButton() {
  return (
    <form method="POST" action="/auth/signout">
      <button
        type="submit"
        className="w-full border border-gray-200 rounded-xl p-4 text-center text-sm text-gray-600 hover:border-gray-400 transition-colors"
      >
        Sign Out
      </button>
    </form>
  );
}
