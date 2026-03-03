import { useState, useEffect, useCallback } from "react";
import { useTokenPrices } from "./useTokenData";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface Holding {
  id: string;
  tokenId: string;
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice?: number;
  addedAt: number;
}

const STORAGE_KEY = "xlayer-portfolio";

function getLocalHoldings(): Holding[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function setLocalHoldings(holdings: Holding[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings)); } catch {}
}

export function usePortfolio() {
  const { user } = useAuth();
  const [holdings, setHoldings] = useState<Holding[]>(getLocalHoldings);
  const [dbLoaded, setDbLoaded] = useState(false);
  const { data: tokenPrices = [] } = useTokenPrices();

  // Load from DB when authenticated
  useEffect(() => {
    if (!user) { setHoldings(getLocalHoldings()); setDbLoaded(false); return; }

    const load = async () => {
      const { data, error } = await supabase
        .from("portfolio_positions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        const mapped: Holding[] = data.map((d) => ({
          id: d.id,
          tokenId: d.token_id,
          symbol: d.symbol,
          name: d.name,
          quantity: Number(d.quantity),
          purchasePrice: Number(d.entry_price) || undefined,
          addedAt: new Date(d.created_at).getTime(),
        }));
        setHoldings(mapped);
      }
      setDbLoaded(true);
    };
    load();
  }, [user?.id]);

  // Persist to localStorage for guests
  useEffect(() => {
    if (!user) setLocalHoldings(holdings);
  }, [holdings, user]);

  const addHolding = useCallback(async (holding: Omit<Holding, "id" | "addedAt">) => {
    if (user) {
      const { data, error } = await supabase.from("portfolio_positions").insert({
        user_id: user.id,
        token_id: holding.tokenId,
        symbol: holding.symbol,
        name: holding.name,
        quantity: holding.quantity,
        entry_price: holding.purchasePrice || 0,
      }).select().single();

      if (!error && data) {
        setHoldings((prev) => [{
          id: data.id, tokenId: data.token_id, symbol: data.symbol,
          name: data.name, quantity: Number(data.quantity),
          purchasePrice: Number(data.entry_price) || undefined,
          addedAt: new Date(data.created_at).getTime(),
        }, ...prev]);
      }
    } else {
      const newHolding: Holding = { ...holding, id: crypto.randomUUID(), addedAt: Date.now() };
      setHoldings((prev) => [newHolding, ...prev]);
    }
  }, [user]);

  const removeHolding = useCallback(async (id: string) => {
    if (user) {
      await supabase.from("portfolio_positions").delete().eq("id", id).eq("user_id", user.id);
    }
    setHoldings((prev) => prev.filter((h) => h.id !== id));
  }, [user]);

  const updateHolding = useCallback(async (id: string, updates: Partial<Holding>) => {
    if (user) {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
      if (updates.purchasePrice !== undefined) dbUpdates.entry_price = updates.purchasePrice;
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.symbol !== undefined) dbUpdates.symbol = updates.symbol;
      await supabase.from("portfolio_positions").update(dbUpdates).eq("id", id).eq("user_id", user.id);
    }
    setHoldings((prev) => prev.map((h) => (h.id === id ? { ...h, ...updates } : h)));
  }, [user]);

  // Calculate portfolio value with current prices
  const portfolioWithPrices = holdings.map((h) => {
    const token = tokenPrices.find((t) => t.symbol.toLowerCase() === h.symbol.toLowerCase());
    const currentPrice = token?.price || 0;
    const value = h.quantity * currentPrice;
    const costBasis = h.purchasePrice ? h.quantity * h.purchasePrice : 0;
    const pnl = costBasis > 0 ? value - costBasis : 0;
    const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
    return { ...h, currentPrice, value, costBasis, pnl, pnlPercent, change24h: token?.change24h || 0, logo: token?.logo };
  });

  const totalValue = portfolioWithPrices.reduce((sum, h) => sum + h.value, 0);
  const totalCostBasis = portfolioWithPrices.reduce((sum, h) => sum + h.costBasis, 0);
  const totalPnl = totalCostBasis > 0 ? totalValue - totalCostBasis : 0;
  const totalPnlPercent = totalCostBasis > 0 ? (totalPnl / totalCostBasis) * 100 : 0;

  return { holdings: portfolioWithPrices, addHolding, removeHolding, updateHolding, totalValue, totalCostBasis, totalPnl, totalPnlPercent, tokenPrices };
}
