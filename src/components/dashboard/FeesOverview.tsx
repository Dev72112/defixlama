import { useTranslation } from "react-i18next";
import { Receipt, ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/lib/api/defillama";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface FeesOverviewProps {
  feesData: any[];
  loading?: boolean;
}

export function FeesOverview({ feesData, loading }: FeesOverviewProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
          <Skeleton className="h-4 sm:h-5 w-24 sm:w-32" delay={0} />
          <Skeleton className="h-7 sm:h-8 w-14 sm:w-16" delay={1} />
        </div>
        <Skeleton className="h-6 sm:h-8 w-20 sm:w-28 mb-1" delay={2} />
        <Skeleton className="h-3 w-16 sm:w-20 mb-3 sm:mb-4" delay={3} />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" delay={i + 4} />
              <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" delay={i + 4} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalFees24h = feesData?.reduce((acc, f) =>
    acc + (f?.total24h || f?.total_24h || 0), 0) || 0;

  const topFees = [...(feesData || [])]
    .sort((a, b) => (b?.total24h || b?.total_24h || 0) - (a?.total24h || a?.total_24h || 0))
    .slice(0, 5);

  return (
    <div className="rounded-lg border border-border bg-card p-3 sm:p-4">
      <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
        <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-1 sm:gap-2 min-w-0">
          <Receipt className="h-4 sm:h-5 w-4 sm:w-5 text-primary flex-shrink-0" />
          <span className="truncate">{t("dashboard.fees24h")}</span>
        </h3>
        <Link to="/fees">
          <Button variant="ghost" size="sm" className="text-primary text-xs flex-shrink-0">
            {t("common.viewAll", "View All")} →
          </Button>
        </Link>
      </div>
      <div className="mb-3 sm:mb-4">
        <div className="text-lg sm:text-2xl font-bold text-foreground">
          {formatCurrency(totalFees24h)}
        </div>
        <div className="text-xs text-muted-foreground">Total 24h fees</div>
      </div>
      <div className="space-y-2">
        {topFees.map((fee: any, i: number) => (
          <Link
            key={fee?.name || i}
            to={`/fees/${(fee?.displayName || fee?.name || '').toLowerCase().replace(/\s+/g, '-')}`}
            className="flex items-center justify-between text-xs sm:text-sm p-1.5 rounded hover:bg-muted/50 transition-colors gap-2"
          >
            <span className="text-muted-foreground truncate font-medium">
              {fee?.displayName || fee?.name || "—"}
            </span>
            <span className="font-medium font-mono text-foreground whitespace-nowrap text-xs sm:text-sm">
              {formatCurrency(fee?.total24h || fee?.total_24h || 0)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
