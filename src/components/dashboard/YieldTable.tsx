import { YieldPool, formatCurrency } from "@/lib/api/defillama";
import { TrendingUp, Droplets } from "lucide-react";
import { ResponsiveDataTable, ResponsiveColumn } from "@/components/ui/responsive-table";

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
  const sortedPools = [...displayPools].sort((a, b) => (b.apy || 0) - (a.apy || 0));

  const columns: ResponsiveColumn<YieldPool>[] = [
    {
      key: "rank",
      label: "#",
      priority: "desktop",
      className: "w-12",
      render: (_p, index) => (
        <span className="text-muted-foreground font-mono text-sm">{index + 1}</span>
      ),
    },
    {
      key: "pool",
      label: "Pool",
      priority: "always",
      render: (pool) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
            <Droplets className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="font-medium text-foreground truncate max-w-[120px] sm:max-w-none block">
              {pool.symbol}
            </span>
            {pool.poolMeta && (
              <p className="text-xs text-muted-foreground">{pool.poolMeta}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "project",
      label: "Project",
      priority: "expanded",
      render: (pool) => (
        <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground capitalize">
          {pool.project}
        </span>
      ),
    },
    {
      key: "tvlUsd",
      label: "TVL",
      priority: "expanded",
      align: "right",
      render: (pool) => (
        <span className="font-mono font-medium text-foreground">{formatCurrency(pool.tvlUsd)}</span>
      ),
    },
    {
      key: "apy",
      label: "APY",
      priority: "always",
      align: "right",
      render: (pool) => {
        const totalApy = (pool.apyBase || 0) + (pool.apyReward || 0);
        return (
          <div>
            <div className="flex items-center justify-end gap-1 text-success font-mono font-medium">
              <TrendingUp className="h-3.5 w-3.5" />
              {typeof totalApy === 'number' && !isNaN(totalApy) ? totalApy.toFixed(2) : '0.00'}%
            </div>
            {typeof pool.apyBase === 'number' && typeof pool.apyReward === 'number' && (
              <div className="text-xs text-muted-foreground mt-0.5">
                Base: {pool.apyBase.toFixed(2)}% + Reward: {pool.apyReward.toFixed(2)}%
              </div>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <ResponsiveDataTable
      columns={columns}
      data={sortedPools}
      keyField={(pool) => pool.pool}
      loading={loading}
      loadingRows={5}
      emptyMessage="No yield pools found"
      emptyIcon={<Droplets className="h-12 w-12 text-muted-foreground" />}
      className={className}
    />
  );
}
