import { Layout } from "@/components/layout/Layout";
import { useParams, Link } from "react-router-dom";
import { useChainsTVL, useChainTVLHistory, useAllProtocols, useAllDexVolumes, useChainYieldPools } from "@/hooks/useDefiData";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatCurrency } from "@/lib/api/defillama";
import { ArrowLeft, Globe, Layers, TrendingUp, Activity, ExternalLink, Sprout, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

export default function ChainDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: chains, isLoading } = useChainsTVL();
  const { data: protocols } = useAllProtocols();
  const { data: allDexs } = useAllDexVolumes();

  // Find chain FIRST before using it
  const chain = useMemo(() => {
    if (!chains || !id) return null;
    return chains.find(
      (c) =>
        c.name.toLowerCase() === id.toLowerCase() ||
        c.name.toLowerCase().replace(/\s+/g, "-") === id.toLowerCase()
    );
  }, [chains, id]);

  // Now use chain for history query
  const { data: history, isLoading: historyLoading } = useChainTVLHistory(chain?.name || null);
  const yieldPools = useChainYieldPools(chain?.name || "");

  // Calculate total TVL for market share
  const totalTVL = useMemo(() => {
    if (!chains) return 0;
    return chains.reduce((acc, c) => acc + (c.tvl || 0), 0);
  }, [chains]);

  const marketShare = chain && totalTVL > 0 ? ((chain.tvl / totalTVL) * 100) : 0;
  const rank = useMemo(() => {
    if (!chains || !chain) return 0;
    const sorted = [...chains].sort((a, b) => (b.tvl || 0) - (a.tvl || 0));
    return sorted.findIndex((c) => c.name === chain.name) + 1;
  }, [chains, chain]);

  // Format chart data
  const chartData = useMemo(() => {
    if (!history) return [];
    return history.slice(-90).map((d: any) => ({
      date: new Date(d.date * 1000).toLocaleDateString(),
      tvl: d.tvl || 0,
    }));
  }, [history]);

  // Pie chart data for comparison with top chains
  const pieData = useMemo(() => {
    if (!chains || !chain) return [];
    const sorted = [...chains].sort((a, b) => (b.tvl || 0) - (a.tvl || 0)).slice(0, 10);
    const isInTop10 = sorted.some((c) => c.name === chain.name);
    if (!isInTop10) {
      sorted.pop();
      sorted.push(chain);
    }
    return sorted.map((c) => ({
      name: c.name,
      value: c.tvl || 0,
      isSelected: c.name === chain.name,
    }));
  }, [chains, chain]);

  // Top protocols and DEXs on this chain
  const topProtocols = useMemo(() => {
    if (!protocols || !chain) return [];
    const chainName = chain.name;
    const list = protocols
      .map((p: any) => ({
        ...p,
        chainTvl: p.chainTvls?.[chainName] || 0,
      }))
      .filter((p: any) => (p.chains || (p.chain ? [p.chain] : [])).some((c: string) => String(c).toLowerCase().includes(chainName.toLowerCase())) || (p.chainTvls && p.chainTvls[chainName] > 0))
      .sort((a: any, b: any) => (b.chainTvl || 0) - (a.chainTvl || 0))
      .slice(0, 12);
    return list;
  }, [protocols, chain]);

  const topDexs = useMemo(() => {
    if (!chain) return [];
    const chainName = (chain.name || "").toLowerCase();

    const dexFromAll = Array.isArray(allDexs)
      ? allDexs.filter((d: any) => (d.chains || []).some((c: string) => String(c).toLowerCase().includes(chainName)))
      : [];

    const dexFromProtocols = Array.isArray(protocols)
      ? protocols
          .filter((p: any) => {
            const name = (p.name || "").toLowerCase();
            const isDexLike = p.module === "dex" || name.includes("dex") || name.includes("swap") || name.includes("amm");
            const chains = p.chains || (p.chain ? [p.chain] : []);
            const onChain = Array.isArray(chains) && chains.some((c: string) => String(c).toLowerCase().includes(chainName));
            return isDexLike && onChain;
          })
          .map((p: any) => ({
            name: p.name,
            displayName: p.name,
            total24h: p.tvl || 0,
            total7d: 0,
            total30d: 0,
            totalAllTime: 0,
            change_1d: p.change_1d || 0,
            change_7d: p.change_7d || 0,
            logo: p.logo,
            chains: p.chains || (p.chain ? [p.chain] : []),
          }))
      : [];

    // Merge and dedupe by name/displayName, preferring higher total24h
    const merged = [...dexFromAll, ...dexFromProtocols];
    const map = new Map<string, any>();
    for (const d of merged) {
      const key = (d.displayName || d.name || "").toLowerCase();
      const existing = map.get(key);
      if (!existing) map.set(key, d);
      else if ((d.total24h || 0) > (existing.total24h || 0)) map.set(key, d);
    }

    return Array.from(map.values()).sort((a: any, b: any) => (b.total24h || 0) - (a.total24h || 0)).slice(0, 12);
  }, [allDexs, chain]);

  // TVL Analytics
  const tvlAnalytics = useMemo(() => {
    if (!chain || !history || history.length < 2) return null;
    const latest = history[history.length - 1]?.tvl || 0;
    const prev7d = history.length > 7 ? history[history.length - 8]?.tvl || 0 : latest;
    const prev30d = history.length > 30 ? history[history.length - 31]?.tvl || 0 : latest;
    
    const change7d = prev7d !== 0 ? ((latest - prev7d) / prev7d) * 100 : 0;
    const change30d = prev30d !== 0 ? ((latest - prev30d) / prev30d) * 100 : 0;
    
    // Calculate volatility
    const recentTvls = history.slice(-30).map(h => h.tvl || 0);
    const avgTvl = recentTvls.reduce((a, b) => a + b, 0) / recentTvls.length;
    const variance = recentTvls.reduce((a, b) => a + Math.pow(b - avgTvl, 2), 0) / recentTvls.length;
    const volatility = Math.sqrt(variance) / avgTvl * 100;
    
    return {
      change7d: isFinite(change7d) ? change7d : 0,
      change30d: isFinite(change30d) ? change30d : 0,
      volatility: isFinite(volatility) ? volatility : 0,
      avgTvl: isFinite(avgTvl) ? avgTvl : 0,
    };
  }, [chain, history]);

  // Related chains comparison
  const relatedChains = useMemo(() => {
    if (!chains || !chain) return [];
    return chains
      .filter(c => c.name !== chain.name)
      .sort((a, b) => (b.tvl || 0) - (a.tvl || 0))
      .slice(0, 5);
  }, [chains, chain]);

  const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--muted))",
    "hsl(var(--accent))",
    "hsl(var(--secondary))",
  ];

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6 animate-fade-in">
          <div className="skeleton h-8 w-32" />
          <div className="skeleton h-12 w-64" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-lg" />
            ))}
          </div>
          <div className="skeleton h-[400px] rounded-lg" />
        </div>
      </Layout>
    );
  }

  if (!chain) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Globe className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Chain not found</h2>
          <p className="text-muted-foreground mb-4">
            The chain "{id}" could not be found.
          </p>
          <Link to="/chains">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Chains
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Back Button */}
        <Link to="/chains" className="inline-flex">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Chains
          </Button>
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl flex-shrink-0">
            {chain.tokenSymbol || chain.name.slice(0, 2)}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{chain.name}</h1>
              {chain.tokenSymbol && (
                <span className="text-lg text-muted-foreground">${chain.tokenSymbol}</span>
              )}
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                Rank #{rank}
              </span>
            </div>
            <p className="text-muted-foreground mt-1">
              Chain ID: {chain.chainId || "-"} • {marketShare.toFixed(2)}% of total DeFi TVL
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{formatCurrency(chain.tvl)}</p>
            <p className="text-sm text-muted-foreground">Total Value Locked</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total TVL" value={formatCurrency(chain.tvl)} icon={Layers} />
          <StatCard title="Rank" value={`#${rank}`} icon={TrendingUp} />
          <StatCard
            title="7d Change"
            value={`${tvlAnalytics?.change7d.toFixed(2) || 0}%`}
            change={tvlAnalytics?.change7d || 0}
            icon={tvlAnalytics?.change7d || 0 >= 0 ? TrendingUp : TrendingUp}
          />
          <StatCard
            title="Market Share"
            value={`${marketShare.toFixed(2)}%`}
            icon={Activity}
          />
        </div>

        {/* Chain Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Growth Score</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-primary">
                {tvlAnalytics ? Math.max(0, Math.min(100, 50 + (tvlAnalytics.change30d || 0))).toFixed(0) : "—"}
              </span>
              <span className="text-sm text-muted-foreground mb-0.5">/ 100</span>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Ecosystem Size</p>
            <p className="text-2xl font-bold">{topProtocols.length} protocols</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">DEX Activity</p>
            <p className="text-2xl font-bold">{topDexs.length} DEXs</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Stability</p>
            <p className="text-2xl font-bold">
              {tvlAnalytics?.volatility !== undefined ? (
                tvlAnalytics.volatility < 10 ? "Very Stable" : tvlAnalytics.volatility < 25 ? "Stable" : "Volatile"
              ) : "—"}
            </p>
          </div>
        </div>

        {/* TVL Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm text-muted-foreground mb-1">7-Day Growth</p>
            <p className={`text-2xl font-bold ${
              (tvlAnalytics?.change7d || 0) >= 0 ? "text-success" : "text-destructive"
            }`}>
              {tvlAnalytics?.change7d.toFixed(2) || 0}%
            </p>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm text-muted-foreground mb-1">30-Day Growth</p>
            <p className={`text-2xl font-bold ${
              (tvlAnalytics?.change30d || 0) >= 0 ? "text-success" : "text-destructive"
            }`}>
              {tvlAnalytics?.change30d.toFixed(2) || 0}%
            </p>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm text-muted-foreground mb-1">TVL Volatility</p>
            <p className="text-2xl font-bold">{tvlAnalytics?.volatility.toFixed(2) || 0}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {(tvlAnalytics?.volatility || 0) < 10 ? "Stable" : (tvlAnalytics?.volatility || 0) < 25 ? "Moderate" : "High"}
            </p>
          </div>
        </div>

        {/* TVL History Chart */}
        <div className="rounded-lg border border-border bg-card p-4 md:p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">TVL History (90 Days)</h3>
          <div className="h-[300px] md:h-[380px]">
            {historyLoading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Loading chart data...
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="chainTvlGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatCurrency(v)}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [formatCurrency(value), "TVL"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="tvl"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#chainTvlGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No TVL history available for this chain
              </div>
            )}
          </div>
        </div>

          {/* Market Share Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-lg border border-border bg-card p-4 md:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Market Share (Top 10)</h3>
            <div className="h-[300px]">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.isSelected ? "hsl(var(--primary))" : COLORS[index % COLORS.length]}
                          stroke={entry.isSelected ? "hsl(var(--primary))" : "transparent"}
                          strokeWidth={entry.isSelected ? 2 : 0}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [formatCurrency(value), "TVL"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {pieData.slice(0, 6).map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: entry.isSelected
                        ? "hsl(var(--primary))"
                        : COLORS[index % COLORS.length],
                    }}
                  />
                  <span className={entry.isSelected ? "text-primary font-medium" : "text-muted-foreground"}>
                    {entry.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Chain Info */}
          <div className="rounded-lg border border-border bg-card p-4 md:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Chain Information</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium text-foreground">{chain.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Token Symbol</span>
                <span className="font-medium text-foreground">{chain.tokenSymbol || "-"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Chain ID</span>
                <span className="font-mono text-foreground">{chain.chainId || "-"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Gecko ID</span>
                <span className="font-mono text-foreground">{chain.gecko_id || "-"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">CMC ID</span>
                <span className="font-mono text-foreground">{chain.cmcId || "-"}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Total TVL</span>
                <span className="font-mono font-bold text-primary">{formatCurrency(chain.tvl)}</span>
              </div>
            </div>

            {/* External Links */}
            <div className="mt-6 pt-4 border-t border-border">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Explore</h4>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`https://defillama.com/chain/${encodeURIComponent(chain.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    DefiLlama
                  </Button>
                </a>
                {chain.name.toLowerCase() === "x layer" || chain.name.toLowerCase() === "xlayer" ? (
                  <a
                    href="https://www.okx.com/xlayer"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      XLayer
                    </Button>
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          {/* Related Chains */}
          <div className="rounded-lg border border-border bg-card p-4 md:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Related Chains</h3>
            {relatedChains.length > 0 ? (
              <div className="space-y-3">
                {relatedChains.slice(0, 5).map((c, idx) => {
                  const relatedShare = totalTVL > 0 ? ((c.tvl / totalTVL) * 100) : 0;
                  return (
                    <Link to={`/chains/${c.name.toLowerCase().replace(/\s+/g, "-")}`} key={c.name}>
                      <div className="p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-foreground">{c.name}</span>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">#{idx + 1}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{formatCurrency(c.tvl)}</span>
                          <span className="text-muted-foreground">{relatedShare.toFixed(1)}%</span>
                        </div>
                        <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${relatedShare}%` }}
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground">No related chains</p>
            )}
          </div>
        </div>

        {/* Ecosystem Composition + Growth Velocity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ecosystem Composition */}
          <div className="rounded-lg border border-border bg-card p-4 md:p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Ecosystem Composition
            </h3>
            {(() => {
              const catMap = new Map<string, number>();
              for (const p of topProtocols) catMap.set(p.category || "Other", (catMap.get(p.category || "Other") || 0) + (p.chainTvl || 0));
              const catList = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]);
              const total = catList.reduce((a, [, v]) => a + v, 0) || 1;
              return catList.length > 0 ? (
                <div className="space-y-2">
                  {catList.slice(0, 8).map(([cat, tvl], i) => (
                    <div key={cat} className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-24 truncate">{cat}</span>
                      <div className="flex-1 h-4 bg-muted/30 rounded overflow-hidden">
                        <div className="h-full rounded" style={{ width: `${(tvl / total) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground w-14 text-right">{((tvl / total) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-muted-foreground text-sm">No category data available</p>;
            })()}
          </div>

          {/* Growth Velocity */}
          <div className="rounded-lg border border-border bg-card p-4 md:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Growth Velocity
            </h3>
            {(() => {
              const now = Date.now() / 1000;
              const withAge = topProtocols.filter((p: any) => p.listedAt);
              const last30d = withAge.filter((p: any) => now - p.listedAt < 30 * 86400).length;
              const last90d = withAge.filter((p: any) => now - p.listedAt < 90 * 86400).length;
              const last1y = withAge.filter((p: any) => now - p.listedAt < 365 * 86400).length;
              return (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs text-muted-foreground">Last 30 days</p>
                    <p className="text-2xl font-bold text-primary">{last30d} new</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Last 90 days</p>
                    <p className="text-xl font-bold">{last90d} new</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Last year</p>
                    <p className="text-xl font-bold">{last1y} new</p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Top Yield Pools on Chain */}
        {yieldPools.data && yieldPools.data.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-4 md:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sprout className="h-5 w-5 text-primary" />
              Top Yield Pools on {chain.name}
            </h3>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Pool</th>
                    <th>Project</th>
                    <th className="text-right">APY</th>
                    <th className="text-right">TVL</th>
                  </tr>
                </thead>
                <tbody>
                  {yieldPools.data.sort((a, b) => (b.apy || 0) - (a.apy || 0)).slice(0, 5).map((pool, i) => (
                    <tr key={i}>
                      <td className="font-medium text-foreground">{(pool.symbol || "").slice(0, 20)}</td>
                      <td className="text-muted-foreground">{pool.project || "—"}</td>
                      <td className="text-right font-mono text-success">{(pool.apy || 0).toFixed(2)}%</td>
                      <td className="text-right font-mono">{formatCurrency(pool.tvlUsd || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Protocols & DEXs on Chain */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-lg border border-border bg-card p-4 md:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Top Protocols on {chain.name}</h3>
            {topProtocols.length === 0 ? (
              <div className="text-muted-foreground">No protocols found for this chain.</div>
            ) : (
              <div className="space-y-2">
                {topProtocols.map((p: any, idx: number) => (
                  <div key={p.name || idx} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                        {p.logo ? <img src={p.logo} alt={p.name} className="h-8 w-8 rounded-full" loading="lazy" /> : <span>{(p.name || "?").charAt(0)}</span>}
                      </div>
                      <div>
                        <div className="font-medium text-foreground truncate max-w-[200px]">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.category || "Protocol"}</div>
                      </div>
                    </div>
                    <div className="text-right font-mono text-sm text-foreground">{formatCurrency(p.chainTvl)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-4 md:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Top DEXs on {chain.name}</h3>
            {topDexs.length === 0 ? (
              <div className="text-muted-foreground">No DEXs found for this chain.</div>
            ) : (
              <div className="space-y-2">
                {topDexs.map((d: any, idx: number) => (
                  <div key={d.name || idx} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                        {d.logo ? <img src={d.logo} alt={d.displayName || d.name} className="h-8 w-8 rounded-full" loading="lazy" /> : <span>{(d.displayName || d.name || "?").charAt(0)}</span>}
                      </div>
                      <div>
                        <div className="font-medium text-foreground truncate max-w-[200px]">{d.displayName || d.name}</div>
                        <div className="text-xs text-muted-foreground">{(d.chains || []).slice(0,3).join(", ")}</div>
                      </div>
                    </div>
                    <div className="text-right font-mono text-sm text-foreground">{formatCurrency(d.total24h)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
