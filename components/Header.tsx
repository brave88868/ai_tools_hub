"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Initial state: verify with server
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));

    // Listen for auth changes.
    // Do NOT call router.refresh() here — it causes router reference to
    // change, re-runs this effect, and creates a race between getUser() and
    // the just-completed signOut(), leaving the user appearing logged-in.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex flex-col">
          <Link href="/" className="text-base font-bold text-gray-900 tracking-tight">
            AI Tools Hub
          </Link>
          <p className="text-xs text-gray-400 mt-0.5">50+ AI tools · Free to start</p>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/toolkits" className={`relative text-[15px] font-medium transition-colors duration-200 after:absolute after:bottom-[-2px] after:left-0 after:h-[2px] after:bg-indigo-500 after:transition-all after:duration-200 ${pathname.startsWith("/toolkits") ? "text-indigo-600 after:w-full" : "text-gray-700 hover:text-indigo-600 after:w-0 hover:after:w-full"}`}>Toolkits</Link>
          <Link href="/blog" className={`relative text-[15px] font-medium transition-colors duration-200 after:absolute after:bottom-[-2px] after:left-0 after:h-[2px] after:bg-indigo-500 after:transition-all after:duration-200 ${pathname.startsWith("/blog") ? "text-indigo-600 after:w-full" : "text-gray-700 hover:text-indigo-600 after:w-0 hover:after:w-full"}`}>Blog</Link>
          <Link href="/features" className={`relative text-[15px] font-medium transition-colors duration-200 after:absolute after:bottom-[-2px] after:left-0 after:h-[2px] after:bg-indigo-500 after:transition-all after:duration-200 ${pathname.startsWith("/features") ? "text-indigo-600 after:w-full" : "text-gray-700 hover:text-indigo-600 after:w-0 hover:after:w-full"}`}>Features</Link>
          <Link href="/roadmap" className={`relative text-[15px] font-medium transition-colors duration-200 after:absolute after:bottom-[-2px] after:left-0 after:h-[2px] after:bg-indigo-500 after:transition-all after:duration-200 ${pathname.startsWith("/roadmap") ? "text-indigo-600 after:w-full" : "text-gray-700 hover:text-indigo-600 after:w-0 hover:after:w-full"}`}>Roadmap</Link>
          <Link href="/pricing" className={`relative text-[15px] font-medium transition-colors duration-200 after:absolute after:bottom-[-2px] after:left-0 after:h-[2px] after:bg-indigo-500 after:transition-all after:duration-200 ${pathname === "/pricing" ? "text-indigo-600 after:w-full" : "text-gray-700 hover:text-indigo-600 after:w-0 hover:after:w-full"}`}>Pricing</Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link href="/dashboard" className="text-[15px] font-medium text-gray-700 hover:text-indigo-600 transition-colors">
                Dashboard
              </Link>
              <button onClick={handleSignOut} className="text-[15px] font-medium text-gray-700 hover:text-indigo-600 transition-colors">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-[15px] font-medium text-gray-700 hover:text-indigo-600 transition-colors">
                Sign In
              </Link>
              <Link href="/signup" className="text-sm bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors font-semibold">
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
          <Link href="/roadmap" className="text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>Roadmap</Link>
          <Link href="/pricing" className="text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>Pricing</Link>
          {user ? (
            <>
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <button onClick={() => { setMenuOpen(false); handleSignOut(); }} className="text-left text-gray-600 hover:text-gray-900">Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>Sign In</Link>
              <Link href="/signup" className="bg-black text-white text-center px-4 py-2 rounded-lg font-semibold" onClick={() => setMenuOpen(false)}>Sign Up</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
