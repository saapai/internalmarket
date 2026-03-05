"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import MarketCard from "@/components/MarketCard";
import CategoryFilter from "@/components/CategoryFilter";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";

interface Market {
  id: string;
  candidate: string;
  yes_pool: number;
  no_pool: number;
  resolved: boolean;
  outcome: boolean | null;
  category_id: string;
  category: { title: string } | null;
}

interface Category {
  id: string;
  title: string;
  sort_order: number;
}

export default function HomePage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();

  const fetchData = async () => {
    const [marketsRes, catsRes] = await Promise.all([
      supabase
        .from("markets")
        .select("*, category:categories(title)")
        .order("created_at"),
      supabase.from("categories").select("*").order("sort_order"),
    ]);

    if (marketsRes.data) setMarkets(marketsRes.data as unknown as Market[]);
    if (catsRes.data) setCategories(catsRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Subscribe to realtime updates on markets
    const channel = supabase
      .channel("markets-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "markets" },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = markets.filter((m) => {
    if (selectedCategory && m.category_id !== selectedCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        m.candidate.toLowerCase().includes(q) ||
        (m.category?.title || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleQuickBet = (marketId: string) => {
    router.push(`/market/${marketId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="font-mono text-sm text-charcoal/40 animate-pulse">
          Loading markets...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="text-center py-4">
        <h1 className="text-3xl font-bold tracking-tight">
          SEP <span className="font-mono text-charcoal/40">MARKET</span>
        </h1>
        <p className="text-charcoal/50 text-sm mt-1">
          Winter Formal Superlative Predictions
        </p>
      </div>

      {/* Search */}
      <Input
        placeholder="Search markets..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md mx-auto"
      />

      {/* Category filters */}
      <CategoryFilter
        categories={categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {/* Market grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-charcoal/40 font-mono text-sm">
          No markets found
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((market) => (
            <MarketCard
              key={market.id}
              market={{
                ...market,
                category: market.category || undefined,
              }}
              onQuickBet={handleQuickBet}
            />
          ))}
        </div>
      )}
    </div>
  );
}
