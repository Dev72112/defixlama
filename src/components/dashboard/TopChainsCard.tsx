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
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-32" delay={0} />
          <Skeleton className="h-8 w-16" delay={1} />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full" delay={i} />
                <Skeleton className="h-4 w-20" delay={i} />
              </div>
              <Skeleton className="h-4 w-24" delay={i} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalTVL = chains.reduce((acc, c) => acc + (c.tvl || 0), 0);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          {t("dashboard.top10Chains", "Top 10 Chains")}
        </h3>
        <Link to="/chains">
          <Button variant="ghost" size="sm" className="text-primary text-xs">
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
              className={`flex items-center justify-between text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors group ${
                isXLayer ? "bg-primary/5 border border-primary/20" : ""
              }`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center gap-2">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  isXLayer ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                }`}>
                  {i + 1}
                </div>
                <span className={`font-medium truncate max-w-[100px] ${
                  isXLayer ? "text-primary" : "text-foreground"
                }`}>
                  {chain.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono font-medium text-foreground">
                  {formatCurrency(chain.tvl)}
                </span>
                <span className="text-xs text-muted-foreground w-12 text-right">
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