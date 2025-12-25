import { useTranslation } from "react-i18next";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/api/defillama";

interface StablecoinStatsProps {
  stablecoins: any[];
  loading?: boolean;
}

export function StablecoinStats({ stablecoins, loading }: StablecoinStatsProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="skeleton h-5 w-40 mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="skeleton h-4 w-20" />
              <div className="skeleton h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalMcap = stablecoins?.reduce((acc, s) => acc + (s?.circulating?.peggedUSD || 0), 0) || 0;
  const topStablecoins = stablecoins?.slice(0, 5) || [];

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-primary" />
        {t("dashboard.stablecoinMcap")}
      </h3>
      <div className="mb-4">
        <div className="text-2xl font-bold text-foreground">
          {formatCurrency(totalMcap)}
        </div>
      </div>
      <div className="space-y-2">
        {topStablecoins.map((stable: any, i: number) => {
          const change = stable?.price ? (stable.price - 1) * 100 : 0;
          const isPositive = change >= 0;
          return (
            <div key={stable?.id || i} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground truncate max-w-[100px]">
                {stable?.symbol || stable?.name || "—"}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {formatCurrency(stable?.circulating?.peggedUSD || 0)}
                </span>
                <span className={`flex items-center text-xs ${isPositive ? "text-success" : "text-destructive"}`}>
                  {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(change).toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
