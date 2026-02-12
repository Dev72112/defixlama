import { useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { useChain } from "@/contexts/ChainContext";
import { useChainProtocols, useChainsTVL, useChainDexVolumes } from "@/hooks/useDefiData";
import { formatCurrency, formatPercentage, getChangeColor } from "@/lib/api/defillama";
import { TVLFlowTable } from "@/components/dashboard/TVLFlowTable";
import { CapitalConcentrationChart } from "@/components/dashboard/CapitalConcentrationChart";
import { Waves, TrendingUp, TrendingDown, BarChart3, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function WhaleActivity() {
  const { selectedChain } = useChain();
  const protocols = useChainProtocols(selectedChain.id);
  const chainsTVL = useChainsTVL();
  const dexVolumes = useChainDexVolumes(selectedChain.id);

  // Top 10 protocols by TVL share
  const topProtocols = useMemo(() => {
    const list = protocols.data ?? [];
    if (!list.length) return [];
    const totalTvl = list.reduce((acc, p) => acc + (p.tvl || 0), 0);
    return list
      .filter((p) => p.tvl && p.tvl > 0)
      .sort((a, b) => (b.tvl || 0) - (a.tvl || 0))
      .slice(0, 10)
      .map((p) => ({
        name: p.name.length > 14 ? p.name.slice(0, 12) + "…" : p.name,
        tvl: p.tvl || 0,
        share: totalTvl > 0 ? ((p.tvl || 0) / totalTvl) * 100 : 0,
      }));
  }, [protocols.data]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const list = protocols.data ?? [];
    const map = new Map<string, number>();
    for (const p of list) {
      const cat = p.category || "Other";
      map.set(cat, (map.get(cat) || 0) + (p.tvl || 0));
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, tvl]) => ({ name: name.length > 12 ? name.slice(0, 10) + "…" : name, tvl }));
  }, [protocols.data]);

  // Whale alerts: protocols with >5% TVL change in 24h
  const whaleAlerts = useMemo(() => {
    const list = protocols.data ?? [];
    return list
      .filter((p) => p.tvl && p.tvl > 500000 && Math.abs(p.change_1d || 0) > 5)
      .sort((a, b) => Math.abs(b.change_1d || 0) - Math.abs(a.change_1d || 0))
      .slice(0, 10);
  }, [protocols.data]);

  // Summary stats
  const stats = useMemo(() => {
    const list = protocols.data ?? [];
    const totalTvl = list.reduce((acc, p) => acc + (p.tvl || 0), 0);
    const top5Tvl = list.sort((a, b) => (b.tvl || 0) - (a.tvl || 0)).slice(0, 5).reduce((acc, p) => acc + (p.tvl || 0), 0);
    const top5Share = totalTvl > 0 ? (top5Tvl / totalTvl) * 100 : 0;
    const inflows = list.filter((p) => (p.change_1d || 0) > 0).reduce((acc, p) => acc + (p.tvl || 0) * ((p.change_1d || 0) / 100), 0);
    const outflows = list.filter((p) => (p.change_1d || 0) < 0).reduce((acc, p) => acc + (p.tvl || 0) * (Math.abs(p.change_1d || 0) / 100), 0);
    return { totalTvl, top5Share, inflows, outflows, alertCount: whaleAlerts.length };
  }, [protocols.data, whaleAlerts]);

  const isLoading = protocols.isLoading;

  const CHART_COLORS = [
    "hsl(142, 76%, 46%)", "hsl(180, 80%, 45%)", "hsl(45, 100%, 50%)",
    "hsl(280, 80%, 60%)", "hsl(348, 83%, 47%)", "hsl(200, 70%, 50%)",
    "hsl(30, 90%, 55%)", "hsl(160, 60%, 40%)", "hsl(220, 70%, 55%)", "hsl(0, 70%, 55%)",
  ];

  return (
    <Layout>
      <div className="space-y-6 page-enter">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gradient-primary">
            {selectedChain.name} Whale Activity
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Capital concentration, TVL flow analysis, and large movement detection
          </p>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: "Total TVL", value: formatCurrency(stats.totalTvl), icon: BarChart3 },
            { label: "Top 5 Share", value: `${stats.top5Share.toFixed(1)}%`, icon: Waves },
            { label: "24h Inflows", value: formatCurrency(stats.inflows), icon: TrendingUp, color: "text-success" },
            { label: "24h Outflows", value: formatCurrency(stats.outflows), icon: TrendingDown, color: "text-destructive" },
            { label: "Whale Alerts", value: String(stats.alertCount), icon: AlertTriangle, color: stats.alertCount > 0 ? "text-warning" : undefined },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              {isLoading ? (
                <>
                  <div className="skeleton h-4 w-20 mb-2" />
                  <div className="skeleton h-6 w-24" />
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                    <s.icon className="h-3.5 w-3.5" />
                    {s.label}
                  </div>
                  <div className={`text-lg font-bold ${s.color || "text-foreground"}`}>{s.value}</div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Row: TVL Concentration Bar + Capital Distribution Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top protocols bar chart */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-base font-semibold text-foreground mb-1">TVL Concentration — Top 10</h3>
            <p className="text-xs text-muted-foreground mb-3">Protocols holding the largest share of ecosystem TVL</p>
            {isLoading ? (
              <div className="skeleton h-[250px] w-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topProtocols} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                  <XAxis type="number" tickFormatter={(v) => `${v.toFixed(0)}%`} tick={{ fill: "hsl(0,0%,50%)", fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={90} tick={{ fill: "hsl(0,0%,70%)", fontSize: 11 }} />
                  <Tooltip
                    formatter={(v: number, _: any, entry: any) => [`${v.toFixed(1)}% (${formatCurrency(entry.payload.tvl)})`, "Share"]}
                    contentStyle={{ backgroundColor: "hsl(0 0% 3%)", border: "1px solid hsl(0 0% 8%)", borderRadius: "8px", color: "hsl(0 0% 93%)", fontSize: "12px" }}
                  />
                  <Bar dataKey="share" radius={[0, 4, 4, 0]}>
                    {topProtocols.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Capital distribution donut */}
          <CapitalConcentrationChart chains={chainsTVL.data ?? []} loading={chainsTVL.isLoading} />
        </div>

        {/* Category Breakdown */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-base font-semibold text-foreground mb-1">Capital by Protocol Category</h3>
          <p className="text-xs text-muted-foreground mb-3">Where institutional capital clusters</p>
          {isLoading ? (
            <div className="skeleton h-[200px] w-full rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData} margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: "hsl(0,0%,50%)", fontSize: 11 }} />
                <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fill: "hsl(0,0%,50%)", fontSize: 11 }} />
                <Tooltip
                  formatter={(v: number) => [formatCurrency(v), "TVL"]}
                  contentStyle={{ backgroundColor: "hsl(0 0% 3%)", border: "1px solid hsl(0 0% 8%)", borderRadius: "8px", color: "hsl(0 0% 93%)", fontSize: "12px" }}
                />
                <Bar dataKey="tvl" radius={[4, 4, 0, 0]}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* TVL Flow Analysis Table */}
        <TVLFlowTable protocols={protocols.data ?? []} loading={isLoading} />

        {/* Whale Alert Feed */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h3 className="text-base font-semibold text-foreground">Large Movement Alerts</h3>
            <span className="text-xs text-muted-foreground">Protocols with &gt;5% TVL change in 24h</span>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-12 w-full" />)}
            </div>
          ) : whaleAlerts.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 text-sm">No significant movements detected (&gt;5% TVL shift)</p>
          ) : (
            <div className="space-y-2">
              {whaleAlerts.map((p) => {
                const isPos = (p.change_1d || 0) >= 0;
                return (
                  <div key={p.id || p.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${isPos ? "bg-success/10" : "bg-destructive/10"}`}>
                      {isPos ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-foreground text-sm truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.category || "—"} • {formatCurrency(p.tvl)}</div>
                    </div>
                    <div className={`text-sm font-mono font-medium ${getChangeColor(p.change_1d)}`}>
                      {formatPercentage(p.change_1d)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
