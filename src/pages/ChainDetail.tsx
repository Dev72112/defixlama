import { Layout } from "@/components/layout/Layout";
import { useParams, Link } from "react-router-dom";
import { useChainsTVL, useChainTVLHistory, useAllProtocols, useAllDexVolumes } from "@/hooks/useDefiData";
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
import { ArrowLeft, Globe, Layers, TrendingUp, Activity, ExternalLink } from "lucide-react";
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
          <StatCard title="Market Share" value={`${marketShare.toFixed(2)}%`} icon={Activity} />
          <StatCard title="Gecko ID" value={chain.gecko_id || "-"} icon={Globe} />
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
        </div>

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
                        {p.logo ? (
                          <img src={p.logo} alt={p.name} className="h-8 w-8 rounded-full" loading="lazy" />
                        ) : (
                          <span>{(p.name || "?").charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-foreground truncate max-w-[200px]">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.module || "Protocol"}</div>
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
                        {d.logo ? (
                          <img src={d.logo} alt={d.displayName || d.name} className="h-8 w-8 rounded-full" loading="lazy" />
                        ) : (
                          <span>{(d.displayName || d.name || "?").charAt(0)}</span>
                        )}
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
