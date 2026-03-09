import { TierGate } from "@/components/TierGate";
import { useMemo, useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { useChain } from "@/contexts/ChainContext";
import { useChainProtocols, useChainsTVL, useChainDexVolumes } from "@/hooks/useDefiData";
import { formatCurrency, formatPercentage, getChangeColor } from "@/lib/api/defillama";
import { TVLFlowTable } from "@/components/dashboard/TVLFlowTable";
import { CapitalConcentrationChart } from "@/components/dashboard/CapitalConcentrationChart";
import { AccumulationHeatmap } from "@/components/dashboard/AccumulationHeatmap";
import { CrossChainFlowMatrix } from "@/components/dashboard/CrossChainFlowMatrix";
import { CategoryTreemap } from "@/components/dashboard/CategoryTreemap";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CHART_TOOLTIP_STYLE, AXIS_TICK_STYLE, CHART_COLORS } from "@/lib/chartStyles";
import { Waves, TrendingUp, TrendingDown, BarChart3, AlertTriangle, Gauge, Zap, Filter, Search, Eye, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type Severity = "all" | "moderate" | "major" | "extreme";

function getSeverity(change: number): "moderate" | "major" | "extreme" {
  const abs = Math.abs(change);
  if (abs >= 30) return "extreme";
  if (abs >= 15) return "major";
  return "moderate";
}

const SEVERITY_STYLES: Record<string, string> = {
  moderate: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  major: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  extreme: "bg-red-500/10 text-red-300 border-red-500/20",
};

const PAGE_SIZE = 10;

export default function WhaleActivity() {
  const { selectedChain } = useChain();
  const protocols = useChainProtocols(selectedChain.id);
  const chainsTVL = useChainsTVL();
  const dexVolumes = useChainDexVolumes(selectedChain.id);
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "overview";
  const [severityFilter, setSeverityFilter] = useState<Severity>("all");
  const [whaleSearch, setWhaleSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [alertPage, setAlertPage] = useState(1);

  useEffect(() => { setAlertPage(1); }, [selectedChain.id]);
  const setTab = (tab: string) => { setSearchParams({ tab }); setAlertPage(1); };

  const protocolList = protocols.data ?? [];

  const topProtocols = useMemo(() => {
    if (!protocolList.length) return [];
    const totalTvl = protocolList.reduce((acc, p) => acc + (p.tvl || 0), 0);
    return protocolList.filter((p) => p.tvl && p.tvl > 0).sort((a, b) => (b.tvl || 0) - (a.tvl || 0)).slice(0, 10)
      .map((p) => ({ name: p.name.length > 14 ? p.name.slice(0, 12) + "…" : p.name, tvl: p.tvl || 0, share: totalTvl > 0 ? ((p.tvl || 0) / totalTvl) * 100 : 0 }));
  }, [protocolList]);

  const hhi = useMemo(() => {
    const totalTvl = protocolList.reduce((acc, p) => acc + (p.tvl || 0), 0);
    if (totalTvl === 0) return { value: 0, label: "—", color: "text-muted-foreground" };
    let index = 0;
    for (const p of protocolList) { const share = ((p.tvl || 0) / totalTvl) * 100; index += share * share; }
    const label = index > 2500 ? "Highly Concentrated" : index > 1500 ? "Moderately Concentrated" : "Competitive";
    const color = index > 2500 ? "text-destructive" : index > 1500 ? "text-warning" : "text-success";
    return { value: Math.round(index), label, color };
  }, [protocolList]);

  const capitalVelocity = useMemo(() => {
    const totalTvl = protocolList.reduce((acc, p) => acc + (p.tvl || 0), 0);
    if (totalTvl === 0) return { value: 0, pct: "0%" };
    let totalFlow = 0;
    for (const p of protocolList) totalFlow += (p.tvl || 0) * (Math.abs(p.change_1d || 0) / 100);
    return { value: totalFlow, pct: ((totalFlow / totalTvl) * 100).toFixed(2) + "%" };
  }, [protocolList]);

  const whaleAlerts = useMemo(() => {
    return protocolList.filter((p) => p.tvl && p.tvl > 500000 && Math.abs(p.change_1d || 0) > 5)
      .sort((a, b) => Math.abs(b.change_1d || 0) - Math.abs(a.change_1d || 0))
      .map((p) => ({ ...p, severity: getSeverity(p.change_1d || 0), dollarMove: (p.tvl || 0) * (Math.abs(p.change_1d || 0) / 100) }));
  }, [protocolList]);

  const filteredAlerts = useMemo(() => {
    let alerts = severityFilter === "all" ? whaleAlerts : whaleAlerts.filter((a) => a.severity === severityFilter);
    if (whaleSearch) alerts = alerts.filter((a) => a.name.toLowerCase().includes(whaleSearch.toLowerCase()));
    if (categoryFilter !== "all") alerts = alerts.filter((a) => (a.category || "Other") === categoryFilter);
    return alerts;
  }, [whaleAlerts, severityFilter, whaleSearch, categoryFilter]);

  const alertTotalPages = Math.ceil(filteredAlerts.length / PAGE_SIZE);
  const paginatedAlerts = filteredAlerts.slice((alertPage - 1) * PAGE_SIZE, alertPage * PAGE_SIZE);

  const whaleCategories = useMemo(() => {
    const cats = new Set(protocolList.map((p) => p.category || "Other"));
    return Array.from(cats).sort();
  }, [protocolList]);

  const stats = useMemo(() => {
    const totalTvl = protocolList.reduce((acc, p) => acc + (p.tvl || 0), 0);
    const top5Tvl = [...protocolList].sort((a, b) => (b.tvl || 0) - (a.tvl || 0)).slice(0, 5).reduce((acc, p) => acc + (p.tvl || 0), 0);
    const top5Share = totalTvl > 0 ? (top5Tvl / totalTvl) * 100 : 0;
    const inflows = protocolList.filter((p) => (p.change_1d || 0) > 0).reduce((acc, p) => acc + (p.tvl || 0) * ((p.change_1d || 0) / 100), 0);
    const outflows = protocolList.filter((p) => (p.change_1d || 0) < 0).reduce((acc, p) => acc + (p.tvl || 0) * (Math.abs(p.change_1d || 0) / 100), 0);
    return { totalTvl, top5Share, inflows, outflows, alertCount: whaleAlerts.length };
  }, [protocolList, whaleAlerts]);

  const isLoading = protocols.isLoading;

  return (
    <Layout>
    <TierGate requiredTier="pro_plus">
      <ErrorBoundary>
      <div className="space-y-6 page-enter">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-gradient-primary">{selectedChain.name} Whale Activity</h1>
              <Badge variant="outline" className="text-primary border-primary/30">PRO+</Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">Capital concentration, behavioral analytics, and large movement detection</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4 text-primary animate-pulse" />
            {stats.alertCount} alerts
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {[
            { label: "Total TVL", value: formatCurrency(stats.totalTvl), icon: BarChart3 },
            { label: "Top 5 Share", value: `${stats.top5Share.toFixed(1)}%`, icon: Waves },
            { label: "HHI Index", value: String(hhi.value), icon: Gauge, color: hhi.color, sub: hhi.label },
            { label: "Capital Velocity", value: capitalVelocity.pct, icon: Zap, sub: formatCurrency(capitalVelocity.value) + " 24h flow" },
            { label: "24h Inflows", value: formatCurrency(stats.inflows), icon: TrendingUp, color: "text-success" },
            { label: "24h Outflows", value: formatCurrency(stats.outflows), icon: TrendingDown, color: "text-destructive" },
            { label: "Whale Alerts", value: String(stats.alertCount), icon: AlertTriangle, color: stats.alertCount > 0 ? "text-warning" : undefined },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              {isLoading ? (<><div className="skeleton h-4 w-20 mb-2" /><div className="skeleton h-6 w-24" /></>) : (
                <>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1"><s.icon className="h-3.5 w-3.5" />{s.label}</div>
                  <div className={`text-lg font-bold ${s.color || "text-foreground"}`}>{s.value}</div>
                  {"sub" in s && s.sub && <div className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</div>}
                </>
              )}
            </div>
          ))}
        </div>

        <Tabs value={currentTab} onValueChange={setTab}>
          <TabsList className="w-full sm:w-auto overflow-x-auto">
            <TabsTrigger value="overview" className="gap-1.5"><Eye className="h-3.5 w-3.5" /> Overview</TabsTrigger>
            <TabsTrigger value="alerts" className="gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Alerts ({stats.alertCount})</TabsTrigger>
            <TabsTrigger value="flows" className="gap-1.5"><Waves className="h-3.5 w-3.5" /> Capital Flows</TabsTrigger>
          </TabsList>

          {/* Tab: Overview */}
          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Insight Summary */}
              {!isLoading && protocolList.length > 0 && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4" /> Ecosystem Insight
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedChain.name}&apos;s ecosystem is <span className="font-medium text-foreground">{hhi.label.toLowerCase()}</span> (HHI: {hhi.value.toLocaleString()})
                    {hhi.value > 2500
                      ? ", meaning a few protocols dominate TVL — systemic risk is elevated."
                      : hhi.value > 1500
                      ? ", with moderate concentration. Top players hold outsized influence."
                      : ", with capital well-distributed — a healthy, competitive ecosystem."}
                    {" "}Daily capital velocity is <span className="font-medium text-foreground">{capitalVelocity.pct}</span> ({formatCurrency(capitalVelocity.value)} moved in 24h),
                    {parseFloat(capitalVelocity.pct) > 5
                      ? " indicating high rotation."
                      : parseFloat(capitalVelocity.pct) > 1
                      ? " suggesting healthy liquidity rotation."
                      : " relatively stable with minimal movement."}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-lg border border-border bg-card p-4">
                  <h3 className="text-base font-semibold text-foreground mb-1">TVL Concentration — Top 10</h3>
                  <p className="text-xs text-muted-foreground mb-3">Protocols holding the largest share of ecosystem TVL</p>
                  {isLoading ? (<div className="skeleton h-[250px] w-full rounded-lg" />) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={topProtocols} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                        <XAxis type="number" tickFormatter={(v) => `${v.toFixed(0)}%`} tick={AXIS_TICK_STYLE} />
                        <YAxis dataKey="name" type="category" width={90} tick={{ ...AXIS_TICK_STYLE, fill: "hsl(0,0%,70%)" }} />
                        <Tooltip formatter={(v: number, _: any, entry: any) => [`${v.toFixed(1)}% (${formatCurrency(entry.payload.tvl)})`, "Share"]} contentStyle={CHART_TOOLTIP_STYLE} />
                        <Bar dataKey="share" radius={[0, 4, 4, 0]}>{topProtocols.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}</Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <CapitalConcentrationChart chains={chainsTVL.data ?? []} loading={chainsTVL.isLoading} />
              </div>

              <AccumulationHeatmap protocols={protocolList} loading={isLoading} />
            </div>
          </TabsContent>

          {/* Tab: Alerts */}
          <TabsContent value="alerts">
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <h3 className="text-base font-semibold text-foreground">Whale Alert Feed</h3>
                    <span className="text-xs text-muted-foreground">Protocols with &gt;5% TVL shift</span>
                  </div>
                  <div className="flex items-center gap-1 sm:ml-auto flex-wrap">
                    <Filter className="h-3 w-3 text-muted-foreground" />
                    {(["all", "moderate", "major", "extreme"] as Severity[]).map((s) => (
                      <button key={s} onClick={() => { setSeverityFilter(s); setAlertPage(1); }}
                        className={cn("px-2 py-0.5 rounded text-[10px] font-medium transition-colors capitalize",
                          severityFilter === s ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                        )}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                  <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search protocols..." value={whaleSearch} onChange={(e) => { setWhaleSearch(e.target.value); setAlertPage(1); }} className="pl-8 h-8 text-sm" />
                  </div>
                  <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setAlertPage(1); }}
                    className="h-8 text-xs rounded-md border border-border bg-card px-2 text-foreground w-full sm:w-auto">
                    <option value="all">All Categories</option>
                    {whaleCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {isLoading ? (
                  <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-14 w-full" />)}</div>
                ) : paginatedAlerts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6 text-sm">No movements matching filter</p>
                ) : (
                  <div className="space-y-2">
                    {paginatedAlerts.map((p) => {
                      const isPos = (p.change_1d || 0) >= 0;
                      return (
                        <div key={p.id || p.name} className={cn("flex items-center gap-3 p-3 rounded-lg border", SEVERITY_STYLES[p.severity])}>
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${isPos ? "bg-success/10" : "bg-destructive/10"}`}>
                            {isPos ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground text-sm truncate">{p.name}</span>
                              <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold uppercase hidden sm:inline", SEVERITY_STYLES[p.severity])}>{p.severity}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">{p.category || "—"} • {formatCurrency(p.tvl)} • Est. move: {formatCurrency(p.dollarMove)}</div>
                          </div>
                          <div className={`text-sm font-mono font-medium ${getChangeColor(p.change_1d)}`}>{formatPercentage(p.change_1d)}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {alertTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Button variant="ghost" size="sm" onClick={() => setAlertPage(p => Math.max(1, p - 1))} disabled={alertPage === 1}>Prev</Button>
                    <span className="text-sm text-muted-foreground">{alertPage}/{alertTotalPages}</span>
                    <Button variant="ghost" size="sm" onClick={() => setAlertPage(p => Math.min(alertTotalPages, p + 1))} disabled={alertPage === alertTotalPages}>Next</Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Tab: Capital Flows */}
          <TabsContent value="flows">
            <div className="space-y-6">
              <CrossChainFlowMatrix protocols={protocolList} loading={isLoading} />
              <CategoryTreemap protocols={protocolList} loading={isLoading} />
              <TVLFlowTable protocols={protocolList} loading={isLoading} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      </ErrorBoundary>
    </TierGate>
    </Layout>
  );
}
