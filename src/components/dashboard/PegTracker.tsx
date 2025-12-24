import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";

interface PegTrackerProps {
  stablecoins: any[];
  loading?: boolean;
}

export function PegTracker({ stablecoins, loading }: PegTrackerProps) {
  const pegData = useMemo(() => {
    if (!stablecoins || stablecoins.length === 0) return [];

    return stablecoins
      .filter((s) => s.price !== undefined && s.price !== null)
      .slice(0, 8)
      .map((s) => {
        const deviation = Math.abs(1 - (s.price || 1)) * 100;
        let status: "stable" | "warning" | "depegged";
        if (deviation < 0.1) status = "stable";
        else if (deviation < 1) status = "warning";
        else status = "depegged";

        return {
          symbol: s.symbol,
          name: s.name,
          price: s.price || 1,
          deviation,
          status,
        };
      })
      .sort((a, b) => b.deviation - a.deviation);
  }, [stablecoins]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="skeleton h-5 w-32 mb-4" />
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="skeleton h-12 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (pegData.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="font-semibold text-foreground mb-4">Peg Tracker</h3>
        <p className="text-sm text-muted-foreground">No stablecoin data available</p>
      </div>
    );
  }

  const stableCount = pegData.filter((s) => s.status === "stable").length;
  const warningCount = pegData.filter((s) => s.status === "warning").length;
  const depeggedCount = pegData.filter((s) => s.status === "depegged").length;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Peg Tracker</h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-success">
            <CheckCircle className="h-3 w-3" />
            {stableCount}
          </span>
          <span className="flex items-center gap-1 text-warning">
            <AlertCircle className="h-3 w-3" />
            {warningCount}
          </span>
          <span className="flex items-center gap-1 text-destructive">
            <AlertTriangle className="h-3 w-3" />
            {depeggedCount}
          </span>
        </div>
      </div>
      
      <div className="space-y-2">
        {pegData.map((coin) => (
          <div
            key={coin.symbol}
            className={cn(
              "flex items-center justify-between p-2.5 rounded-lg border",
              coin.status === "stable" && "border-success/20 bg-success/5",
              coin.status === "warning" && "border-warning/20 bg-warning/5",
              coin.status === "depegged" && "border-destructive/20 bg-destructive/5"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                {coin.symbol.slice(0, 2)}
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">{coin.symbol}</p>
                <p className="text-xs text-muted-foreground">{coin.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono font-medium text-sm">${coin.price.toFixed(4)}</p>
              <p
                className={cn(
                  "text-xs",
                  coin.status === "stable" && "text-success",
                  coin.status === "warning" && "text-warning",
                  coin.status === "depegged" && "text-destructive"
                )}
              >
                {coin.deviation < 0.01 ? "On Peg" : `${coin.deviation.toFixed(2)}% off`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
