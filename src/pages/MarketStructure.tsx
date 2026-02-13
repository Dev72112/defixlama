import { useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { useChain } from "@/contexts/ChainContext";
import { useChainProtocols, useChainDexVolumes, useChainFees, useChainsTVL, useChainTVLData } from "@/hooks/useDefiData";
import { formatCurrency } from "@/lib/api/defillama";
import { Landmark, Activity, BarChart3, Layers, Gauge, TrendingUp, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { CategoryTreemap } from "@/components/dashboard/CategoryTreemap";
import { ProtocolLifecycle } from "@/components/dashboard/ProtocolLifecycle";
import { cn } from "@/lib/utils";

const COLORS = [
  "hsl(142, 76%, 46%)", "hsl(180, 80%, 45%)", "hsl(45, 100%, 50%)",
  "hsl(280, 80%, 60%)", "hsl(348, 83%, 47%)", "hsl(200, 70%, 50%)",
  "hsl(30, 90%, 55%)", "hsl(160, 60%, 40%)",
];

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

  // DEX volume concentration
  const dexConcentration = useMemo(() => {
    if (!dexList.length) return [];
    const totalVol = dexList.reduce((acc, d) => acc + (d.total24h || 0), 0);
    return dexList
      .filter((d) => d.total24h && d.total24h > 0)
      .sort((a, b) => (b.total24h || 0) - (a.total24h || 0))
      .slice(0, 10)
      .map((d) => ({
        name: (d.displayName || d.name).length > 14 ? (d.displayName || d.name).slice(0, 12) + "…" : (d.displayName || d.name),
        volume: d.total24h || 0,
        share: totalVol > 0 ? ((d.total24h || 0) / totalVol) * 100 : 0,
      }));
  }, [dexList]);

  // DEX vs Lending TVL
  const dexVsLending = useMemo(() => {
    let dexTvl = 0, lendingTvl = 0, otherTvl = 0;
    for (const p of protocolList) {
      const cat = (p.category || "").toLowerCase();
      if (cat.includes("dex") || cat.includes("exchange")) dexTvl += p.tvl || 0;
      else if (cat.includes("lend") || cat.includes("borrow") || cat.includes("cdp")) lendingTvl += p.tvl || 0;
      else otherTvl += p.tvl || 0;
    }
    return [
      { name: "DEXs", tvl: dexTvl },
      { name: "Lending", tvl: lendingTvl },
      { name: "Other", tvl: otherTvl },
    ];
  }, [protocolList]);

  // Volume-to-TVL ratio
  const totalDexVol = dexList.reduce((acc, d) => acc + (d.total24h || 0), 0);
  const currentTvl = tvlData.data?.tvl || 0;
  const vtRatio = currentTvl > 0 && totalDexVol > 0 ? (totalDexVol / currentTvl) * 100 : 0;

  // Protocol diversity (Shannon index)
  const diversityData = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of protocolList) map.set(p.category || "Other", (map.get(p.category || "Other") || 0) + 1);
    const total = protocolList.length || 1;
    let h = 0;
    for (const count of map.values()) {
      const prob = count / total;
      if (prob > 0) h -= prob * Math.log2(prob);
    }
    return { categories: map.size, shannon: h, maxShannon: Math.log2(map.size || 1) };
  }, [protocolList]);
  const diversityScore = diversityData.maxShannon > 0 ? (diversityData.shannon / diversityData.maxShannon) * 100 : 0;

  // Liquidity Fragmentation (Gini coefficient)
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
  const fragmentation = 1 - gini; // Higher = more fragmented/spread

  // Fee-to-TVL efficiency
  const feeEfficiency = useMemo(() => {
    const protocolMap = new Map(protocolList.map((p) => [p.name.toLowerCase(), p.tvl || 0]));
    return feeList
      .filter((f: any) => (f.total24h || f.total_24h || 0) > 0)
      .map((f: any) => {
        const feeVal = f.total24h || f.total_24h || 0;
        const matchedTvl = protocolMap.get((f.name || "").toLowerCase()) || 0;
        return {
          name: ((f.displayName || f.name) as string).length > 14 ? (f.displayName || f.name).slice(0, 12) + "…" : (f.displayName || f.name),
          fees: feeVal,
          tvl: matchedTvl,
          ratio: matchedTvl > 0 ? (feeVal / matchedTvl) * 10000 : 0, // bps
        };
      })
      .filter((f) => f.ratio > 0)
      .sort((a, b) => b.ratio - a.ratio)
      .slice(0, 10);
  }, [feeList, protocolList]);

  // Fee distribution
  const feeDistribution = useMemo(() => {
    return feeList
      .filter((f: any) => (f.total24h || f.total_24h || 0) > 0)
      .sort((a: any, b: any) => (b.total24h || b.total_24h || 0) - (a.total24h || a.total_24h || 0))
      .slice(0, 10)
      .map((f: any) => ({
        name: ((f.displayName || f.name) as string).length > 14 ? (f.displayName || f.name).slice(0, 12) + "…" : (f.displayName || f.name),
        fees: f.total24h || f.total_24h || 0,
      }));
  }, [feeList]);

  // Cross-chain Vol/TVL comparison
  const crossChainVtl = useMemo(() => {
    const chains = chainsTVL.data ?? [];
    // We'd need per-chain DEX volumes which we don't have here easily, 
    // so show top chains by TVL with their TVL as placeholder
    return chains
      .filter((c) => c.tvl && c.tvl > 0)
      .sort((a, b) => (b.tvl || 0) - (a.tvl || 0))
      .slice(0, 10)
      .map((c) => ({ name: c.name, tvl: c.tvl || 0 }));
  }, [chainsTVL.data]);

  const isLoading = protocols.isLoading || dexVolumes.isLoading;

  return (
    <Layout>
      <div className="space-y-6 page-enter">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gradient-primary">
            {selectedChain.name} Market Structure
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Liquidity dynamics, structural analysis, and protocol efficiency metrics
          </p>
        </div>

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
              {isLoading ? (
                <><div className="skeleton h-4 w-20 mb-2" /><div className="skeleton h-6 w-24" /></>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                    <s.icon className="h-3.5 w-3.5" />{s.label}
                  </div>
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
            {isLoading ? (
              <div className="skeleton h-[250px] w-full rounded-lg" />
            ) : dexConcentration.length === 0 ? (
              <p className="text-center text-muted-foreground py-12 text-sm">No DEX volume data</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dexConcentration} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                  <XAxis type="number" tickFormatter={(v) => `${v.toFixed(0)}%`} tick={{ fill: "hsl(0,0%,50%)", fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={90} tick={{ fill: "hsl(0,0%,70%)", fontSize: 11 }} />
                  <Tooltip
                    formatter={(v: number, _: any, entry: any) => [`${v.toFixed(1)}% (${formatCurrency(entry.payload.volume)})`, "Share"]}
                    contentStyle={{ backgroundColor: "hsl(0 0% 3%)", border: "1px solid hsl(0 0% 8%)", borderRadius: "8px", color: "hsl(0 0% 93%)", fontSize: "12px" }}
                  />
                  <Bar dataKey="share" radius={[0, 4, 4, 0]}>
                    {dexConcentration.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-base font-semibold text-foreground mb-1">DEX vs Lending TVL</h3>
            <p className="text-xs text-muted-foreground mb-3">Capital allocation by protocol type</p>
            {isLoading ? (
              <div className="skeleton h-[250px] w-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dexVsLending} margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: "hsl(0,0%,50%)", fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fill: "hsl(0,0%,50%)", fontSize: 11 }} />
                  <Tooltip
                    formatter={(v: number) => [formatCurrency(v), "TVL"]}
                    contentStyle={{ backgroundColor: "hsl(0 0% 3%)", border: "1px solid hsl(0 0% 8%)", borderRadius: "8px", color: "hsl(0 0% 93%)", fontSize: "12px" }}
                  />
                  <Bar dataKey="tvl" radius={[4, 4, 0, 0]}>
                    {dexVsLending.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Fee-to-TVL Efficiency */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-base font-semibold text-foreground mb-1">Fee-to-TVL Efficiency (bps)</h3>
          <p className="text-xs text-muted-foreground mb-3">Most capital-efficient protocols — higher = more fees per $ locked</p>
          {fees.isLoading ? (
            <div className="skeleton h-[220px] w-full rounded-lg" />
          ) : feeEfficiency.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 text-sm">No efficiency data</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={feeEfficiency} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                <XAxis type="number" tickFormatter={(v) => `${v.toFixed(0)} bps`} tick={{ fill: "hsl(0,0%,50%)", fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={90} tick={{ fill: "hsl(0,0%,70%)", fontSize: 11 }} />
                <Tooltip
                  formatter={(v: number, _: any, entry: any) => [`${v.toFixed(1)} bps (${formatCurrency(entry.payload.fees)} fees / ${formatCurrency(entry.payload.tvl)} TVL)`, "Efficiency"]}
                  contentStyle={{ backgroundColor: "hsl(0 0% 3%)", border: "1px solid hsl(0 0% 8%)", borderRadius: "8px", color: "hsl(0 0% 93%)", fontSize: "12px" }}
                />
                <Bar dataKey="ratio" radius={[0, 4, 4, 0]}>
                  {feeEfficiency.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Capital Flow Treemap */}
        <CategoryTreemap protocols={protocolList} loading={isLoading} />

        {/* Fee Revenue Distribution */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-base font-semibold text-foreground mb-1">Fee Revenue Distribution (24h)</h3>
          <p className="text-xs text-muted-foreground mb-3">Protocols capturing the most fees</p>
          {fees.isLoading ? (
            <div className="skeleton h-[220px] w-full rounded-lg" />
          ) : feeDistribution.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 text-sm">No fee data</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={feeDistribution} margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: "hsl(0,0%,50%)", fontSize: 11 }} />
                <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fill: "hsl(0,0%,50%)", fontSize: 11 }} />
                <Tooltip
                  formatter={(v: number) => [formatCurrency(v), "24h Fees"]}
                  contentStyle={{ backgroundColor: "hsl(0 0% 3%)", border: "1px solid hsl(0 0% 8%)", borderRadius: "8px", color: "hsl(0 0% 93%)", fontSize: "12px" }}
                />
                <Bar dataKey="fees" radius={[4, 4, 0, 0]}>
                  {feeDistribution.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Protocol Lifecycle Distribution */}
        <ProtocolLifecycle protocols={protocolList} loading={isLoading} />

        {/* Top Chains by TVL */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-base font-semibold text-foreground mb-1">Top Chains by TVL</h3>
          <p className="text-xs text-muted-foreground mb-3">Cross-chain capital concentration</p>
          {chainsTVL.isLoading ? (
            <div className="skeleton h-[220px] w-full rounded-lg" />
          ) : crossChainVtl.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 text-sm">No chain data</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={crossChainVtl} margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: "hsl(0,0%,50%)", fontSize: 11 }} angle={-30} textAnchor="end" height={50} />
                <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fill: "hsl(0,0%,50%)", fontSize: 11 }} />
                <Tooltip
                  formatter={(v: number) => [formatCurrency(v), "TVL"]}
                  contentStyle={{ backgroundColor: "hsl(0 0% 3%)", border: "1px solid hsl(0 0% 8%)", borderRadius: "8px", color: "hsl(0 0% 93%)", fontSize: "12px" }}
                />
                <Bar dataKey="tvl" radius={[4, 4, 0, 0]}>
                  {crossChainVtl.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </Layout>
  );
}
