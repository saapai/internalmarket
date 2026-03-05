"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/Toast";
import { formatCurrency, calcProbability, hasLiquidity } from "@/lib/market-math";

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
  const [tab, setTab] = useState<"users" | "balance" | "resolve">("users");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [searchUser, setSearchUser] = useState("");
  const [newBalance, setNewBalance] = useState("");
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

  // When user is selected, pre-fill with their current balance
  useEffect(() => {
    if (selectedUser) {
      const user = users.find((u) => u.id === selectedUser);
      if (user) setNewBalance(user.balance.toString());
    } else {
      setNewBalance("");
    }
  }, [selectedUser]);

  const setBalance = async () => {
    if (!selectedUser || newBalance === "") return;
    setLoading(true);
    const targetBalance = parseFloat(newBalance);
    const user = users.find((u) => u.id === selectedUser)!;
    const diff = targetBalance - user.balance;

    const { error } = await supabase
      .from("profiles")
      .update({ balance: targetBalance })
      .eq("id", selectedUser);

    if (!error) {
      if (diff !== 0) {
        await supabase.from("transactions").insert({
          user_id: selectedUser,
          type: diff > 0 ? "deposit" : "withdrawal",
          amount: diff,
          description: `Admin set balance to $${targetBalance.toFixed(2)} (${diff > 0 ? "+" : ""}${diff.toFixed(2)})`,
        });
      }
      toast(`Set ${user.display_name || "user"} balance to ${formatCurrency(targetBalance)}`, "success");
      setNewBalance("");
      setSelectedUser(null);
      fetchData();
    } else {
      toast("Failed to update balance", "error");
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

  const selectedUserData = selectedUser
    ? users.find((u) => u.id === selectedUser)
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold font-mono">ADMIN PANEL</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["users", "balance", "resolve"] as const).map((t) => (
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

      {/* Balance tab */}
      {tab === "balance" && (
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Set User Balance</h2>
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
                  {u.display_name || u.phone} — current: {formatCurrency(u.balance)}
                </option>
              ))}
            </select>
          </div>

          {selectedUserData && (
            <div className="p-3 bg-cream rounded-lg border border-charcoal/5">
              <div className="flex justify-between text-sm">
                <span className="text-charcoal/50">Current balance</span>
                <span className="font-mono font-bold">
                  {formatCurrency(selectedUserData.balance)}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs text-charcoal/50 mb-1">
              New Balance
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={newBalance}
              onChange={(e) => setNewBalance(e.target.value)}
            />
          </div>

          {selectedUserData && newBalance !== "" && (
            <div className="p-3 bg-cream rounded-lg border border-charcoal/5">
              <div className="flex justify-between text-sm">
                <span className="text-charcoal/50">Change</span>
                <span
                  className={`font-mono font-bold ${
                    parseFloat(newBalance) - selectedUserData.balance >= 0
                      ? "text-yes"
                      : "text-no"
                  }`}
                >
                  {parseFloat(newBalance) - selectedUserData.balance >= 0 ? "+" : ""}
                  {formatCurrency(
                    parseFloat(newBalance) - selectedUserData.balance
                  )}
                </span>
              </div>
            </div>
          )}

          <Button
            onClick={setBalance}
            disabled={loading || !selectedUser || newBalance === ""}
          >
            {loading ? "Updating..." : "Set Balance"}
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
              const liquid = hasLiquidity(market.yes_pool, market.no_pool);
              return (
                <Card key={market.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-charcoal/40 uppercase">
                        {market.category?.title}
                      </span>
                      <h3 className="font-semibold">{market.candidate}</h3>
                      <span className="text-xs font-mono text-charcoal/40">
                        {liquid
                          ? `Pool: ${formatCurrency(market.yes_pool + market.no_pool)} | YES: ${Math.round(prob)}%`
                          : "No bets yet"}
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
