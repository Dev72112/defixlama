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
        <table className="data-table w-full">
          <thead>
            <tr className="bg-muted/30">
              <th className="w-12 hidden sm:table-cell">#</th>
              <th>Pool</th>
              <th className="hidden sm:table-cell">Project</th>
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
        <p className="text-muted-foreground">No yield pools found</p>
        <p className="text-sm text-muted-foreground mt-2">
          No yield data available for this chain
        </p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border border-border bg-card overflow-hidden", className)}>
      <table className="data-table w-full">
        <thead>
          <tr className="bg-muted/30">
            <th className="w-12 hidden sm:table-cell">#</th>
            <th>Pool</th>
            <th className="hidden md:table-cell">Project</th>
            <th className="text-right hidden sm:table-cell">TVL</th>
            <th className="text-right">APY</th>
          </tr>
        </thead>
        <tbody>
          {sortedPools.map((pool, index) => {
            const totalApy = (pool.apyBase || 0) + (pool.apyReward || 0);
            
            return (
              <tr key={pool.pool} className="group">
                <td className="text-muted-foreground font-mono text-sm hidden sm:table-cell">
                  {index + 1}
                </td>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <Droplets className="h-4 w-4" />
                    </div>
                    <div>
                    <span className="font-medium text-foreground truncate max-w-[120px] sm:max-w-none block">
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
                <td className="hidden md:table-cell">
                  <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground capitalize">
                    {pool.project}
                  </span>
                </td>
                <td className="text-right font-mono font-medium text-foreground hidden sm:table-cell">
                  {formatCurrency(pool.tvlUsd)}
                </td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-1 text-success font-mono font-medium">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {typeof totalApy === 'number' && !isNaN(totalApy) ? totalApy.toFixed(2) : '0.00'}%
                  </div>
                  {typeof pool.apyBase === 'number' && typeof pool.apyReward === 'number' && (
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
