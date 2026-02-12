import { useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { useChain } from "@/contexts/ChainContext";
import { useChainProtocols, useChainDexVolumes, useChainFees, useChainsTVL, useChainTVLData } from "@/hooks/useDefiData";
import { formatCurrency } from "@/lib/api/defillama";
import { Landmark, Activity, BarChart3, Layers } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

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

  // DEX volume concentration
  const dexConcentration = useMemo(() => {
    const list = dexVolumes.data ?? [];
    if (!list.length) return [];
    const totalVol = list.reduce((acc, d) => acc + (d.total24h || 0), 0);
    return list
      .filter((d) => d.total24h && d.total24h > 0)
      .sort((a, b) => (b.total24h || 0) - (a.total24h || 0))
      .slice(0, 10)
      .map((d) => ({
        name: (d.displayName || d.name).length > 14 ? (d.displayName || d.name).slice(0, 12) + "…" : (d.displayName || d.name),
        volume: d.total24h || 0,
        share: totalVol > 0 ? ((d.total24h || 0) / totalVol) * 100 : 0,
      }));
  }, [dexVolumes.data]);

  // DEX vs Lending TVL
  const dexVsLending = useMemo(() => {
    const list = protocols.data ?? [];
    let dexTvl = 0, lendingTvl = 0, otherTvl = 0;
    for (const p of list) {
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
  }, [protocols.data]);

  // Volume-to-TVL ratio (top chains)
  const vtRatios = useMemo(() => {
    const chains = chainsTVL.data ?? [];
    const dexes = dexVolumes.data ?? [];
    const totalDexVol = dexes.reduce((acc, d) => acc + (d.total24h || 0), 0);
    const currentTvl = tvlData.data?.tvl || 0;
    if (currentTvl === 0) return [];
    // For the currently selected chain, show the ratio
    return [{ name: selectedChain.name, ratio: totalDexVol > 0 && currentTvl > 0 ? totalDexVol / currentTvl : 0, volume: totalDexVol, tvl: currentTvl }];
  }, [chainsTVL.data, dexVolumes.data, tvlData.data, selectedChain]);

  // Protocol diversity (category count / spread)
  const diversityData = useMemo(() => {
    const list = protocols.data ?? [];
    const map = new Map<string, number>();
    for (const p of list) map.set(p.category || "Other", (map.get(p.category || "Other") || 0) + 1);
    const total = list.length || 1;
    // Shannon diversity
    let h = 0;
    for (const count of map.values()) {
      const p = count / total;
      if (p > 0) h -= p * Math.log2(p);
    }
    return { categories: map.size, shannon: h, maxShannon: Math.log2(map.size || 1) };
  }, [protocols.data]);

  const diversityScore = diversityData.maxShannon > 0 ? ((diversityData.shannon / diversityData.maxShannon) * 100) : 0;

  // Fee revenue distribution
  const feeDistribution = useMemo(() => {
    const list = fees.data ?? [];
    return list
      .filter((f: any) => (f.total24h || f.total_24h || 0) > 0)
      .sort((a: any, b: any) => (b.total24h || b.total_24h || 0) - (a.total24h || a.total_24h || 0))
      .slice(0, 10)
      .map((f: any) => ({
        name: ((f.displayName || f.name) as string).length > 14 ? (f.displayName || f.name).slice(0, 12) + "…" : (f.displayName || f.name),
        fees: f.total24h || f.total_24h || 0,
      }));
  }, [fees.data]);

  const isLoading = protocols.isLoading || dexVolumes.isLoading;

  return (
    <Layout>
      <div className="space-y-6 page-enter">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gradient-primary">
            {selectedChain.name} Market Structure
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Liquidity dynamics, volume concentration, and protocol diversity analysis
          </p>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Protocol Categories", value: String(diversityData.categories), icon: Layers },
            { label: "Diversity Score", value: `${diversityScore.toFixed(0)}%`, icon: Activity, color: diversityScore > 70 ? "text-success" : diversityScore > 40 ? "text-warning" : "text-destructive" },
            { label: "Vol/TVL Ratio", value: vtRatios[0] ? `${(vtRatios[0].ratio * 100).toFixed(2)}%` : "—", icon: BarChart3 },
            { label: "DEX Protocols", value: String(dexConcentration.length), icon: Landmark },
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

        {/* DEX Volume Concentration + DEX vs Lending */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-base font-semibold text-foreground mb-1">DEX Volume Concentration</h3>
            <p className="text-xs text-muted-foreground mb-3">24h volume share by DEX</p>
            {isLoading ? (
              <div className="skeleton h-[250px] w-full rounded-lg" />
            ) : dexConcentration.length === 0 ? (
              <p className="text-center text-muted-foreground py-12 text-sm">No DEX volume data available</p>
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
                    {dexConcentration.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
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
                    {dexVsLending.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Fee Revenue Distribution */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-base font-semibold text-foreground mb-1">Fee Revenue Distribution (24h)</h3>
          <p className="text-xs text-muted-foreground mb-3">Protocols capturing the most fees — a proxy for real usage and stickiness</p>
          {fees.isLoading ? (
            <div className="skeleton h-[220px] w-full rounded-lg" />
          ) : feeDistribution.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 text-sm">No fee data available</p>
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
                  {feeDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </Layout>
  );
}
