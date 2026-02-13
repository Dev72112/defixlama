import { useMemo } from "react";
import { formatCurrency } from "@/lib/api/defillama";
import { cn } from "@/lib/utils";

interface Protocol {
  category?: string;
  tvl?: number;
  change_1d?: number | null;
}

interface Props {
  protocols: Protocol[];
  loading?: boolean;
}

const TREEMAP_COLORS = [
  "from-emerald-500/20 to-emerald-600/10",
  "from-cyan-500/20 to-cyan-600/10",
  "from-amber-500/20 to-amber-600/10",
  "from-violet-500/20 to-violet-600/10",
  "from-rose-500/20 to-rose-600/10",
  "from-blue-500/20 to-blue-600/10",
  "from-orange-500/20 to-orange-600/10",
  "from-teal-500/20 to-teal-600/10",
  "from-pink-500/20 to-pink-600/10",
  "from-indigo-500/20 to-indigo-600/10",
];

export function CategoryTreemap({ protocols, loading }: Props) {
  const categories = useMemo(() => {
    const map = new Map<string, { tvl: number; count: number; change: number; changeCount: number }>();
    for (const p of protocols) {
      const cat = p.category || "Other";
      const existing = map.get(cat) || { tvl: 0, count: 0, change: 0, changeCount: 0 };
      existing.tvl += p.tvl || 0;
      existing.count += 1;
      if (p.change_1d !== null && p.change_1d !== undefined) {
        existing.change += p.change_1d;
        existing.changeCount += 1;
      }
      map.set(cat, existing);
    }
    const total = Array.from(map.values()).reduce((a, v) => a + v.tvl, 0);
    return Array.from(map.entries())
      .map(([name, data]) => ({
        name,
        tvl: data.tvl,
        count: data.count,
        avgChange: data.changeCount > 0 ? data.change / data.changeCount : 0,
        share: total > 0 ? (data.tvl / total) * 100 : 0,
      }))
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, 12);
  }, [protocols]);

  const totalTvl = categories.reduce((a, c) => a + c.tvl, 0);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-base font-semibold text-foreground mb-1">Category Capital Flow</h3>
      <p className="text-xs text-muted-foreground mb-3">TVL distribution by protocol category with 24h change direction</p>
      {loading ? (
        <div className="skeleton h-[240px] w-full rounded-lg" />
      ) : categories.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 text-sm">No data</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {categories.map((cat, i) => (
            <div
              key={cat.name}
              className={cn(
                "rounded-lg p-3 bg-gradient-to-br border border-border/30 transition-all hover:scale-[1.02]",
                TREEMAP_COLORS[i % TREEMAP_COLORS.length]
              )}
              style={{ minHeight: Math.max(60, Math.min(120, cat.share * 3)) }}
            >
              <div className="text-xs font-semibold text-foreground truncate">{cat.name}</div>
              <div className="text-sm font-bold text-foreground mt-0.5">{formatCurrency(cat.tvl)}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-muted-foreground">{cat.count} protocols</span>
                <span className={cn("text-[10px] font-mono", cat.avgChange >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {cat.avgChange >= 0 ? "+" : ""}{cat.avgChange.toFixed(1)}%
                </span>
              </div>
              <div className="text-[9px] text-muted-foreground mt-0.5">{cat.share.toFixed(1)}% share</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
