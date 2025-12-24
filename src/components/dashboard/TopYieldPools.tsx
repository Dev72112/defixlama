import { useMemo } from "react";
import { formatCurrency } from "@/lib/api/defillama";
import { TrendingUp, Droplets } from "lucide-react";

interface TopYieldPoolsProps {
  pools: { symbol: string; tvlUsd?: number; apyBase?: number; apyReward?: number; project?: string }[];
  loading?: boolean;
}

export function TopYieldPools({ pools, loading }: TopYieldPoolsProps) {
  const topPools = useMemo(() => {
    if (!pools || pools.length === 0) return [];
    return [...pools]
      .map((p) => ({
        symbol: p.symbol,
        project: p.project || "Unknown",
        tvl: p.tvlUsd || 0,
        apy: (p.apyBase || 0) + (p.apyReward || 0),
      }))
      .sort((a, b) => b.apy - a.apy)
      .slice(0, 5);
  }, [pools]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="skeleton h-5 w-32 mb-4" />
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (topPools.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="font-semibold text-foreground mb-4">Top Yield Pools</h3>
        <p className="text-sm text-muted-foreground">No pools available</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Top Yield Pools</h3>
        <TrendingUp className="h-4 w-4 text-success" />
      </div>
      <div className="space-y-2">
        {topPools.map((pool, index) => (
          <div
            key={`${pool.symbol}-${index}`}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Droplets className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm truncate max-w-[120px]">{pool.symbol}</p>
                <p className="text-xs text-muted-foreground">{pool.project}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-success">{pool.apy.toFixed(2)}%</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(pool.tvl)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
