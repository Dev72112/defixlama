import { TierGate } from "@/components/TierGate";
import { useMemo, useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { useChain } from "@/contexts/ChainContext";
import { useChainProtocols, useChainDexVolumes, useChainFees, useChainsTVL, useChainTVLData } from "@/hooks/useDefiData";
import { formatCurrency } from "@/lib/api/defillama";
import { Landmark, Activity, BarChart3, Layers, Gauge, TrendingUp, Clock, Search, Zap } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { CategoryTreemap } from "@/components/dashboard/CategoryTreemap";
import { ProtocolLifecycle } from "@/components/dashboard/ProtocolLifecycle";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CHART_TOOLTIP_STYLE, AXIS_TICK_STYLE, CHART_COLORS } from "@/lib/chartStyles";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ResponsiveDataTable, ResponsiveColumn } from "@/components/ui/responsive-table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const PAGE_SIZE = 20;

export default function MarketStructure() {
  const { selectedChain } = useChain();
  const protocols = useChainProtocols(selectedChain.id);
  const dexVolumes = useChainDexVolumes(selectedChain.id);
  const fees = useChainFees(selectedChain.id);
  const tvlData = useChainTVLData(selectedChain.id);
  const chainsTVL = useChainsTVL();

  const protocolList = protocols.data ?? [];
  const dexList = dexVolumes.data ?? [];
  const feeList = fees.data ?? [];
  const [feeSearch, setFeeSearch] = useState("");
  const [feePage, setFeePage] = useState(1);
  const [chainPage, setChainPage] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "overview";

  useEffect(() => { setFeePage(1); setChainPage(1); }, [selectedChain.id]);

  const dexConcentration = useMemo(() => {
    if (!dexList.length) return [];
    const totalVol = dexList.reduce((acc, d) => acc + (d.total24h || 0), 0);
    return dexList.filter((d) => d.total24h && d.total24h > 0).sort((a, b) => (b.total24h || 0) - (a.total24h || 0)).slice(0, 10)
      .map((d) => ({ name: (d.displayName || d.name).length > 14 ? (d.displayName || d.name).slice(0, 12) + "…" : (d.displayName || d.name), volume: d.total24h || 0, share: totalVol > 0 ? ((d.total24h || 0) / totalVol) * 100 : 0 }));
  }, [dexList]);

  const dexVsLending = useMemo(() => {
    let dexTvl = 0, lendingTvl = 0, otherTvl = 0;
    for (const p of protocolList) {
      const cat = (p.category || "").toLowerCase();
      if (cat.includes("dex") || cat.includes("exchange")) dexTvl += p.tvl || 0;
      else if (cat.includes("lend") || cat.includes("borrow") || cat.includes("cdp")) lendingTvl += p.tvl || 0;
      else otherTvl += p.tvl || 0;
    }
    return [{ name: "DEXs", tvl: dexTvl }, { name: "Lending", tvl: lendingTvl }, { name: "Other", tvl: otherTvl }];
  }, [protocolList]);

  const totalDexVol = dexList.reduce((acc, d) => acc + (d.total24h || 0), 0);
  const currentTvl = tvlData.data?.tvl || 0;
  const vtRatio = currentTvl > 0 && totalDexVol > 0 ? (totalDexVol / currentTvl) * 100 : 0;

  const diversityData = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of protocolList) map.set(p.category || "Other", (map.get(p.category || "Other") || 0) + 1);
    const total = protocolList.length || 1;
    let h = 0;
    for (const count of map.values()) { const prob = count / total; if (prob > 0) h -= prob * Math.log2(prob); }
    return { categories: map.size, shannon: h, maxShannon: Math.log2(map.size || 1) };
  }, [protocolList]);
  const diversityScore = diversityData.maxShannon > 0 ? (diversityData.shannon / diversityData.maxShannon) * 100 : 0;

  const gini = useMemo(() => {
    const volumes = dexList.map((d) => d.total24h || 0).filter((v) => v > 0).sort((a, b) => a - b);
    const n = volumes.length;
    if (n === 0) return 0;
    const mean = volumes.reduce((a, b) => a + b, 0) / n;
    if (mean === 0) return 0;
    let sum = 0;
    for (let i = 0; i < n; i++) sum += (2 * (i + 1) - n - 1) * volumes[i];
    return sum / (n * n * mean);
  }, [dexList]);
  const fragmentation = 1 - gini;

  const allFeeEfficiency = useMemo(() => {
    const protocolMap = new Map(protocolList.map((p) => [p.name.toLowerCase(), p.tvl || 0]));
    let results = feeList.filter((f: any) => (f.total24h || f.total_24h || 0) > 0).map((f: any) => {
      const feeVal = f.total24h || f.total_24h || 0;
      const matchedTvl = protocolMap.get((f.name || "").toLowerCase()) || 0;
      const fullName = (f.displayName || f.name) as string;
      return { name: fullName.length > 14 ? fullName.slice(0, 12) + "…" : fullName, fullName, fees: feeVal, tvl: matchedTvl, ratio: matchedTvl > 0 ? (feeVal / matchedTvl) * 10000 : 0 };
    }).filter((f) => f.ratio > 0);
    if (feeSearch) results = results.filter((f) => f.fullName.toLowerCase().includes(feeSearch.toLowerCase()));
    return results.sort((a, b) => b.ratio - a.ratio);
  }, [feeList, protocolList, feeSearch]);

  const feeEfficiency = allFeeEfficiency.slice(0, 10);
  const feeTotalPages = Math.ceil(allFeeEfficiency.length / PAGE_SIZE);
  const feePageData = allFeeEfficiency.slice((feePage - 1) * PAGE_SIZE, feePage * PAGE_SIZE);

  const feeDistribution = useMemo(() => {
    return feeList.filter((f: any) => (f.total24h || f.total_24h || 0) > 0)
      .sort((a: any, b: any) => (b.total24h || b.total_24h || 0) - (a.total24h || a.total_24h || 0)).slice(0, 10)
      .map((f: any) => ({ name: ((f.displayName || f.name) as string).length > 14 ? (f.displayName || f.name).slice(0, 12) + "…" : (f.displayName || f.name), fees: f.total24h || f.total_24h || 0 }));
  }, [feeList]);

  const allCrossChainVtl = useMemo(() => {
    const chains = chainsTVL.data ?? [];
    return chains.filter((c) => c.tvl && c.tvl > 0).sort((a, b) => (b.tvl || 0) - (a.tvl || 0));
  }, [chainsTVL.data]);

  const chainTotalPages = Math.ceil(allCrossChainVtl.length / PAGE_SIZE);
  const chainPageData = allCrossChainVtl.slice((chainPage - 1) * PAGE_SIZE, chainPage * PAGE_SIZE);

  const isLoading = protocols.isLoading || dexVolumes.isLoading;

  const feeEffColumns: ResponsiveColumn<any>[] = [
    { key: "fullName", label: "Protocol", priority: "always", render: (f: any) => <span className="font-medium text-foreground truncate max-w-[120px] sm:max-w-none">{f.fullName}</span> },
    { key: "fees", label: "24h Fees", priority: "always", align: "right", render: (f: any) => <span className="font-mono">{formatCurrency(f.fees)}</span> },
    { key: "tvl", label: "TVL", priority: "expanded", align: "right", render: (f: any) => <span className="font-mono">{formatCurrency(f.tvl)}</span> },
    { key: "ratio", label: "Efficiency (bps)", priority: "expanded", align: "right", render: (f: any) => <span className="font-mono font-bold text-primary">{f.ratio.toFixed(1)}</span> },
  ];

  const chainColumns: ResponsiveColumn<any>[] = [
    { key: "rank", label: "#", priority: "desktop", render: (_c: any, i: number) => <span className="text-muted-foreground">{(chainPage - 1) * PAGE_SIZE + i + 1}</span> },
    { key: "name", label: "Chain", priority: "always", render: (c: any) => <span className="font-medium text-foreground">{c.name}</span> },
    { key: "tvl", label: "TVL", priority: "always", align: "right", render: (c: any) => <span className="font-mono">{formatCurrency(c.tvl || 0)}</span> },
  ];

  return (
    <Layout>
    <TierGate requiredTier="pro_plus">
      <ErrorBoundary>
      <div className="space-y-6 page-enter">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gradient-primary">{selectedChain.name} Market Structure</h1>
          <p className="text-muted-foreground mt-1 text-sm">Liquidity dynamics, structural analysis, and protocol efficiency metrics</p>
        </div>

        <Tabs value={currentTab} onValueChange={(v) => setSearchParams({ tab: v })} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
            <TabsTrigger value="chains">Cross-Chain</TabsTrigger>
          </TabsList>

        <TabsContent value="overview" className="space-y-6">

        {/* Ecosystem Structure Insight */}
        {!isLoading && protocolList.length > 0 && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4" /> Ecosystem Structure Insight
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {selectedChain.name} has <span className="font-medium text-foreground">{diversityData.categories} protocol categories</span> with a diversity score of <span className="font-medium text-foreground">{diversityScore.toFixed(0)}%</span>
              {diversityScore > 70
                ? " — a well-diversified ecosystem with broad DeFi coverage."
                : diversityScore > 40
                ? " — moderate diversification with room for emerging categories."
                : " — concentrated in few categories, suggesting early-stage or specialized ecosystem."}
              {" "}Market fragmentation is <span className="font-medium text-foreground">{(fragmentation * 100).toFixed(0)}%</span>
              {fragmentation > 0.6 ? " (healthy competition)" : " (dominated by few players)"}.
              {vtRatio > 0 && <> Vol/TVL ratio of <span className="font-medium text-foreground">{vtRatio.toFixed(2)}%</span> indicates {vtRatio > 5 ? "high trading activity" : vtRatio > 1 ? "moderate capital utilization" : "low trading relative to locked capital"}.</>}
            </p>
          </div>
        )}

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {[
            { label: "Protocol Categories", value: String(diversityData.categories), icon: Layers },
            { label: "Diversity Score", value: `${diversityScore.toFixed(0)}%`, icon: Activity, color: diversityScore > 70 ? "text-success" : diversityScore > 40 ? "text-warning" : "text-destructive" },
            { label: "Vol/TVL Ratio", value: `${vtRatio.toFixed(2)}%`, icon: BarChart3 },
            { label: "DEX Protocols", value: String(dexConcentration.length), icon: Landmark },
            { label: "Fragmentation", value: `${(fragmentation * 100).toFixed(0)}%`, icon: Gauge, color: fragmentation > 0.6 ? "text-success" : "text-warning", sub: fragmentation > 0.6 ? "Well distributed" : "Concentrated" },
            { label: "Fee Generators", value: String(feeDistribution.length), icon: TrendingUp },
            { label: "Avg Protocol Age", value: protocolList.length > 0 ? (() => { const ages = protocolList.filter(p => p.listedAt).map(p => (Date.now()/1000 - (p.listedAt || 0)) / 86400); return ages.length > 0 ? `${Math.round(ages.reduce((a,b)=>a+b,0)/ages.length)}d` : "—"; })() : "—", icon: Clock },
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

        {/* DEX Volume Concentration + DEX vs Lending */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-base font-semibold text-foreground mb-1">DEX Volume Concentration</h3>
            <p className="text-xs text-muted-foreground mb-3">24h volume share by DEX</p>
            {isLoading ? (<div className="skeleton h-[250px] w-full rounded-lg" />) : dexConcentration.length === 0 ? (
              <p className="text-center text-muted-foreground py-12 text-sm">No DEX volume data</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dexConcentration} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                  <XAxis type="number" tickFormatter={(v) => `${v.toFixed(0)}%`} tick={AXIS_TICK_STYLE} />
                  <YAxis dataKey="name" type="category" width={90} tick={{ ...AXIS_TICK_STYLE, fill: "hsl(0,0%,70%)" }} />
                  <Tooltip formatter={(v: number, _: any, entry: any) => [`${v.toFixed(1)}% (${formatCurrency(entry.payload.volume)})`, "Share"]} contentStyle={CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="share" radius={[0, 4, 4, 0]}>{dexConcentration.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}</Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-base font-semibold text-foreground mb-1">DEX vs Lending TVL</h3>
            <p className="text-xs text-muted-foreground mb-3">Capital allocation by protocol type</p>
            {isLoading ? (<div className="skeleton h-[250px] w-full rounded-lg" />) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dexVsLending} margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                  <XAxis dataKey="name" tick={AXIS_TICK_STYLE} />
                  <YAxis tickFormatter={(v) => formatCurrency(v)} tick={AXIS_TICK_STYLE} />
                  <Tooltip formatter={(v: number) => [formatCurrency(v), "TVL"]} contentStyle={CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="tvl" radius={[4, 4, 0, 0]}>{dexVsLending.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}</Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Fee-to-TVL Efficiency Chart */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-1">
            <h3 className="text-base font-semibold text-foreground">Fee-to-TVL Efficiency (bps)</h3>
            <div className="relative sm:ml-auto w-full sm:max-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search..." value={feeSearch} onChange={(e) => { setFeeSearch(e.target.value); setFeePage(1); }} className="pl-8 h-8 text-sm" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Most capital-efficient protocols — higher = more fees per $ locked</p>
          {fees.isLoading ? (<div className="skeleton h-[220px] w-full rounded-lg" />) : feeEfficiency.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 text-sm">No efficiency data</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={feeEfficiency} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                <XAxis type="number" tickFormatter={(v) => `${v.toFixed(0)} bps`} tick={AXIS_TICK_STYLE} />
                <YAxis dataKey="name" type="category" width={90} tick={{ ...AXIS_TICK_STYLE, fill: "hsl(0,0%,70%)" }} />
                <Tooltip formatter={(v: number, _: any, entry: any) => [`${v.toFixed(1)} bps (${formatCurrency(entry.payload.fees)} fees / ${formatCurrency(entry.payload.tvl)} TVL)`, "Efficiency"]} contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar dataKey="ratio" radius={[0, 4, 4, 0]}>{feeEfficiency.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}</Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Fee Efficiency Table */}
        {allFeeEfficiency.length > 10 && (
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-base font-semibold text-foreground mb-3">All Fee Efficiency Rankings</h3>
            <ResponsiveDataTable columns={feeEffColumns} data={feePageData} keyField={(f: any) => f.fullName} emptyMessage="No efficiency data" />
            {feeTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button variant="ghost" size="sm" onClick={() => setFeePage(p => Math.max(1, p - 1))} disabled={feePage === 1}>Prev</Button>
                <span className="text-sm text-muted-foreground">{feePage}/{feeTotalPages}</span>
                <Button variant="ghost" size="sm" onClick={() => setFeePage(p => Math.min(feeTotalPages, p + 1))} disabled={feePage === feeTotalPages}>Next</Button>
              </div>
            )}
          </div>
        )}

        <CategoryTreemap protocols={protocolList} loading={isLoading} />

        {/* Fee Revenue Distribution */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-base font-semibold text-foreground mb-1">Fee Revenue Distribution (24h)</h3>
          <p className="text-xs text-muted-foreground mb-3">Protocols capturing the most fees</p>
          {fees.isLoading ? (<div className="skeleton h-[220px] w-full rounded-lg" />) : feeDistribution.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 text-sm">No fee data</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={feeDistribution} margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={AXIS_TICK_STYLE} />
                <YAxis tickFormatter={(v) => formatCurrency(v)} tick={AXIS_TICK_STYLE} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), "24h Fees"]} contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar dataKey="fees" radius={[4, 4, 0, 0]}>{feeDistribution.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}</Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <ProtocolLifecycle protocols={protocolList} loading={isLoading} />

        {/* Top Chains by TVL */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-base font-semibold text-foreground mb-1">Top Chains by TVL</h3>
          <p className="text-xs text-muted-foreground mb-3">Cross-chain capital concentration</p>
          {chainsTVL.isLoading ? (<div className="skeleton h-[220px] w-full rounded-lg" />) : allCrossChainVtl.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 text-sm">No chain data</p>
          ) : (
            <>
              <ResponsiveDataTable columns={chainColumns} data={chainPageData} keyField={(c: any) => c.name} emptyMessage="No chain data" />
              {chainTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button variant="ghost" size="sm" onClick={() => setChainPage(p => Math.max(1, p - 1))} disabled={chainPage === 1}>Prev</Button>
                  <span className="text-sm text-muted-foreground">{chainPage}/{chainTotalPages}</span>
                  <Button variant="ghost" size="sm" onClick={() => setChainPage(p => Math.min(chainTotalPages, p + 1))} disabled={chainPage === chainTotalPages}>Next</Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      </ErrorBoundary>
    </TierGate>
    </Layout>
  );
}