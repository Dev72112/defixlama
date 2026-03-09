import { TierGate } from "@/components/TierGate";
import { useMemo, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useChain } from "@/contexts/ChainContext";
import { useChainYieldPools, useChainTVLHistory, useGlobalTVLHistory } from "@/hooks/useDefiData";
import { formatCurrency } from "@/lib/api/defillama";
import { ChartEmptyState } from "@/components/ChartEmptyState";
import { CHART_TOOLTIP_STYLE, CHART_COLORS, AXIS_TICK_STYLE, AXIS_TICK_LIGHT } from "@/lib/chartStyles";
import { DateRangeSelector, DateRange, filterByDateRange } from "@/components/dashboard/DateRangeSelector";
import { TrendingUp, Layers, Zap, BarChart3, Calculator, PieChart as PieIcon, Shield, History, Brain, LineChart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area, ScatterChart, Scatter, ZAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ResponsiveDataTable, ResponsiveColumn } from "@/components/ui/responsive-table";

export default function YieldIntelligence() {
  const { selectedChain } = useChain();
  const pools = useChainYieldPools(selectedChain.id);
  const chainId = selectedChain.id;
  const chainTvlHistory = useChainTVLHistory(chainId === "all" ? null : selectedChain.slug);
  const globalTvlHistory = useGlobalTVLHistory();
  const tvlHistory = chainId === "all" ? globalTvlHistory.data : chainTvlHistory.data;
  const poolList = pools.data ?? [];
  const isLoading = pools.isLoading;
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "overview";

  const [ilPriceChange, setIlPriceChange] = useState(50);
  const [historyRange, setHistoryRange] = useState<DateRange>("30d");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const setTab = (tab: string) => { setSearchParams({ tab }); setPage(1); };

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

  const riskAdjusted = useMemo(() => {
    return poolList
      .filter((p) => (p.apy || 0) > 0 && (p.tvlUsd || 0) > 10000)
      .map((p) => ({
        pool: (p.symbol || "").length > 20 ? (p.symbol || "").slice(0, 18) + "…" : (p.symbol || ""),
        project: p.project || "—", chain: p.chain || "—",
        apy: p.apy || 0, tvl: p.tvlUsd || 0,
        riskScore: ((p.apy || 0) * Math.log10(Math.max(p.tvlUsd || 1, 1))) / 100,
      }))
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 30);
  }, [poolList]);

  const yieldByProject = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const p of poolList) {
      if (!p.project || (p.apy || 0) <= 0) continue;
      const existing = map.get(p.project) || { total: 0, count: 0 };
      existing.total += p.apy || 0; existing.count += 1;
      map.set(p.project, existing);
    }
    return Array.from(map.entries())
      .map(([name, data]) => ({ name: name.length > 14 ? name.slice(0, 12) + "…" : name, avgApy: data.total / data.count }))
      .sort((a, b) => b.avgApy - a.avgApy).slice(0, 15);
  }, [poolList]);

  const stableVsVolatile = useMemo(() => {
    let stableTvl = 0, volatileTvl = 0;
    for (const p of poolList) {
      if (/usd|dai|usdt|usdc|busd|tusd|frax/i.test(p.symbol || "")) stableTvl += p.tvlUsd || 0;
      else volatileTvl += p.tvlUsd || 0;
    }
    return [{ name: "Stablecoin Pools", value: stableTvl }, { name: "Volatile Pools", value: volatileTvl }];
  }, [poolList]);

  const yieldConcentration = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of poolList) { if (!p.project) continue; map.set(p.project, (map.get(p.project) || 0) + (p.tvlUsd || 0)); }
    return Array.from(map.entries())
      .map(([name, tvl]) => ({ name: name.length > 14 ? name.slice(0, 12) + "…" : name, tvl }))
      .sort((a, b) => b.tvl - a.tvl).slice(0, 10);
  }, [poolList]);

  // Risk-Return scatter data
  const riskReturnData = useMemo(() => {
    return poolList
      .filter((p) => (p.apy || 0) > 0 && (p.tvlUsd || 0) > 50000)
      .slice(0, 100)
      .map((p) => ({
        name: p.symbol || "?",
        apy: p.apy || 0,
        tvl: p.tvlUsd || 0,
        risk: Math.max(1, 100 - Math.log10(p.tvlUsd || 1) * 10), // Lower TVL = higher risk
      }));
  }, [poolList]);

  const ilResult = useMemo(() => {
    const ratio = 1 + ilPriceChange / 100;
    if (ratio <= 0) return 0;
    return (2 * Math.sqrt(ratio) / (1 + ratio) - 1) * 100;
  }, [ilPriceChange]);

  const riskColumns: ResponsiveColumn<any>[] = [
    { key: "rank", label: "#", priority: "desktop", className: "w-12", render: (_r: any, i: number) => <span className="text-muted-foreground font-mono text-sm">{(page - 1) * pageSize + i + 1}</span> },
    { key: "pool", label: "Pool", priority: "always", render: (r: any) => <span className="font-medium text-foreground">{r.pool}</span> },
    { key: "project", label: "Project", priority: "expanded", render: (r: any) => <span className="text-muted-foreground">{r.project}</span> },
    { key: "chain", label: "Chain", priority: "expanded", render: (r: any) => <span className="text-muted-foreground">{r.chain}</span> },
    { key: "apy", label: "APY", priority: "always", align: "right", render: (r: any) => <span className="font-mono text-success">{r.apy.toFixed(2)}%</span> },
    { key: "tvl", label: "TVL", priority: "expanded", align: "right", render: (r: any) => <span className="font-mono">{formatCurrency(r.tvl)}</span> },
    { key: "riskScore", label: "Risk Score", priority: "expanded", align: "right", render: (r: any) => <span className="font-mono text-primary">{r.riskScore.toFixed(2)}</span> },
  ];

  const riskTotalPages = Math.ceil(riskAdjusted.length / pageSize);

  return (
    <Layout>
    <TierGate requiredTier="pro_plus">
      <div className="space-y-6 page-enter">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-gradient-primary">{selectedChain.name} Yield Intelligence</h1>
              <Badge variant="outline" className="text-primary border-primary/30">PRO+</Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">Advanced yield analytics, risk-adjusted rankings, and concentration analysis</p>
          </div>
        </div>

        {kpis && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Total Yield TVL", value: formatCurrency(kpis.totalTvl), icon: Layers },
              { label: "Max APY", value: `${kpis.maxApy.toFixed(1)}%`, icon: TrendingUp, color: "text-success" },
              { label: "Avg APY", value: `${kpis.avgApy.toFixed(1)}%`, icon: BarChart3 },
              { label: "Active Pools", value: String(kpis.activePools), icon: Zap },
              { label: "Stablecoin %", value: `${kpis.stablePct.toFixed(0)}%`, icon: Shield },
              { label: "Top Project", value: kpis.topProject, icon: PieIcon },
            ].map((s) => (
              <div key={s.label} className="stat-card">
                {isLoading ? (<><div className="skeleton h-4 w-20 mb-2" /><div className="skeleton h-6 w-24" /></>) : (
                  <>
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1"><s.icon className="h-3.5 w-3.5" />{s.label}</div>
                    <div className={`text-lg font-bold ${s.color || "text-foreground"}`}>{s.value}</div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <Tabs value={currentTab} onValueChange={setTab}>
          <TabsList className="w-full sm:w-auto overflow-x-auto">
            <TabsTrigger value="overview" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Overview</TabsTrigger>
            <TabsTrigger value="risk" className="gap-1.5"><Shield className="h-3.5 w-3.5" /> Risk Analysis</TabsTrigger>
            <TabsTrigger value="tools" className="gap-1.5"><Calculator className="h-3.5 w-3.5" /> Tools</TabsTrigger>
          </TabsList>

          {/* Tab: Overview */}
          <TabsContent value="overview">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-lg border border-border bg-card p-4">
                  <h3 className="text-base font-semibold text-foreground mb-1">Average APY by Project</h3>
                  <p className="text-xs text-muted-foreground mb-3">Top 15 projects by average yield offered</p>
                  {isLoading ? (<div className="skeleton h-[260px] w-full rounded-lg" />) : yieldByProject.length === 0 ? (<ChartEmptyState />) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={yieldByProject} layout="vertical" margin={{ left: 0, right: 16 }}>
                        <XAxis type="number" tickFormatter={(v) => `${v.toFixed(0)}%`} tick={AXIS_TICK_STYLE} />
                        <YAxis dataKey="name" type="category" width={90} tick={AXIS_TICK_LIGHT} />
                        <Tooltip formatter={(v: number) => [`${v.toFixed(2)}%`, "Avg APY"]} contentStyle={CHART_TOOLTIP_STYLE} />
                        <Bar dataKey="avgApy" radius={[0, 4, 4, 0]}>{yieldByProject.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <h3 className="text-base font-semibold text-foreground mb-1">Stablecoin vs Volatile Yields</h3>
                  <p className="text-xs text-muted-foreground mb-3">TVL split by underlying asset type</p>
                  {isLoading ? (<div className="skeleton h-[260px] w-full rounded-lg" />) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={stableVsVolatile} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          <Cell fill="hsl(var(--success))" /><Cell fill="hsl(var(--chart-3))" />
                        </Pie>
                        <Tooltip formatter={(v: number) => [formatCurrency(v), "TVL"]} contentStyle={CHART_TOOLTIP_STYLE} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="text-base font-semibold text-foreground mb-1">Yield TVL Concentration</h3>
                <p className="text-xs text-muted-foreground mb-3">Which projects capture the most yield TVL</p>
                {isLoading ? (<div className="skeleton h-[240px] w-full rounded-lg" />) : yieldConcentration.length === 0 ? (<ChartEmptyState />) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={yieldConcentration} margin={{ left: 0, right: 16 }}>
                      <XAxis dataKey="name" tick={AXIS_TICK_STYLE} angle={-30} textAnchor="end" height={50} />
                      <YAxis tickFormatter={(v) => formatCurrency(v)} tick={AXIS_TICK_STYLE} />
                      <Tooltip formatter={(v: number) => [formatCurrency(v), "TVL"]} contentStyle={CHART_TOOLTIP_STYLE} />
                      <Bar dataKey="tvl" radius={[4, 4, 0, 0]}>{yieldConcentration.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" />
                    <h3 className="text-base font-semibold text-foreground">Historical TVL Trend</h3>
                  </div>
                  <DateRangeSelector value={historyRange} onChange={setHistoryRange} />
                </div>
                <p className="text-xs text-muted-foreground mb-3">Ecosystem TVL history — context for yield sustainability</p>
                {!tvlHistory || tvlHistory.length === 0 ? (<ChartEmptyState message="No historical data available" />) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={filterByDateRange(tvlHistory, historyRange)} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
                      <defs>
                        <linearGradient id="yieldTvlGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tickFormatter={(v) => new Date(v * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric" })} tick={AXIS_TICK_STYLE} minTickGap={40} />
                      <YAxis tickFormatter={(v) => formatCurrency(v, 0)} tick={AXIS_TICK_STYLE} />
                      <Tooltip labelFormatter={(v) => new Date(Number(v) * 1000).toLocaleDateString()} formatter={(v: number) => [formatCurrency(v), "TVL"]} contentStyle={CHART_TOOLTIP_STYLE} />
                      <Area type="monotone" dataKey="tvl" stroke="hsl(var(--success))" fill="url(#yieldTvlGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Tab: Risk Analysis */}
          <TabsContent value="risk">
            <div className="space-y-6">
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="text-base font-semibold text-foreground mb-1">Risk-Adjusted Yield Ranking</h3>
                <p className="text-xs text-muted-foreground mb-3">Pools ranked by APY weighted by TVL depth — higher TVL = lower risk proxy</p>
                {isLoading ? (
                  <div className="skeleton h-[300px] w-full rounded-lg" />
                ) : riskAdjusted.length === 0 ? (
                  <ChartEmptyState message="No yield pools with sufficient data" height="h-[200px]" />
                ) : (
                  <>
                    <ResponsiveDataTable
                      columns={riskColumns}
                      data={riskAdjusted.slice((page - 1) * pageSize, page * pageSize)}
                      keyField={(_r: any, i: number) => String((page - 1) * pageSize + i)}
                    />
                    {riskTotalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-4">
                        <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                        <span className="text-sm text-muted-foreground">{page}/{riskTotalPages}</span>
                        <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.min(riskTotalPages, p + 1))} disabled={page >= riskTotalPages}>Next</Button>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <LineChart className="h-4 w-4 text-primary" />
                  <h3 className="text-base font-semibold text-foreground">Risk-Return Scatter</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3">APY vs estimated risk (based on TVL) — larger dots = higher TVL</p>
                {isLoading ? (<div className="skeleton h-[300px] w-full rounded-lg" />) : riskReturnData.length === 0 ? (<ChartEmptyState />) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
                      <XAxis type="number" dataKey="risk" name="Risk" tick={AXIS_TICK_STYLE} domain={[0, 100]} label={{ value: "Risk →", position: "bottom", fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                      <YAxis type="number" dataKey="apy" name="APY" tick={AXIS_TICK_STYLE} tickFormatter={(v) => `${v}%`} label={{ value: "APY ↑", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                      <ZAxis type="number" dataKey="tvl" range={[50, 400]} />
                      <Tooltip content={({ payload }) => payload?.[0]?.payload ? (
                        <div className="rounded-lg border border-border bg-card p-2 text-xs">
                          <p className="font-medium text-foreground">{payload[0].payload.name}</p>
                          <p className="text-muted-foreground">APY: {payload[0].payload.apy.toFixed(2)}%</p>
                          <p className="text-muted-foreground">TVL: {formatCurrency(payload[0].payload.tvl)}</p>
                        </div>
                      ) : null} />
                      <Scatter data={riskReturnData} fill="hsl(var(--primary))" fillOpacity={0.6} />
                    </ScatterChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Tab: Tools */}
          <TabsContent value="tools">
            <div className="space-y-6">
              <Card className="p-4 md:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="h-5 w-5 text-primary" />
                  <h3 className="text-base font-semibold text-foreground">Impermanent Loss Estimator</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4">Estimate IL for a 50/50 liquidity pool based on price change of one asset</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div>
                    <label className="text-sm text-muted-foreground block mb-2">Price Change (%)</label>
                    <input type="range" min={-90} max={500} value={ilPriceChange} onChange={(e) => setIlPriceChange(Number(e.target.value))} className="w-full accent-primary" />
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

              <Card className="p-4 md:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="h-5 w-5 text-primary" />
                  <h3 className="text-base font-semibold text-foreground">Yield Strategy Insights</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border p-4">
                    <h4 className="font-medium text-foreground mb-2">Conservative Strategy</h4>
                    <p className="text-sm text-muted-foreground mb-3">Low-risk stablecoin pools with proven protocols</p>
                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                      <li className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-success" />Target APY: 3-8%</li>
                      <li className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-success" />Min TVL: $10M+</li>
                      <li className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-success" />Focus: Blue-chip stablecoin pairs</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <h4 className="font-medium text-foreground mb-2">Aggressive Strategy</h4>
                    <p className="text-sm text-muted-foreground mb-3">Higher-risk pools for maximum yield</p>
                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                      <li className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-warning" />Target APY: 20%+</li>
                      <li className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-warning" />Min TVL: $500K+</li>
                      <li className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-warning" />Accept IL on volatile pairs</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TierGate>
    </Layout>
  );
}
