import { useTranslation } from "react-i18next";
import { Receipt, ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/lib/api/defillama";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface FeesOverviewProps {
  feesData: any[];
  loading?: boolean;
}

export function FeesOverview({ feesData, loading }: FeesOverviewProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="skeleton h-5 w-32 mb-4" />
        <div className="skeleton h-10 w-full mb-4" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-4 w-20" />
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
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          {t("dashboard.fees24h")}
        </h3>
        <Link to="/fees">
          <Button variant="ghost" size="sm" className="text-primary">
            {t("dashboard.viewAll")} <ArrowUpRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </div>
      <div className="mb-4">
        <div className="text-2xl font-bold text-foreground">
          {formatCurrency(totalFees24h)}
        </div>
        <div className="text-xs text-muted-foreground">Total 24h fees</div>
      </div>
      <div className="space-y-2">
        {topFees.map((fee: any, i: number) => (
          <div key={fee?.name || i} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground truncate max-w-[120px]">
              {fee?.displayName || fee?.name || "—"}
            </span>
            <span className="font-medium text-foreground">
              {formatCurrency(fee?.total24h || fee?.total_24h || 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
