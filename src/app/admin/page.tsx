"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/Toast";
import { formatCurrency, calcProbability } from "@/lib/market-math";

const ADMIN_PASSKEY = "penis";

interface UserProfile {
  id: string;
  phone: string;
  display_name: string;
  balance: number;
  is_admin: boolean;
}

interface Market {
  id: string;
  candidate: string;
  yes_pool: number;
  no_pool: number;
  resolved: boolean;
  outcome: boolean | null;
  category: { title: string } | null;
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [passkey, setPasskey] = useState("");
  const [tab, setTab] = useState<"users" | "deposit" | "resolve">("users");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [searchUser, setSearchUser] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();

  const checkPasskey = () => {
    if (passkey === ADMIN_PASSKEY) {
      setAuthenticated(true);
    } else {
      toast("Wrong passkey", "error");
    }
  };

  const fetchData = async () => {
    const [usersRes, marketsRes] = await Promise.all([
      supabase.from("profiles").select("*").order("display_name"),
      supabase
        .from("markets")
        .select("*, category:categories(title)")
        .eq("resolved", false)
        .order("created_at"),
    ]);
    if (usersRes.data) setUsers(usersRes.data);
    if (marketsRes.data) setMarkets(marketsRes.data as unknown as Market[]);
  };

  useEffect(() => {
    if (authenticated) fetchData();
  }, [authenticated]);

  const creditBalance = async () => {
    if (!selectedUser || !depositAmount) return;
    setLoading(true);
    const amount = parseFloat(depositAmount);

    const { error } = await supabase
      .from("profiles")
      .update({ balance: users.find((u) => u.id === selectedUser)!.balance + amount })
      .eq("id", selectedUser);

    if (!error) {
      await supabase.from("transactions").insert({
        user_id: selectedUser,
        type: "deposit",
        amount: amount,
        description: `Admin deposit: $${amount.toFixed(2)}`,
      });
      toast(`Credited ${formatCurrency(amount)}`, "success");
      setDepositAmount("");
      setSelectedUser(null);
      fetchData();
    } else {
      toast("Failed to credit", "error");
    }
    setLoading(false);
  };

  const resolveMarket = async (marketId: string, outcome: boolean) => {
    setLoading(true);
    const { data, error } = await supabase.rpc("resolve_market", {
      p_market_id: marketId,
      p_outcome: outcome,
    });

    if (error) {
      toast("Failed to resolve: " + error.message, "error");
    } else {
      const result = data as { error?: string; total_paid?: number };
      if (result.error) {
        toast(result.error, "error");
      } else {
        toast(
          `Market resolved! Paid out ${formatCurrency(result.total_paid || 0)}`,
          "success"
        );
        fetchData();
      }
    }
    setLoading(false);
  };

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-sm p-8">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold font-mono">ADMIN</h1>
            <p className="text-charcoal/50 text-sm mt-1">Enter passkey</p>
          </div>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Passkey"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && checkPasskey()}
            />
            <Button className="w-full" onClick={checkPasskey}>
              Enter
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const filteredUsers = users.filter(
    (u) =>
      (u.display_name || "").toLowerCase().includes(searchUser.toLowerCase()) ||
      (u.phone || "").includes(searchUser)
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold font-mono">ADMIN PANEL</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["users", "deposit", "resolve"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              tab === t
                ? "bg-charcoal text-white"
                : "bg-white border border-charcoal/10 text-charcoal/70 hover:bg-charcoal/5"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Users tab */}
      {tab === "users" && (
        <Card className="p-6">
          <Input
            placeholder="Search users by name or phone..."
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            className="mb-4"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-charcoal/10">
                  <th className="text-left py-2 text-charcoal/50 font-medium">Name</th>
                  <th className="text-left py-2 text-charcoal/50 font-medium">Phone</th>
                  <th className="text-right py-2 text-charcoal/50 font-medium">Balance</th>
                  <th className="text-right py-2 text-charcoal/50 font-medium">Admin</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-charcoal/5 hover:bg-charcoal/[0.02]"
                  >
                    <td className="py-2 font-medium">
                      {user.display_name || "—"}
                    </td>
                    <td className="py-2 font-mono text-charcoal/50">
                      {user.phone || "—"}
                    </td>
                    <td className="py-2 text-right font-mono font-semibold">
                      {formatCurrency(user.balance)}
                    </td>
                    <td className="py-2 text-right">
                      {user.is_admin && (
                        <span className="text-xs bg-charcoal/10 px-2 py-0.5 rounded">
                          admin
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Deposit tab */}
      {tab === "deposit" && (
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Credit / Debit User Balance</h2>
          <div>
            <label className="block text-xs text-charcoal/50 mb-1">
              Select User
            </label>
            <select
              className="w-full px-4 py-2.5 rounded-lg border border-charcoal/10 bg-white font-mono text-sm"
              value={selectedUser || ""}
              onChange={(e) => setSelectedUser(e.target.value || null)}
            >
              <option value="">Choose user...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.display_name || u.phone} — {formatCurrency(u.balance)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-charcoal/50 mb-1">
              Amount (negative to debit)
            </label>
            <Input
              type="number"
              step="0.01"
              placeholder="10.00"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
            />
          </div>
          <Button
            onClick={creditBalance}
            disabled={loading || !selectedUser || !depositAmount}
          >
            {loading ? "Processing..." : "Credit Balance"}
          </Button>
        </Card>
      )}

      {/* Resolve tab */}
      {tab === "resolve" && (
        <div className="space-y-4">
          {markets.length === 0 ? (
            <Card className="p-6 text-center text-charcoal/40 font-mono text-sm">
              No unresolved markets
            </Card>
          ) : (
            markets.map((market) => {
              const prob = calcProbability(market.yes_pool, market.no_pool);
              return (
                <Card key={market.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-charcoal/40 uppercase">
                        {market.category?.title}
                      </span>
                      <h3 className="font-semibold">{market.candidate}</h3>
                      <span className="text-xs font-mono text-charcoal/40">
                        Pool: {formatCurrency(market.yes_pool + market.no_pool)}{" "}
                        | YES: {Math.round(prob)}%
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="yes"
                        size="sm"
                        onClick={() => resolveMarket(market.id, true)}
                        disabled={loading}
                      >
                        YES Wins
                      </Button>
                      <Button
                        variant="no"
                        size="sm"
                        onClick={() => resolveMarket(market.id, false)}
                        disabled={loading}
                      >
                        NO Wins
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
