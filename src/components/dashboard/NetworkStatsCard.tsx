import { useTranslation } from "react-i18next";
import { Activity, Zap, Clock, Users } from "lucide-react";

interface NetworkStatsCardProps {
  loading?: boolean;
}

export function NetworkStatsCard({ loading }: NetworkStatsCardProps) {
  const { t } = useTranslation();

  // Simulated network stats - in production, these would come from an API
  const stats = {
    transactions24h: 125847,
    activeAddresses: 8234,
    avgBlockTime: 2.1,
    gasPrice: 0.001,
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="skeleton h-5 w-32 mb-4" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="skeleton h-4 w-20 mb-2" />
              <div className="skeleton h-6 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        {t("dashboard.networkStats")}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Zap className="h-3 w-3" />
            {t("dashboard.transactions24h")}
          </div>
          <div className="text-lg font-bold text-foreground">
            {stats.transactions24h.toLocaleString()}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" />
            {t("dashboard.activeAddresses")}
          </div>
          <div className="text-lg font-bold text-foreground">
            {stats.activeAddresses.toLocaleString()}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {t("dashboard.avgBlockTime")}
          </div>
          <div className="text-lg font-bold text-foreground">
            {stats.avgBlockTime}s
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Zap className="h-3 w-3" />
            {t("dashboard.gasTracker")}
          </div>
          <div className="text-lg font-bold text-success">
            {stats.gasPrice} OKB
          </div>
        </div>
      </div>
    </div>
  );
}
