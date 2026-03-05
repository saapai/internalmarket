"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/market-math";

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ id: string; display_name: string; balance: number } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, display_name, balance")
          .eq("id", authUser.id)
          .single();
        if (profile) setUser(profile);
      }
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      getUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  const links = [
    { href: "/", label: "Markets" },
    { href: "/leaderboard", label: "Leaderboard" },
    ...(user ? [{ href: "/portfolio", label: "Portfolio" }] : []),
  ];

  return (
    <nav className="glass sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-lg tracking-tight">
            <span className="text-charcoal">SEP</span>
            <span className="text-charcoal/40 font-mono text-sm ml-1">MARKET</span>
          </Link>
          <div className="hidden sm:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-charcoal/10 text-charcoal"
                    : "text-charcoal/50 hover:text-charcoal hover:bg-charcoal/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="font-mono text-sm font-semibold text-yes">
                {formatCurrency(user.balance)}
              </span>
              <Link
                href="/portfolio"
                className="text-sm font-medium text-charcoal/70 hover:text-charcoal transition-colors"
              >
                {user.display_name}
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-lg bg-charcoal text-white text-sm font-medium hover:bg-charcoal/90 transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </div>
      {/* Mobile nav */}
      <div className="sm:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`shrink-0 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              pathname === link.href
                ? "bg-charcoal/10 text-charcoal"
                : "text-charcoal/50 hover:text-charcoal"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
