"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function Header() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      router.refresh();
    });
    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-base font-bold text-gray-900 tracking-tight">
          AI Tools Hub
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-500">
          <Link href="/toolkits" className="hover:text-gray-900 transition-colors">Toolkits</Link>
          <Link href="/blog" className="hover:text-gray-900 transition-colors">Blog</Link>
          <Link href="/pricing" className="hover:text-gray-900 transition-colors">Pricing</Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                Dashboard
              </Link>
              <Link href="/auth/signout" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                Sign Out
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                Sign In
              </Link>
              <Link href="/signup" className="text-sm bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                Sign Up
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden text-gray-500" onClick={() => setMenuOpen(!menuOpen)}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-4 text-sm">
          <Link href="/toolkits" className="text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>Toolkits</Link>
          <Link href="/blog" className="text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>Blog</Link>
          <Link href="/pricing" className="text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>Pricing</Link>
          {user ? (
            <>
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link href="/auth/signout" className="text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>Sign Out</Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>Sign In</Link>
              <Link href="/signup" className="bg-black text-white text-center px-4 py-2 rounded-lg" onClick={() => setMenuOpen(false)}>Sign Up</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
