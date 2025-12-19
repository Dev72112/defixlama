import { DexVolume, formatCurrency, formatPercentage, getChangeColor } from "@/lib/api/defillama";
import { cn } from "@/lib/utils";
import { ExternalLink, TrendingUp, TrendingDown, ArrowLeftRight } from "lucide-react";

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

  if (loading) {
    return (
      <div className={cn("rounded-lg border border-border bg-card overflow-hidden", className)}>
        <table className="data-table">
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
            {Array(5)
              .fill(0)
              .map((_, i) => (
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
        <p className="text-muted-foreground">No DEX data available for XLayer</p>
        <p className="text-sm text-muted-foreground mt-2">
          Launch a DEX on XLayer to see it here!
        </p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border border-border bg-card overflow-hidden", className)}>
      <table className="data-table">
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
          {displayDexes.map((dex, index) => (
            <tr key={dex.name} className="group">
              <td className="text-muted-foreground font-mono text-sm">
                {index + 1}
              </td>
              <td>
                <div className="flex items-center gap-3">
                  {dex.logo ? (
                    <img
                      src={dex.logo}
                      alt={dex.displayName || dex.name}
                      className="h-8 w-8 rounded-full bg-muted"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${dex.name}&background=1a1a2e&color=2dd4bf&size=32`;
                      }}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                      {(dex.displayName || dex.name).charAt(0)}
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-foreground">
                      {dex.displayName || dex.name}
                    </span>
                    {dex.chains && dex.chains.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {dex.chains.slice(0, 3).join(", ")}
                        {dex.chains.length > 3 && ` +${dex.chains.length - 3}`}
                      </p>
                    )}
                  </div>
                </div>
              </td>
              <td className="text-right font-mono font-medium text-foreground">
                {formatCurrency(dex.total24h)}
              </td>
              <td className="text-right font-mono text-muted-foreground">
                {formatCurrency(dex.total7d)}
              </td>
              <td className="text-right">
                <div
                  className={cn(
                    "inline-flex items-center gap-1 font-mono text-sm",
                    getChangeColor(dex.change_1d)
                  )}
                >
                  {dex.change_1d !== undefined && dex.change_1d >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {formatPercentage(dex.change_1d)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
