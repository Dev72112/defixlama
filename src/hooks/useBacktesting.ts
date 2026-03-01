import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CACHE_TIERS } from "@/lib/cacheConfig";

interface BacktestParams {
  protocolSlug: string;
  initialInvestment: number;
  durationDays: number;
}

interface BacktestResult {
  projectedValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  maxDrawdown: number;
  sharpeRatio: number;
  dailyReturns: { date: string; value: number }[];
}

// Fetch all protocols for the selector
export function useProtocolList() {
  return useQuery({
    queryKey: ["backtester-protocols"],
    queryFn: async () => {
      const res = await fetch("https://api.llama.fi/protocols");
      if (!res.ok) throw new Error("Failed to fetch protocols");
      const data = await res.json();
      return (data as any[])
        .filter((p: any) => p.tvl > 0)
        .sort((a: any, b: any) => (b.tvl || 0) - (a.tvl || 0))
        .slice(0, 500)
        .map((p: any) => ({
          name: p.name,
          slug: p.slug,
          tvl: p.tvl,
          category: p.category,
          logo: p.logo,
          change_1d: p.change_1d,
          change_7d: p.change_7d,
        }));
    },
    ...CACHE_TIERS.STATIC,
  });
}

// Fetch historical TVL for a protocol
function useProtocolTVLHistory(slug: string) {
  return useQuery({
    queryKey: ["protocol-tvl-history", slug],
    queryFn: async () => {
      if (!slug) return [];
      const res = await fetch(`https://api.llama.fi/protocol/${slug}`);
      if (!res.ok) throw new Error("Failed to fetch protocol data");
      const data = await res.json();
      return (data.tvl as any[]) || [];
    },
    enabled: !!slug,
    ...CACHE_TIERS.SEMI_STATIC,
  });
}

export function useBacktesting() {
  const [params, setParams] = useState<BacktestParams>({
    protocolSlug: "",
    initialInvestment: 10000,
    durationDays: 365,
  });

  const { data: tvlHistory, isLoading: loadingHistory } = useProtocolTVLHistory(params.protocolSlug);

  const result = useMemo((): BacktestResult | null => {
    if (!tvlHistory || tvlHistory.length < 2) return null;

    const days = params.durationDays;
    const relevantData = tvlHistory.slice(-days);
    if (relevantData.length < 2) return null;

    // Calculate daily TVL returns as proxy for protocol performance
    const dailyReturns: { date: string; value: number }[] = [];
    let cumulativeValue = params.initialInvestment;
    let maxValue = cumulativeValue;
    let maxDrawdown = 0;
    const returns: number[] = [];

    for (let i = 1; i < relevantData.length; i++) {
      const prevTvl = relevantData[i - 1].totalLiquidityUSD;
      const currTvl = relevantData[i].totalLiquidityUSD;
      if (prevTvl <= 0) continue;

      const dailyReturn = (currTvl - prevTvl) / prevTvl;
      // Dampen returns to simulate realistic investment returns
      const dampened = dailyReturn * 0.3;
      returns.push(dampened);
      cumulativeValue *= (1 + dampened);
      maxValue = Math.max(maxValue, cumulativeValue);
      const drawdown = (maxValue - cumulativeValue) / maxValue;
      maxDrawdown = Math.max(maxDrawdown, drawdown);

      dailyReturns.push({
        date: new Date(relevantData[i].date * 1000).toISOString().split("T")[0],
        value: cumulativeValue,
      });
    }

    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    );
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(365) : 0;

    return {
      projectedValue: cumulativeValue,
      totalReturn: cumulativeValue - params.initialInvestment,
      totalReturnPercent: ((cumulativeValue - params.initialInvestment) / params.initialInvestment) * 100,
      maxDrawdown: maxDrawdown * 100,
      sharpeRatio,
      dailyReturns,
    };
  }, [tvlHistory, params.initialInvestment, params.durationDays]);

  const updateParams = useCallback((updates: Partial<BacktestParams>) => {
    setParams((prev) => ({ ...prev, ...updates }));
  }, []);

  return {
    params,
    updateParams,
    result,
    isLoading: loadingHistory,
    protocols: undefined as any, // provided separately
  };
}
