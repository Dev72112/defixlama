import { useTranslation } from "react-i18next";
import { Activity, Zap, Clock, Users } from "lucide-react";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface NetworkStatsCardProps {
  loading?: boolean;
  protocols?: any[];
  dexVolumes?: any[];
}

export function NetworkStatsCard({ loading, protocols = [], dexVolumes = [] }: NetworkStatsCardProps) {
  const { t } = useTranslation();

  // Calculate live stats from actual data
  const stats = useMemo(() => {
    // Active protocols count
    const activeProtocols = protocols.filter(p => p && (p.tvl > 0 || p.change_1d !== undefined)).length;
    
    // Calculate total 24h volume from DEX data
    const total24hVolume = dexVolumes.reduce((acc, dex) => acc + (dex?.total24h || 0), 0);
    
    // Count protocols with positive growth
    const growingProtocols = protocols.filter(p => p && (p.change_1d || 0) > 0).length;
    
    // Count unique categories
    const categories = new Set(protocols.map(p => p?.category).filter(Boolean));
    
    return {
      activeProtocols,
      total24hVolume,
      growingProtocols,
      categoriesCount: categories.size,
    };
  }, [protocols, dexVolumes]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <Skeleton className="h-5 w-32 mb-4" delay={0} />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-20 mb-2" delay={i + 1} />
              <Skeleton className="h-6 w-16" delay={i + 1} />
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
            {t("dashboard.activeProtocols")}
          </div>
          <div className="text-lg font-bold text-foreground">
            {stats.activeProtocols.toLocaleString()}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" />
            {t("dashboard.categories")}
          </div>
          <div className="text-lg font-bold text-foreground">
            {stats.categoriesCount.toLocaleString()}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {t("dashboard.growingProtocols")}
          </div>
          <div className="text-lg font-bold text-success">
            {stats.growingProtocols}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Zap className="h-3 w-3" />
            {t("dashboard.dexVolume24h")}
          </div>
          <div className="text-lg font-bold text-foreground">
            ${stats.total24hVolume >= 1e9 
              ? `${(stats.total24hVolume / 1e9).toFixed(1)}B` 
              : stats.total24hVolume >= 1e6 
                ? `${(stats.total24hVolume / 1e6).toFixed(1)}M` 
                : stats.total24hVolume.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
