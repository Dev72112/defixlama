import { useTranslation } from "react-i18next";
import { Globe, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/api/defillama";
import { ChainData } from "@/lib/api/defillama";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface TopChainsCardProps {
  chains: ChainData[];
  loading?: boolean;
}

export function TopChainsCard({ chains, loading }: TopChainsCardProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <Skeleton className="h-4 sm:h-5 w-24 sm:w-32" delay={0} />
          <Skeleton className="h-7 sm:h-8 w-14 sm:w-16" delay={1} />
        </div>
        <div className="space-y-2 sm:space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 sm:h-6 w-5 sm:w-6 rounded-full" delay={i} />
                <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" delay={i} />
              </div>
              <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" delay={i} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalTVL = chains.reduce((acc, c) => acc + (c.tvl || 0), 0);

  return (
    <div className="rounded-lg border border-border bg-card p-3 sm:p-4">
      <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
        <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-1 sm:gap-2 min-w-0">
          <Globe className="h-4 sm:h-5 w-4 sm:w-5 text-primary flex-shrink-0" />
          <span className="truncate">{t("dashboard.top10Chains", "Top 10 Chains")}</span>
        </h3>
        <Link to="/chains">
          <Button variant="ghost" size="sm" className="text-primary text-xs flex-shrink-0">
            {t("common.viewAll", "View All")} →
          </Button>
        </Link>
      </div>
      <div className="space-y-2">
        {chains.slice(0, 10).map((chain, i) => {
          const share = totalTVL > 0 ? (chain.tvl / totalTVL) * 100 : 0;
          const isXLayer = chain.name.toLowerCase() === "xlayer" || chain.name.toLowerCase() === "x layer";

          return (
            <Link
              key={chain.name}
              to={`/chains/${chain.name.toLowerCase().replace(/\s+/g, '-')}`}
              className={`flex items-center justify-between text-xs sm:text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors group ${
                isXLayer ? "bg-primary/5 border border-primary/20" : ""
              }`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <div className={`h-5 sm:h-6 w-5 sm:w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  isXLayer ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                }`}>
                  {i + 1}
                </div>
                <span className={`font-medium truncate ${
                  isXLayer ? "text-primary" : "text-foreground"
                }`}>
                  {chain.name}
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
                <span className="font-mono font-medium text-foreground text-xs sm:text-sm whitespace-nowrap">
                  {formatCurrency(chain.tvl)}
                </span>
                <span className="text-xs text-muted-foreground w-10 sm:w-12 text-right">
                  {share.toFixed(1)}%
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}