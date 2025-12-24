import { useMemo } from "react";
import { Activity, Shield, Zap, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface EcosystemHealthProps {
  protocols: any[];
  tvl: number;
  dexVolume: number;
  loading?: boolean;
}

export function EcosystemHealth({ protocols, tvl, dexVolume, loading }: EcosystemHealthProps) {
  const health = useMemo(() => {
    if (!protocols || protocols.length === 0) {
      return { score: 0, metrics: [] };
    }

    // Calculate various health metrics
    const protocolCount = protocols.length;
    const avgTVL = tvl / (protocolCount || 1);
    const volumeToTVLRatio = tvl > 0 ? (dexVolume / tvl) * 100 : 0;
    const categoriesCount = new Set(protocols.map((p) => p.category).filter(Boolean)).size;
    
    // Positive changes count
    const positiveChanges = protocols.filter((p) => (p.change_1d || 0) > 0).length;
    const positiveRatio = protocolCount > 0 ? (positiveChanges / protocolCount) * 100 : 0;

    // Calculate individual scores (0-100)
    const diversityScore = Math.min(100, categoriesCount * 15); // More categories = better
    const activityScore = Math.min(100, volumeToTVLRatio * 5); // Higher volume ratio = better
    const growthScore = positiveRatio; // Percentage of growing protocols
    const depthScore = Math.min(100, (protocolCount / 50) * 100); // Target 50+ protocols

    const overallScore = (diversityScore + activityScore + growthScore + depthScore) / 4;

    return {
      score: overallScore,
      metrics: [
        { label: "Diversity", value: diversityScore, icon: Shield },
        { label: "Activity", value: activityScore, icon: Activity },
        { label: "Growth", value: growthScore, icon: Zap },
        { label: "Depth", value: depthScore, icon: Users },
      ],
    };
  }, [protocols, tvl, dexVolume]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="skeleton h-5 w-36 mb-4" />
        <div className="skeleton h-12 w-20 mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const getHealthLabel = (score: number) => {
    if (score >= 75) return { label: "Excellent", color: "text-success" };
    if (score >= 50) return { label: "Good", color: "text-primary" };
    if (score >= 25) return { label: "Fair", color: "text-warning" };
    return { label: "Needs Growth", color: "text-destructive" };
  };

  const { label, color } = getHealthLabel(health.score);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="font-semibold text-foreground mb-3">Ecosystem Health</h3>
      <div className="flex items-end gap-2 mb-4">
        <span className={cn("text-3xl font-bold", color)}>{health.score.toFixed(0)}</span>
        <span className="text-sm text-muted-foreground mb-1">/ 100</span>
        <span className={cn("text-sm font-medium ml-2 mb-1", color)}>{label}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {health.metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-lg border border-border/50 bg-muted/30 p-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <metric.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{metric.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    metric.value >= 70 ? "bg-success" : metric.value >= 40 ? "bg-primary" : "bg-warning"
                  )}
                  style={{ width: `${metric.value}%` }}
                />
              </div>
              <span className="text-xs font-medium text-foreground w-8 text-right">
                {metric.value.toFixed(0)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
