import { useMemo, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useChain } from "@/contexts/ChainContext";
import { useChainYieldPools, useChainTVLHistory, useGlobalTVLHistory } from "@/hooks/useDefiData";
import { formatCurrency } from "@/lib/api/defillama";
import { ChartEmptyState } from "@/components/ChartEmptyState";
import { CHART_TOOLTIP_STYLE, CHART_COLORS, AXIS_TICK_STYLE, AXIS_TICK_LIGHT } from "@/lib/chartStyles";
import { DateRangeSelector, DateRange, filterByDateRange } from "@/components/dashboard/DateRangeSelector";
import { TrendingUp, Layers, Zap, BarChart3, Calculator, PieChart as PieIcon, Shield, History } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area, LineChart, Line } from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";

export default function YieldIntelligence() {
  const { selectedChain } = useChain();
  const pools = useChainYieldPools(selectedChain.id);
  const chainId = selectedChain.id;
  const chainTvlHistory = useChainTVLHistory(chainId === "all" ? null : selectedChain.slug);
  const globalTvlHistory = useGlobalTVLHistory();
  const tvlHistory = chainId === "all" ? globalTvlHistory.data : chainTvlHistory.data;
  const poolList = pools.data ?? [];
  const isLoading = pools.isLoading;

  const [ilPriceChange, setIlPriceChange] = useState(50);
  const [historyRange, setHistoryRange] = useState<DateRange>("30d");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // KPIs
  const kpis = useMemo(() => {
    if (!poolList.length) return null;
    const totalTvl = poolList.reduce((a, p) => a + (p.tvlUsd || 0), 0);
    const apys = poolList.map((p) => p.apy || 0).filter((a) => a > 0);
    const maxApy = apys.length ? Math.max(...apys) : 0;
    const avgApy = apys.length ? apys.reduce((a, b) => a + b, 0) / apys.length : 0;
    const stablePools = poolList.filter((p) => /usd|dai|usdt|usdc|busd|tusd|frax/i.test(p.symbol || ""));
    const stablePct = poolList.length > 0 ? (stablePools.length / poolList.length) * 100 : 0;
    const topProject = poolList.reduce((best, p) => (p.tvlUsd || 0) > (best.tvlUsd || 0) ? p : best, poolList[0]);
    return { totalTvl, maxApy, avgApy, activePools: poolList.length, stablePct, topProject: topProject?.project || "—" };
  }, [poolList]);

  // Risk-adjusted yield ranking (APY * log(TVL))
  const riskAdjusted = useMemo(() => {
    return poolList
      .filter((p) => (p.apy || 0) > 0 && (p.tvlUsd || 0) > 10000)
      .map((p) => ({
        pool: (p.symbol || "").length > 20 ? (p.symbol || "").slice(0, 18) + "…" : (p.symbol || ""),
        project: p.project || "—",
        chain: p.chain || "—",
        apy: p.apy || 0,
        tvl: p.tvlUsd || 0,
        riskScore: ((p.apy || 0) * Math.log10(Math.max(p.tvlUsd || 1, 1))) / 100,
      }))
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 30);
  }, [poolList]);

  // Yield by project (top 15)
  const yieldByProject = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const p of poolList) {
      if (!p.project || (p.apy || 0) <= 0) continue;
      const existing = map.get(p.project) || { total: 0, count: 0 };
      existing.total += p.apy || 0;
      existing.count += 1;
      map.set(p.project, existing);
    }
    return Array.from(map.entries())
      .map(([name, data]) => ({ name: name.length > 14 ? name.slice(0, 12) + "…" : name, avgApy: data.total / data.count }))
      .sort((a, b) => b.avgApy - a.avgApy)
      .slice(0, 15);
  }, [poolList]);

  // Stablecoin vs Volatile
  const stableVsVolatile = useMemo(() => {
    let stableTvl = 0, volatileTvl = 0;
    for (const p of poolList) {
      if (/usd|dai|usdt|usdc|busd|tusd|frax/i.test(p.symbol || "")) stableTvl += p.tvlUsd || 0;
      else volatileTvl += p.tvlUsd || 0;
    }
    return [
      { name: "Stablecoin Pools", value: stableTvl },
      { name: "Volatile Pools", value: volatileTvl },
    ];
  }, [poolList]);

  // Yield concentration by project TVL
  const yieldConcentration = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of poolList) {
      if (!p.project) continue;
      map.set(p.project, (map.get(p.project) || 0) + (p.tvlUsd || 0));
    }
    return Array.from(map.entries())
      .map(([name, tvl]) => ({ name: name.length > 14 ? name.slice(0, 12) + "…" : name, tvl }))
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, 10);
  }, [poolList]);

  // IL Calculator
  const ilResult = useMemo(() => {
    const ratio = 1 + ilPriceChange / 100;
    if (ratio <= 0) return 0;
    const il = 2 * Math.sqrt(ratio) / (1 + ratio) - 1;
    return il * 100;
  }, [ilPriceChange]);

  return (
    <Layout>
      <div className="space-y-6 page-enter">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold text-gradient-primary">
            {selectedChain.name} Yield Intelligence
          </h1>
          <Badge variant="outline" className="text-primary border-primary/30">PRO</Badge>
        </div>
        <p className="text-muted-foreground text-sm">Advanced yield analytics, risk-adjusted rankings, and concentration analysis</p>

        {/* KPI Row */}
        {kpis && (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {[
              { label: "Total Yield TVL", value: formatCurrency(kpis.totalTvl), icon: Layers },
              { label: "Max APY", value: `${kpis.maxApy.toFixed(1)}%`, icon: TrendingUp, color: "text-success" },
              { label: "Avg APY", value: `${kpis.avgApy.toFixed(1)}%`, icon: BarChart3 },
              { label: "Active Pools", value: String(kpis.activePools), icon: Zap },
              { label: "Stablecoin %", value: `${kpis.stablePct.toFixed(0)}%`, icon: Shield },
              { label: "Top Project", value: kpis.topProject, icon: PieIcon },
            ].map((s) => (
              <div key={s.label} className="stat-card">
                {isLoading ? (
                  <><div className="skeleton h-4 w-20 mb-2" /><div className="skeleton h-6 w-24" /></>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                      <s.icon className="h-3.5 w-3.5" />{s.label}
                    </div>
                    <div className={`text-lg font-bold ${s.color || "text-foreground"}`}>{s.value}</div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Risk-Adjusted Yield Ranking */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-base font-semibold text-foreground mb-1">Risk-Adjusted Yield Ranking</h3>
          <p className="text-xs text-muted-foreground mb-3">Pools ranked by APY weighted by TVL depth — higher TVL = lower risk proxy</p>
          {isLoading ? (
            <div className="skeleton h-[300px] w-full rounded-lg" />
          ) : riskAdjusted.length === 0 ? (
            <ChartEmptyState message="No yield pools with sufficient data" height="h-[200px]" />
          ) : (
            <>
              <div className="overflow-hidden">
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th className="hidden sm:table-cell">#</th>
                      <th>Pool</th>
                      <th className="hidden md:table-cell">Project</th>
                      <th className="hidden lg:table-cell">Chain</th>
                      <th className="text-right">APY</th>
                      <th className="text-right">TVL</th>
                      <th className="text-right hidden sm:table-cell">Risk Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskAdjusted.slice((page - 1) * pageSize, page * pageSize).map((r, i) => (
                      <tr key={i}>
                        <td className="text-muted-foreground hidden sm:table-cell">{(page - 1) * pageSize + i + 1}</td>
                        <td className="font-medium text-foreground">{r.pool}</td>
                        <td className="text-muted-foreground hidden md:table-cell">{r.project}</td>
                        <td className="text-muted-foreground hidden lg:table-cell">{r.chain}</td>
                        <td className="text-right font-mono text-success">{r.apy.toFixed(2)}%</td>
                        <td className="text-right font-mono">{formatCurrency(r.tvl)}</td>
                        <td className="text-right font-mono text-primary hidden sm:table-cell">{r.riskScore.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {riskAdjusted.length > pageSize && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                      </PaginationItem>
                      {Array.from({ length: Math.ceil(riskAdjusted.length / pageSize) }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === Math.ceil(riskAdjusted.length / pageSize) || Math.abs(p - page) <= 1)
                        .map((p, idx, arr) => (
                          <span key={p}>
                            {idx > 0 && arr[idx - 1] !== p - 1 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
                            <PaginationItem>
                              <PaginationLink isActive={p === page} onClick={() => setPage(p)} className="cursor-pointer">{p}</PaginationLink>
                            </PaginationItem>
                          </span>
                        ))}
                      <PaginationItem>
                        <PaginationNext onClick={() => setPage((p) => Math.min(Math.ceil(riskAdjusted.length / pageSize), p + 1))} className={page >= Math.ceil(riskAdjusted.length / pageSize) ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Yield by Project */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-base font-semibold text-foreground mb-1">Average APY by Project</h3>
            <p className="text-xs text-muted-foreground mb-3">Top 15 projects by average yield offered</p>
            {isLoading ? (
              <div className="skeleton h-[260px] w-full rounded-lg" />
            ) : yieldByProject.length === 0 ? (
              <ChartEmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={yieldByProject} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <XAxis type="number" tickFormatter={(v) => `${v.toFixed(0)}%`} tick={AXIS_TICK_STYLE} />
                  <YAxis dataKey="name" type="category" width={90} tick={AXIS_TICK_LIGHT} />
                  <Tooltip formatter={(v: number) => [`${v.toFixed(2)}%`, "Avg APY"]} contentStyle={CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="avgApy" radius={[0, 4, 4, 0]}>
                    {yieldByProject.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Stablecoin vs Volatile */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-base font-semibold text-foreground mb-1">Stablecoin vs Volatile Yields</h3>
            <p className="text-xs text-muted-foreground mb-3">TVL split by underlying asset type</p>
            {isLoading ? (
              <div className="skeleton h-[260px] w-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={stableVsVolatile} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell fill="hsl(142, 76%, 46%)" />
                    <Cell fill="hsl(280, 80%, 60%)" />
                  </Pie>
                  <Tooltip formatter={(v: number) => [formatCurrency(v), "TVL"]} contentStyle={CHART_TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Yield Concentration */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-base font-semibold text-foreground mb-1">Yield TVL Concentration</h3>
          <p className="text-xs text-muted-foreground mb-3">Which projects capture the most yield TVL</p>
          {isLoading ? (
            <div className="skeleton h-[240px] w-full rounded-lg" />
          ) : yieldConcentration.length === 0 ? (
            <ChartEmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={yieldConcentration} margin={{ left: 0, right: 16 }}>
                <XAxis dataKey="name" tick={AXIS_TICK_STYLE} angle={-30} textAnchor="end" height={50} />
                <YAxis tickFormatter={(v) => formatCurrency(v)} tick={AXIS_TICK_STYLE} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), "TVL"]} contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar dataKey="tvl" radius={[4, 4, 0, 0]}>
                  {yieldConcentration.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Historical TVL Trend */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold text-foreground">Historical TVL Trend</h3>
            </div>
            <DateRangeSelector value={historyRange} onChange={setHistoryRange} />
          </div>
          <p className="text-xs text-muted-foreground mb-3">Ecosystem TVL history — context for yield sustainability</p>
          {!tvlHistory || tvlHistory.length === 0 ? (
            <ChartEmptyState message="No historical data available" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={filterByDateRange(tvlHistory, historyRange)} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="yieldTvlGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 46%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 76%, 46%)" stopOpacity={0} />
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
                <Area type="monotone" dataKey="tvl" stroke="hsl(142, 76%, 46%)" fill="url(#yieldTvlGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Impermanent Loss Estimator */}
        <Card className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Impermanent Loss Estimator</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Estimate IL for a 50/50 liquidity pool based on price change of one asset</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div>
              <label className="text-sm text-muted-foreground block mb-2">Price Change (%)</label>
              <input
                type="range"
                min={-90}
                max={500}
                value={ilPriceChange}
                onChange={(e) => setIlPriceChange(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>-90%</span>
                <span className="font-mono font-bold text-foreground">{ilPriceChange >= 0 ? "+" : ""}{ilPriceChange}%</span>
                <span>+500%</span>
              </div>
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Impermanent Loss</p>
              <p className={cn("text-3xl font-bold font-mono", ilResult < -5 ? "text-destructive" : ilResult < -1 ? "text-warning" : "text-success")}>
                {ilResult.toFixed(2)}%
              </p>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Formula: IL = 2√r / (1+r) - 1</p>
              <p>where r = price ratio</p>
              <p className="mt-2">
                {Math.abs(ilResult) < 1 ? "Negligible IL — safe range" :
                 Math.abs(ilResult) < 5 ? "Moderate IL — fees may offset" :
                 "Significant IL — ensure high APY compensates"}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
