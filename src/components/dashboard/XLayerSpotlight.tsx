import { useXLayerProtocols, useXLayerTVL, useXLayerDexVolumes } from "@/hooks/useDefiData";
import { formatCurrency } from "@/lib/api/defillama";
import { ChevronDown, ChevronUp, Star, Layers, ArrowLeftRight, Database } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export function XLayerSpotlight() {
  const [expanded, setExpanded] = useState(true);
  const tvl = useXLayerTVL();
  const protocols = useXLayerProtocols();
  const dexVolumes = useXLayerDexVolumes();

  const totalTVL = tvl?.data?.tvl ?? 0;
  const protocolCount = protocols?.data?.length ?? 0;
  const totalDexVolume = dexVolumes?.data?.reduce((acc, d) => acc + (d?.total24h ?? 0), 0) ?? 0;
  const topProtocols = (protocols?.data ?? [])
    .sort((a, b) => (b.tvl ?? 0) - (a.tvl ?? 0))
    .slice(0, 3);

  const isLoading = tvl?.isLoading || protocols?.isLoading;

  return (
    <div className="rounded-lg border bg-card overflow-hidden"
      style={{ borderColor: "hsl(348 83% 47% / 0.3)" }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4" style={{ color: "hsl(348 83% 55%)" }} />
          <span className="font-semibold text-sm text-foreground">X Layer</span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{
              background: "hsl(348 83% 47% / 0.15)",
              color: "hsl(348 83% 60%)",
              border: "1px solid hsl(348 83% 47% / 0.3)",
            }}
          >
            Featured
          </span>
        </div>
        <div className="flex items-center gap-3">
          {!expanded && !isLoading && (
            <span className="text-xs text-muted-foreground tabular-nums">{formatCurrency(totalTVL)} TVL</span>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Metrics */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "TVL", value: formatCurrency(totalTVL), icon: Layers, loading: tvl?.isLoading },
              { label: "24h Volume", value: formatCurrency(totalDexVolume), icon: ArrowLeftRight, loading: dexVolumes?.isLoading },
              { label: "Protocols", value: String(protocolCount), icon: Database, loading: protocols?.isLoading },
            ].map((metric) => (
              <div key={metric.label} className="rounded-lg bg-muted/30 p-2.5 text-center">
                {metric.loading ? (
                  <div className="space-y-1.5">
                    <div className="skeleton h-3 w-12 mx-auto" />
                    <div className="skeleton h-5 w-16 mx-auto" />
                  </div>
                ) : (
                  <>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{metric.label}</div>
                    <div className="text-sm font-bold text-foreground tabular-nums mt-0.5">{metric.value}</div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Top Protocols */}
          {topProtocols.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Top Protocols</div>
              <div className="space-y-1">
                {topProtocols.map((p) => (
                  <Link
                    key={p.slug || p.name}
                    to={`/protocols/${(p.slug || p.name || '').toLowerCase().replace(/\s+/g, '-')}`}
                    className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/30 transition-colors group"
                  >
                    <span className="text-xs text-foreground group-hover:text-primary transition-colors truncate">{p.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{formatCurrency(p.tvl ?? 0)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
