import { DexVolume, formatCurrency, formatPercentage, getChangeColor } from "@/lib/api/defillama";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { ExternalLink, TrendingUp, TrendingDown, ArrowLeftRight } from "lucide-react";
import { WatchlistButton } from "@/components/WatchlistButton";

interface DexTableProps {
  dexes: DexVolume[];
  loading?: boolean;
  limit?: number;
  className?: string;
}

export function DexTable({
  dexes,
  loading = false,
  limit,
  className,
}: DexTableProps) {
  const displayDexes = limit ? dexes.slice(0, limit) : dexes;
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className={cn("rounded-lg border border-border bg-card overflow-hidden", className)}>
        {/* Mobile loading skeleton */}
        <div className="sm:hidden divide-y divide-border">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="skeleton h-8 w-8 rounded-full flex-shrink-0" />
                <div className="space-y-1.5">
                  <div className="skeleton h-3.5 w-24" />
                  <div className="skeleton h-3 w-16" />
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <div className="skeleton h-3.5 w-20" />
                <div className="skeleton h-3 w-14" />
              </div>
            </div>
          ))}
        </div>
        {/* Desktop loading skeleton */}
        <table className="data-table w-full hidden sm:table">
          <thead>
            <tr className="bg-muted/30">
              <th className="w-12">#</th>
              <th>Name</th>
              <th className="text-right">24h Volume</th>
              <th className="text-right">7d Volume</th>
              <th className="text-right">24h Change</th>
            </tr>
          </thead>
          <tbody>
            {Array(5).fill(0).map((_, i) => (
              <tr key={i}>
                <td><div className="skeleton h-4 w-6" /></td>
                <td><div className="skeleton h-4 w-32" /></td>
                <td><div className="skeleton h-4 w-24 ml-auto" /></td>
                <td><div className="skeleton h-4 w-24 ml-auto" /></td>
                <td><div className="skeleton h-4 w-16 ml-auto" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (displayDexes.length === 0) {
    return (
      <div className={cn("rounded-lg border border-border bg-card p-8 text-center", className)}>
        <ArrowLeftRight className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No DEX data available</p>
        <p className="text-sm text-muted-foreground mt-2">
          No DEX volume data available for this chain
        </p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border border-border bg-card overflow-hidden", className)}>

      {/* ── MOBILE CARD LIST (hidden on sm+) ── */}
      <div className="sm:hidden divide-y divide-border">
        {displayDexes.map((dex, index) => {
          const slug = (dex.displayName || dex.name).toLowerCase().replace(/\s+/g, '-');
          const changeColor = getChangeColor(dex.change_1d);
          const isPositive = dex.change_1d !== undefined && dex.change_1d >= 0;

          return (
            <div
              key={dex.name}
              className="flex items-center justify-between gap-3 px-3 py-2.5 active:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => navigate(`/dexs/${slug}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/dexs/${slug}`); }}
            >
              {/* Left — logo + name + chains */}
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-[10px] text-muted-foreground font-mono w-4 flex-shrink-0 text-center">
                  {index + 1}
                </span>
                {dex.logo ? (
                  <img
                    src={dex.logo}
                    alt={dex.displayName || dex.name}
                    className="h-8 w-8 rounded-full bg-muted flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${dex.name}&background=1a1a2e&color=2dd4bf&size=32`;
                    }}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                    {(dex.displayName || dex.name).charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground truncate leading-tight">
                    {dex.displayName || dex.name}
                  </p>
                  {dex.chains && dex.chains.length > 0 && (
                    <p className="text-[11px] text-muted-foreground truncate leading-tight">
                      {dex.chains.slice(0, 2).join(", ")}
                      {dex.chains.length > 2 && ` +${dex.chains.length - 2}`}
                    </p>
                  )}
                </div>
              </div>

              {/* Right — volume + change stacked */}
              <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                <span className="font-mono text-sm font-medium text-foreground">
                  {dex.total24h && dex.total24h > 0
                    ? formatCurrency(dex.total24h)
                    : <span className="text-muted-foreground italic text-xs">No data</span>
                  }
                </span>
                <span className={cn("inline-flex items-center gap-0.5 font-mono text-[11px]", changeColor)}>
                  {isPositive
                    ? <TrendingUp className="h-3 w-3" />
                    : <TrendingDown className="h-3 w-3" />
                  }
                  {formatPercentage(dex.change_1d)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── DESKTOP TABLE (hidden below sm) ── */}
      <table className="data-table w-full hidden sm:table">
        <thead>
          <tr className="sticky top-0 bg-card z-20 backdrop-blur-sm bg-muted/30 border-b border-border">
            <th className="w-10"></th>
            <th className="w-12">#</th>
            <th>Name</th>
            <th className="text-right">24h Volume</th>
            <th className="text-right">7d Volume</th>
            <th className="text-right">24h Change</th>
          </tr>
        </thead>
        <tbody>
          {displayDexes.map((dex, index) => {
            const slug = (dex.displayName || dex.name).toLowerCase().replace(/\s+/g, '-');
            return (
              <tr
                key={dex.name}
                className="group cursor-pointer"
                onClick={() => navigate(`/dexs/${slug}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/dexs/${slug}`); }}
              >
                <td onClick={(e) => e.stopPropagation()}>
                  <WatchlistButton
                    item={{
                      id: slug,
                      symbol: (dex.displayName || dex.name).slice(0, 4).toUpperCase(),
                      name: dex.displayName || dex.name,
                      type: "dex",
                    }}
                  />
                </td>
                <td className="text-muted-foreground font-mono text-sm">
                  {index + 1}
                </td>
                <td>
                  <div className="flex items-center gap-3">
                    {dex.logo ? (
                      <img
                        src={dex.logo}
                        alt={dex.displayName || dex.name}
                        className="h-8 w-8 rounded-full bg-muted flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${dex.name}&background=1a1a2e&color=2dd4bf&size=32`;
                        }}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                        {(dex.displayName || dex.name).charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="font-medium text-foreground truncate block">
                        {dex.displayName || dex.name}
                      </span>
                      {dex.chains && dex.chains.length > 0 && (
                        <p className="text-xs text-muted-foreground truncate">
                          {dex.chains.slice(0, 3).join(", ")}
                          {dex.chains.length > 3 && ` +${dex.chains.length - 3}`}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="text-right font-mono font-medium text-foreground whitespace-nowrap">
                  {dex.total24h && dex.total24h > 0
                    ? formatCurrency(dex.total24h)
                    : <span className="text-muted-foreground italic">No data</span>
                  }
                </td>
                <td className="text-right font-mono text-muted-foreground whitespace-nowrap">
                  {dex.total7d && dex.total7d > 0
                    ? formatCurrency(dex.total7d)
                    : <span className="text-muted-foreground italic">No data</span>
                  }
                </td>
                <td className="text-right whitespace-nowrap">
                  <div className={cn("inline-flex items-center gap-1 font-mono text-sm", getChangeColor(dex.change_1d))}>
                    {dex.change_1d !== undefined && dex.change_1d >= 0
                      ? <TrendingUp className="h-3.5 w-3.5" />
                      : <TrendingDown className="h-3.5 w-3.5" />
                    }
                    {formatPercentage(dex.change_1d)}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

    </div>
  );
        }
