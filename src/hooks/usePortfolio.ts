import { useState, useEffect, useCallback } from "react";
import { useTokenPrices } from "./useTokenData";

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

export function usePortfolio() {
  const [holdings, setHoldings] = useState<Holding[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const { data: tokenPrices = [] } = useTokenPrices();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
  }, [holdings]);

  const addHolding = useCallback((holding: Omit<Holding, "id" | "addedAt">) => {
    const newHolding: Holding = {
      ...holding,
      id: crypto.randomUUID(),
      addedAt: Date.now(),
    };
    setHoldings((prev) => [...prev, newHolding]);
  }, []);

  const removeHolding = useCallback((id: string) => {
    setHoldings((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const updateHolding = useCallback((id: string, updates: Partial<Holding>) => {
    setHoldings((prev) =>
      prev.map((h) => (h.id === id ? { ...h, ...updates } : h))
    );
  }, []);

  // Calculate portfolio value with current prices
  const portfolioWithPrices = holdings.map((h) => {
    const token = tokenPrices.find(
      (t) => t.symbol.toLowerCase() === h.symbol.toLowerCase()
    );
    const currentPrice = token?.price || 0;
    const value = h.quantity * currentPrice;
    const costBasis = h.purchasePrice ? h.quantity * h.purchasePrice : 0;
    const pnl = costBasis > 0 ? value - costBasis : 0;
    const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

    return {
      ...h,
      currentPrice,
      value,
      costBasis,
      pnl,
      pnlPercent,
      change24h: token?.change24h || 0,
      logo: token?.logo,
    };
  });

  const totalValue = portfolioWithPrices.reduce((sum, h) => sum + h.value, 0);
  const totalCostBasis = portfolioWithPrices.reduce((sum, h) => sum + h.costBasis, 0);
  const totalPnl = totalCostBasis > 0 ? totalValue - totalCostBasis : 0;
  const totalPnlPercent = totalCostBasis > 0 ? (totalPnl / totalCostBasis) * 100 : 0;

  return {
    holdings: portfolioWithPrices,
    addHolding,
    removeHolding,
    updateHolding,
    totalValue,
    totalCostBasis,
    totalPnl,
    totalPnlPercent,
    tokenPrices,
  };
}
