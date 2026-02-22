import { useTranslation } from "react-i18next";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/api/defillama";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface StablecoinStatsProps {
  stablecoins: any[];
  loading?: boolean;
}

export function StablecoinStats({ stablecoins, loading }: StablecoinStatsProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
          <Skeleton className="h-4 sm:h-5 w-32 sm:w-40" delay={0} />
          <Skeleton className="h-7 sm:h-8 w-14 sm:w-16" delay={1} />
        </div>
        <Skeleton className="h-6 sm:h-8 w-24 sm:w-32 mb-3 sm:mb-4" delay={2} />
        <div className="space-y-2 sm:space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-3 sm:h-4 w-14 sm:w-16" delay={i + 3} />
              <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" delay={i + 3} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Filter for XLayer-relevant stablecoins (same logic as Stablecoins page)
  const relevantStablecoins = stablecoins?.filter((s: any) => {
    return s.chains?.some(
      (c: string) => c.toLowerCase() === "xlayer" || c.toLowerCase() === "x layer"
    ) || ["USDT", "USDC", "DAI", "FRAX", "LUSD", "TUSD", "USDS", "USDe"].includes(s.symbol);
  }) || [];

  // Calculate total market cap using same method as Stablecoins page
  const totalMcap = relevantStablecoins.reduce((acc: number, s: any) => {
    // Use peggedUSD if available, otherwise sum all circulating values
    const circulating = s?.circulating?.peggedUSD
      || (s?.circulating ? Object.values(s.circulating).reduce((a: number, b: any) => a + (Number(b) || 0), 0) : 0);
    return acc + circulating;
  }, 0);

  const topStablecoins = relevantStablecoins.slice(0, 5);

  return (
    <div className="rounded-lg border border-border bg-card p-3 sm:p-4">
      <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
        <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-1 sm:gap-2 min-w-0">
          <DollarSign className="h-4 sm:h-5 w-4 sm:w-5 text-primary flex-shrink-0" />
          <span className="truncate">{t("dashboard.stablecoinMcap")}</span>
        </h3>
        <Link to="/stablecoins">
          <Button variant="ghost" size="sm" className="text-primary text-xs flex-shrink-0">
            {t("common.viewAll", "View All")} →
          </Button>
        </Link>
      </div>
      <div className="mb-3 sm:mb-4">
        <div className="text-lg sm:text-2xl font-bold text-foreground">
          {formatCurrency(totalMcap)}
        </div>
      </div>
      <div className="space-y-2">
        {topStablecoins.map((stable: any, i: number) => {
          const change = stable?.price ? (stable.price - 1) * 100 : 0;
          const isPositive = change >= 0;
          const circulating = stable?.circulating?.peggedUSD
            || (stable?.circulating ? Object.values(stable.circulating).reduce((a: number, b: any) => a + (Number(b) || 0), 0) : 0);

          return (
            <Link
              key={stable?.id || i}
              to={`/stablecoins/${(stable?.symbol || stable?.name || '').toLowerCase()}`}
              className="flex items-center justify-between text-xs sm:text-sm p-1.5 rounded hover:bg-muted/50 transition-colors gap-2"
            >
              <span className="text-muted-foreground truncate font-medium">
                {stable?.symbol || stable?.name || "—"}
              </span>
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <span className="font-medium font-mono text-foreground whitespace-nowrap text-xs sm:text-sm">
                  {formatCurrency(circulating)}
                </span>
                <span className={`flex items-center text-xs flex-shrink-0 ${isPositive ? "text-success" : "text-destructive"}`}>
                  {isPositive ? <TrendingUp className="h-2.5 sm:h-3 w-2.5 sm:w-3" /> : <TrendingDown className="h-2.5 sm:h-3 w-2.5 sm:w-3" />}
                  <span className="hidden sm:inline">{Math.abs(change).toFixed(2)}%</span>
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
