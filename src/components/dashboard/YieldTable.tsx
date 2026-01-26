import { YieldPool, formatCurrency } from "@/lib/api/defillama";
import { cn } from "@/lib/utils";
import { TrendingUp, Droplets } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface YieldTableProps {
  pools: YieldPool[];
  loading?: boolean;
  limit?: number;
  className?: string;
}

// Mobile card component for Yield Pool
function YieldMobileCard({ 
  pool, 
  index 
}: { 
  pool: YieldPool; 
  index: number;
}) {
  const totalApy = (pool.apyBase || 0) + (pool.apyReward || 0);
  
  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-sm">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
            <Droplets className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs font-mono">#{index + 1}</span>
              <span className="font-medium text-foreground truncate">
                {pool.symbol}
              </span>
            </div>
            <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground capitalize">
              {pool.project}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-success font-mono font-bold text-lg">
          <TrendingUp className="h-4 w-4" />
          {typeof totalApy === 'number' && !isNaN(totalApy) ? totalApy.toFixed(2) : '0.00'}%
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">TVL</span>
          <span className="text-sm font-mono font-medium">
            {formatCurrency(pool.tvlUsd)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Base APY</span>
          <span className="text-sm font-mono text-muted-foreground">
            {typeof pool.apyBase === 'number' ? pool.apyBase.toFixed(2) : '0.00'}%
          </span>
        </div>
        {typeof pool.apyReward === 'number' && pool.apyReward > 0 && (
          <div className="flex justify-between items-center col-span-2">
            <span className="text-xs text-muted-foreground">Reward APY</span>
            <span className="text-sm font-mono text-success">
              +{pool.apyReward.toFixed(2)}%
            </span>
          </div>
        )}
        {pool.poolMeta && (
          <div className="col-span-2 mt-1">
            <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
              {pool.poolMeta}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Mobile loading skeleton
function MobileCardSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      {Array(count).fill(0).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-4 animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="skeleton h-10 w-10 rounded-full" />
            <div className="flex-1">
              <div className="skeleton h-4 w-24 mb-2" />
              <div className="skeleton h-3 w-16" />
            </div>
            <div className="skeleton h-6 w-16" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function YieldTable({
  pools,
  loading = false,
  limit,
  className,
}: YieldTableProps) {
  const displayPools = limit ? pools.slice(0, limit) : pools;
  const isMobile = useIsMobile();

  // Sort by APY
  const sortedPools = [...displayPools].sort((a, b) => (b.apy || 0) - (a.apy || 0));

  // Mobile view
  if (isMobile) {
    if (loading) {
      return <MobileCardSkeleton count={5} />;
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
      <div className={cn("space-y-3", className)}>
        {sortedPools.map((pool, index) => (
          <YieldMobileCard 
            key={pool.pool} 
            pool={pool} 
            index={index}
          />
        ))}
      </div>
    );
  }

  // Desktop view - Original table
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
