import { useMemo } from "react";
import { formatCurrency } from "@/lib/api/defillama";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface RevenueBreakdownProps {
  fees: { name?: string; displayName?: string; total24h?: number; total7d?: number; change_1d?: number }[];
  loading?: boolean;
}

export function RevenueBreakdown({ fees, loading }: RevenueBreakdownProps) {
  const stats = useMemo(() => {
    if (!fees || fees.length === 0) {
      return {
        total24h: 0,
        total7d: 0,
        avgFee: 0,
        topEarner: null as { name: string; fees: number } | null,
        gainers: 0,
        losers: 0,
      };
    }

    const total24h = fees.reduce((acc, f) => acc + (f.total24h || 0), 0);
    const total7d = fees.reduce((acc, f) => acc + (f.total7d || 0), 0);
    const avgFee = fees.length > 0 ? total24h / fees.length : 0;
    
    const sorted = [...fees].sort((a, b) => (b.total24h || 0) - (a.total24h || 0));
    const topEarner = sorted[0] ? { name: sorted[0].displayName || sorted[0].name || "Unknown", fees: sorted[0].total24h || 0 } : null;
    
    const gainers = fees.filter((f) => (f.change_1d || 0) > 0).length;
    const losers = fees.filter((f) => (f.change_1d || 0) < 0).length;

    return { total24h, total7d, avgFee, topEarner, gainers, losers };
  }, [fees]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="skeleton h-5 w-40 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="font-semibold text-foreground mb-4">Revenue Analysis</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
        <div className="rounded-lg bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground mb-1">Total 24h Fees</p>
          <p className="text-xl font-bold text-foreground">{formatCurrency(stats.total24h)}</p>
        </div>
        <div className="rounded-lg bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground mb-1">Total 7d Fees</p>
          <p className="text-xl font-bold text-foreground">{formatCurrency(stats.total7d)}</p>
        </div>
        <div className="rounded-lg bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground mb-1">Top Earner</p>
          {stats.topEarner ? (
            <>
              <p className="font-medium text-foreground truncate">{stats.topEarner.name}</p>
              <p className="text-sm text-primary">{formatCurrency(stats.topEarner.fees)}</p>
            </>
          ) : (
            <p className="text-muted-foreground">-</p>
          )}
        </div>
        <div className="rounded-lg bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground mb-1">24h Change</p>
          <div className="flex items-center gap-3 mt-1">
            <span className={cn("flex items-center gap-1 text-success text-sm")}>
              <TrendingUp className="h-3 w-3" />
              {stats.gainers}
            </span>
            <span className={cn("flex items-center gap-1 text-destructive text-sm")}>
              <TrendingDown className="h-3 w-3" />
              {stats.losers}
            </span>
            <span className={cn("flex items-center gap-1 text-muted-foreground text-sm")}>
              <Minus className="h-3 w-3" />
              {fees.length - stats.gainers - stats.losers}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
