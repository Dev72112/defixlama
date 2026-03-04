import { useMemo, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useChain } from "@/contexts/ChainContext";
import { useChainProtocols, useChainTVLHistory, useGlobalTVLHistory } from "@/hooks/useDefiData";
import { formatCurrency, formatPercentage, getChangeColor } from "@/lib/api/defillama";
import { ChartEmptyState } from "@/components/ChartEmptyState";
import { CHART_TOOLTIP_STYLE, CHART_COLORS, AXIS_TICK_STYLE } from "@/lib/chartStyles";
import { DateRangeSelector, DateRange, filterByDateRange } from "@/components/dashboard/DateRangeSelector";
import { Activity, GitCompare, AlertTriangle, TrendingUp, TrendingDown, BarChart3, History } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 15;

export default function Correlations() {
  const { selectedChain } = useChain();
  const chainId = selectedChain.id;
  const protocols = useChainProtocols(chainId);
  const chainTvlHistory = useChainTVLHistory(chainId === "all" ? null : selectedChain.slug);
  const globalTvlHistory = useGlobalTVLHistory();
  const tvlHistory = chainId === "all" ? globalTvlHistory.data : chainTvlHistory.data;
  const protocolList = protocols.data ?? [];
  const isLoading = protocols.isLoading;
  const [historyRange, setHistoryRange] = useState<DateRange>("30d");
  const [sectorPage, setSectorPage] = useState(1);

  const top15 = useMemo(() => {
    return [...protocolList]
      .filter((p) => p.tvl && p.tvl > 0 && (p.change_1d !== undefined || p.change_7d !== undefined))
      .sort((a, b) => (b.tvl || 0) - (a.tvl || 0))
      .slice(0, 15);
  }, [protocolList]);

  const coMovement = useMemo(() => {
    if (top15.length < 2) return [];
    return top15.map((p1) => ({
      name: p1.name.length > 12 ? p1.name.slice(0, 10) + "…" : p1.name,
      cells: top15.map((p2) => {
        const d1_1 = p1.change_1d || 0;
        const d1_2 = p2.change_1d || 0;
        if (d1_1 > 0 && d1_2 > 0) return "up";
        if (d1_1 < 0 && d1_2 < 0) return "down";
        return "diverge";
      }),
    }));
  }, [top15]);

  const sectorRotation = useMemo(() => {
    const map = new Map<string, { tvl: number; change1h: number[]; change1d: number[]; change7d: number[]; count: number }>();
    for (const p of protocolList) {
      const cat = p.category || "Other";
      const existing = map.get(cat) || { tvl: 0, change1h: [], change1d: [], change7d: [], count: 0 };
      existing.tvl += p.tvl || 0;
      existing.count += 1;
      if (typeof p.change_1h === "number") existing.change1h.push(p.change_1h);
      if (typeof p.change_1d === "number") existing.change1d.push(p.change_1d);
      if (typeof p.change_7d === "number") existing.change7d.push(p.change_7d);
      map.set(cat, existing);
    }
    return Array.from(map.entries())
      .map(([cat, data]) => ({
        category: cat,
        tvl: data.tvl,
        count: data.count,
        avg1h: data.change1h.length ? data.change1h.reduce((a, b) => a + b, 0) / data.change1h.length : 0,
        avg1d: data.change1d.length ? data.change1d.reduce((a, b) => a + b, 0) / data.change1d.length : 0,
        avg7d: data.change7d.length ? data.change7d.reduce((a, b) => a + b, 0) / data.change7d.length : 0,
      }))
      .filter((s) => s.count >= 2)
      .sort((a, b) => Math.abs(b.avg1d) - Math.abs(a.avg1d));
  }, [protocolList]);

  const sectorTotalPages = Math.ceil(sectorRotation.length / PAGE_SIZE);
  const sectorPageData = sectorRotation.slice((sectorPage - 1) * PAGE_SIZE, sectorPage * PAGE_SIZE);

  const divergenceAlerts = useMemo(() => {
    const catAvg = new Map<string, number>();
    for (const s of sectorRotation) catAvg.set(s.category, s.avg1d);
    return protocolList
      .filter((p) => {
        const cat = p.category || "Other";
        const avg = catAvg.get(cat) || 0;
        const change = p.change_1d || 0;
        const diff = Math.abs(change - avg);
        return diff > Math.abs(avg) * 2 && Math.abs(change) > 3 && (p.tvl || 0) > 100000;
      })
      .sort((a, b) => Math.abs(b.change_1d || 0) - Math.abs(a.change_1d || 0))
      .slice(0, 15)
      .map((p) => ({
        ...p,
        catAvg: catAvg.get(p.category || "Other") || 0,
        divergence: Math.abs((p.change_1d || 0) - (catAvg.get(p.category || "Other") || 0)),
      }));
  }, [protocolList, sectorRotation]);

  const categoryMomentum = useMemo(() => {
    return sectorRotation
      .filter((s) => s.tvl > 0)
      .map((s) => ({
        name: s.category.length > 14 ? s.category.slice(0, 12) + "…" : s.category,
        change: s.avg1d,
        dollarChange: s.tvl * (s.avg1d / 100),
      }))
      .sort((a, b) => b.change - a.change)
      .slice(0, 12);
  }, [sectorRotation]);

  return (
    <Layout>
      <div className="space-y-6 page-enter">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold text-gradient-primary">
            {selectedChain.name} Correlations
          </h1>
          <Badge variant="outline" className="text-primary border-primary/30">PRO</Badge>
        </div>
        <p className="text-muted-foreground text-sm">TVL co-movement analysis, sector rotation tracking, and divergence alerts</p>

        {/* Co-Movement Matrix */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <GitCompare className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">TVL Co-Movement Matrix (24h)</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Green = both up, Red = both down, Gray = diverging directions</p>
          {isLoading ? (
            <div className="skeleton h-[300px] w-full rounded-lg" />
          ) : coMovement.length === 0 ? (
            <ChartEmptyState message="Not enough protocol data for correlation matrix" />
          ) : (
            <div className="overflow-x-auto">
              <table className="text-[10px]">
                <thead>
                  <tr>
                    <th className="p-1 text-muted-foreground text-left" />
                    {top15.map((p) => (
                      <th key={p.name} className="p-1 text-muted-foreground font-normal hidden sm:table-cell" style={{ writingMode: "vertical-rl", maxWidth: 30 }}>
                        {p.name.length > 10 ? p.name.slice(0, 8) + "…" : p.name}
                      </th>
                    ))}
                    {/* Mobile: show abbreviated headers */}
                    {top15.map((p, i) => (
                      <th key={`m-${p.name}`} className="p-0.5 text-muted-foreground font-normal sm:hidden" style={{ writingMode: "vertical-rl", maxWidth: 20 }}>
                        {i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {coMovement.map((row, ri) => (
                    <tr key={ri}>
                      <td className="p-1 text-muted-foreground font-medium whitespace-nowrap">{row.name}</td>
                      {row.cells.map((cell, ci) => (
                        <td key={ci} className="p-0.5">
                          <div className={cn(
                            "w-5 h-5 sm:w-5 sm:h-5 rounded-sm",
                            ri === ci ? "bg-muted" :
                            cell === "up" ? "bg-success/40" :
                            cell === "down" ? "bg-destructive/40" :
                            "bg-muted/30"
                          )} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-success/40" /> Both Up</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-destructive/40" /> Both Down</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-muted/30" /> Diverging</span>
              </div>
            </div>
          )}
        </div>

        {/* Sector Rotation Tracker with pagination */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Sector Rotation Tracker</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Category-level TVL momentum — which sectors are gaining or losing capital</p>
          {isLoading ? (
            <div className="skeleton h-[200px] w-full rounded-lg" />
          ) : sectorRotation.length === 0 ? (
            <ChartEmptyState />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th className="text-right hidden sm:table-cell">Protocols</th>
                      <th className="text-right hidden sm:table-cell">TVL</th>
                      <th className="text-right hidden md:table-cell">1h Avg</th>
                      <th className="text-right">1d Avg</th>
                      <th className="text-right hidden sm:table-cell">7d Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectorPageData.map((s) => (
                      <tr key={s.category}>
                        <td className="font-medium text-foreground">{s.category}</td>
                        <td className="text-right text-muted-foreground hidden sm:table-cell">{s.count}</td>
                        <td className="text-right font-mono hidden sm:table-cell">{formatCurrency(s.tvl)}</td>
                        <td className={cn("text-right font-mono hidden md:table-cell", getChangeColor(s.avg1h))}>{formatPercentage(s.avg1h)}</td>
                        <td className={cn("text-right font-mono font-bold", getChangeColor(s.avg1d))}>{formatPercentage(s.avg1d)}</td>
                        <td className={cn("text-right font-mono hidden sm:table-cell", getChangeColor(s.avg7d))}>{formatPercentage(s.avg7d)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {sectorTotalPages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious onClick={() => setSectorPage(p => Math.max(1, p - 1))} className={sectorPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                    </PaginationItem>
                    {Array.from({ length: Math.min(sectorTotalPages, 5) }, (_, i) => i + 1).map(p => (
                      <PaginationItem key={p}>
                        <PaginationLink isActive={sectorPage === p} onClick={() => setSectorPage(p)} className="cursor-pointer">{p}</PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext onClick={() => setSectorPage(p => Math.min(sectorTotalPages, p + 1))} className={sectorPage === sectorTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Divergence Alerts */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <h3 className="text-base font-semibold text-foreground">Divergence Alerts</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Protocols diverging significantly from their category average</p>
            {isLoading ? (
              <div className="skeleton h-[200px] w-full rounded-lg" />
            ) : divergenceAlerts.length === 0 ? (
              <div className="text-center text-muted-foreground py-6 text-sm">No significant divergences detected</div>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto">
                {divergenceAlerts.map((p) => (
                  <div key={p.name} className="flex items-center gap-3 p-2 rounded-lg border border-border/50 hover:bg-muted/20">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center ${(p.change_1d || 0) >= 0 ? "bg-success/10" : "bg-destructive/10"}`}>
                      {(p.change_1d || 0) >= 0 ? <TrendingUp className="h-3 w-3 text-success" /> : <TrendingDown className="h-3 w-3 text-destructive" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">{p.category} avg: {formatPercentage(p.catAvg)}</p>
                    </div>
                    <div className={cn("text-sm font-mono font-bold", getChangeColor(p.change_1d))}>
                      {formatPercentage(p.change_1d)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category Momentum */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold text-foreground">Category Momentum (24h)</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Average 24h TVL change by category</p>
            {isLoading ? (
              <div className="skeleton h-[280px] w-full rounded-lg" />
            ) : categoryMomentum.length === 0 ? (
              <ChartEmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryMomentum} margin={{ left: 0, right: 16 }}>
                  <XAxis dataKey="name" tick={AXIS_TICK_STYLE} angle={-30} textAnchor="end" height={50} />
                  <YAxis tickFormatter={(v) => `${v.toFixed(1)}%`} tick={AXIS_TICK_STYLE} />
                  <Tooltip
                    formatter={(v: number, _: any, entry: any) => [`${v.toFixed(2)}% (${formatCurrency(entry.payload.dollarChange)})`, "24h Change"]}
                    contentStyle={CHART_TOOLTIP_STYLE}
                  />
                  <Bar dataKey="change" radius={[4, 4, 0, 0]}>
                    {categoryMomentum.map((d, i) => (
                      <Cell key={i} fill={d.change >= 0 ? "hsl(142, 76%, 46%)" : "hsl(0, 70%, 55%)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Historical TVL Trend */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold text-foreground">Historical TVL Context</h3>
            </div>
            <DateRangeSelector value={historyRange} onChange={setHistoryRange} />
          </div>
          <p className="text-xs text-muted-foreground mb-3">TVL history helps contextualize current correlation patterns</p>
          {!tvlHistory || tvlHistory.length === 0 ? (
            <ChartEmptyState message="No historical data available" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={filterByDateRange(tvlHistory, historyRange)} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="corrTvlGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(180, 80%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(180, 80%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => new Date(v * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  tick={AXIS_TICK_STYLE}
                  minTickGap={40}
                />
                <YAxis tickFormatter={(v) => formatCurrency(v, 0)} tick={AXIS_TICK_STYLE} />
                <Tooltip
                  labelFormatter={(v) => new Date(Number(v) * 1000).toLocaleDateString()}
                  formatter={(v: number) => [formatCurrency(v), "TVL"]}
                  contentStyle={CHART_TOOLTIP_STYLE}
                />
                <Area type="monotone" dataKey="tvl" stroke="hsl(180, 80%, 45%)" fill="url(#corrTvlGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </Layout>
  );
}
