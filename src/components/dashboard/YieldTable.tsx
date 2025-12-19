import { YieldPool, formatCurrency } from "@/lib/api/defillama";
import { cn } from "@/lib/utils";
import { TrendingUp, Droplets } from "lucide-react";

interface YieldTableProps {
  pools: YieldPool[];
  loading?: boolean;
  limit?: number;
  className?: string;
}

export function YieldTable({
  pools,
  loading = false,
  limit,
  className,
}: YieldTableProps) {
  const displayPools = limit ? pools.slice(0, limit) : pools;

  // Sort by APY
  const sortedPools = [...displayPools].sort((a, b) => (b.apy || 0) - (a.apy || 0));

  if (loading) {
    return (
      <div className={cn("rounded-lg border border-border bg-card overflow-hidden", className)}>
        <table className="data-table">
          <thead>
            <tr className="bg-muted/30">
              <th className="w-12">#</th>
              <th>Pool</th>
              <th>Project</th>
              <th className="text-right">TVL</th>
              <th className="text-right">APY</th>
            </tr>
          </thead>
          <tbody>
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <tr key={i}>
                  <td><div className="skeleton h-4 w-6" /></td>
                  <td><div className="skeleton h-4 w-32" /></td>
                  <td><div className="skeleton h-4 w-24" /></td>
                  <td><div className="skeleton h-4 w-24 ml-auto" /></td>
                  <td><div className="skeleton h-4 w-16 ml-auto" /></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (sortedPools.length === 0) {
    return (
      <div className={cn("rounded-lg border border-border bg-card p-8 text-center", className)}>
        <Droplets className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No yield pools found for XLayer</p>
        <p className="text-sm text-muted-foreground mt-2">
          Yield farming opportunities coming soon!
        </p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border border-border bg-card overflow-hidden", className)}>
      <table className="data-table">
        <thead>
          <tr className="bg-muted/30">
            <th className="w-12">#</th>
            <th>Pool</th>
            <th>Project</th>
            <th className="text-right">TVL</th>
            <th className="text-right">APY</th>
          </tr>
        </thead>
        <tbody>
          {sortedPools.map((pool, index) => {
            const totalApy = (pool.apyBase || 0) + (pool.apyReward || 0);
            
            return (
              <tr key={pool.pool} className="group">
                <td className="text-muted-foreground font-mono text-sm">
                  {index + 1}
                </td>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <Droplets className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-medium text-foreground">
                        {pool.symbol}
                      </span>
                      {pool.poolMeta && (
                        <p className="text-xs text-muted-foreground">
                          {pool.poolMeta}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground capitalize">
                    {pool.project}
                  </span>
                </td>
                <td className="text-right font-mono font-medium text-foreground">
                  {formatCurrency(pool.tvlUsd)}
                </td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-1 text-success font-mono font-medium">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {totalApy.toFixed(2)}%
                  </div>
                  {pool.apyBase !== undefined && pool.apyReward !== undefined && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Base: {pool.apyBase.toFixed(2)}% + Reward: {pool.apyReward.toFixed(2)}%
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
