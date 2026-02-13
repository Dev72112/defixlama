import { useMemo } from "react";
import { formatCurrency } from "@/lib/api/defillama";
import { cn } from "@/lib/utils";

interface Protocol {
  name: string;
  tvl?: number;
  change_1h?: number | null;
  change_1d?: number | null;
  change_7d?: number | null;
  category?: string;
  logo?: string;
}

interface Props {
  protocols: Protocol[];
  loading?: boolean;
}

function getHeatColor(val: number | null | undefined): string {
  if (val === null || val === undefined) return "bg-muted/30 text-muted-foreground";
  if (val >= 15) return "bg-emerald-500/30 text-emerald-300";
  if (val >= 5) return "bg-emerald-500/20 text-emerald-400";
  if (val >= 1) return "bg-emerald-500/10 text-emerald-400/80";
  if (val > -1) return "bg-muted/20 text-muted-foreground";
  if (val > -5) return "bg-red-500/10 text-red-400/80";
  if (val > -15) return "bg-red-500/20 text-red-400";
  return "bg-red-500/30 text-red-300";
}

function fmt(val: number | null | undefined): string {
  if (val === null || val === undefined) return "—";
  return `${val >= 0 ? "+" : ""}${val.toFixed(1)}%`;
}

export function AccumulationHeatmap({ protocols, loading }: Props) {
  const top20 = useMemo(() => {
    return [...protocols]
      .filter((p) => p.tvl && p.tvl > 0)
      .sort((a, b) => (b.tvl || 0) - (a.tvl || 0))
      .slice(0, 20);
  }, [protocols]);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-base font-semibold text-foreground mb-1">Accumulation vs Distribution Heatmap</h3>
      <p className="text-xs text-muted-foreground mb-3">TVL changes across timeframes — green = accumulation, red = distribution</p>
      {loading ? (
        <div className="skeleton h-[320px] w-full rounded-lg" />
      ) : top20.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 text-sm">No protocol data</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-left font-medium py-1.5 pr-2 min-w-[100px]">Protocol</th>
                <th className="text-center font-medium py-1.5 px-1 w-[72px]">1h</th>
                <th className="text-center font-medium py-1.5 px-1 w-[72px]">24h</th>
                <th className="text-center font-medium py-1.5 px-1 w-[72px]">7d</th>
                <th className="text-right font-medium py-1.5 pl-2 min-w-[80px]">TVL</th>
              </tr>
            </thead>
            <tbody>
              {top20.map((p) => (
                <tr key={p.name} className="border-t border-border/30">
                  <td className="py-1.5 pr-2 font-medium text-foreground truncate max-w-[120px]">{p.name}</td>
                  <td className="py-1 px-1">
                    <div className={cn("text-center rounded px-1 py-0.5 font-mono text-[10px]", getHeatColor(p.change_1h))}>
                      {fmt(p.change_1h)}
                    </div>
                  </td>
                  <td className="py-1 px-1">
                    <div className={cn("text-center rounded px-1 py-0.5 font-mono text-[10px]", getHeatColor(p.change_1d))}>
                      {fmt(p.change_1d)}
                    </div>
                  </td>
                  <td className="py-1 px-1">
                    <div className={cn("text-center rounded px-1 py-0.5 font-mono text-[10px]", getHeatColor(p.change_7d))}>
                      {fmt(p.change_7d)}
                    </div>
                  </td>
                  <td className="py-1.5 pl-2 text-right text-muted-foreground font-mono">{formatCurrency(p.tvl)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground justify-end">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-red-500/30" /> Heavy Distribution</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-muted/20" /> Neutral</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-emerald-500/30" /> Heavy Accumulation</span>
      </div>
    </div>
  );
}
