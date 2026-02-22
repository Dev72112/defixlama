import { Layout } from "@/components/layout/Layout";
import { useParams, Link } from "react-router-dom";
import { useAllDexVolumes, useDexDetails } from "@/hooks/useDefiData";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatCurrency, formatPercentage } from "@/lib/api/defillama";
import { ArrowLeft, Activity, TrendingUp, TrendingDown, BarChart3, ExternalLink, Globe, Code, Lock, Twitter, Shield, Award, Target, Flame, Crown, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

export default function DexDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: allDexs, isLoading } = useAllDexVolumes();
  const { data: dexDetails, isLoading: detailsLoading } = useDexDetails(id?.toLowerCase() || null);

  // Find DEX from all dexs
  const dex = useMemo(() => {
    if (!id || !allDexs) return null;
    const searchId = id.toLowerCase();
    return allDexs.find(
      (d) =>
        d.name.toLowerCase() === searchId ||
        (d.displayName || "").toLowerCase() === searchId ||
        d.name.toLowerCase().replace(/\s+/g, "-") === searchId
    ) || null;
  }, [allDexs, id]);

  // Calculate rank among all DEXes
  const rank = useMemo(() => {
    if (!allDexs || !dex) return 0;
    const sorted = [...allDexs].sort((a, b) => (b.total24h || 0) - (a.total24h || 0));
    return sorted.findIndex((d) => d.name === dex.name) + 1;
  }, [allDexs, dex]);

  // Volume comparison data
  const volumeData = useMemo(() => {
    if (!dex) return [];
    return [
      { name: "24h", volume: dex.total24h || 0 },
      { name: "7d", volume: dex.total7d || 0 },
      { name: "30d", volume: dex.total30d || 0 },
      { name: "All Time", volume: dex.totalAllTime || 0 },
    ];
  }, [dex]);

  // Chain distribution pie chart
  const chainData = useMemo(() => {
    if (!dex?.chains) return [];
    return dex.chains.map((chain, index) => ({
      name: chain,
      value: 1,
    }));
  }, [dex]);

  // Check if DEX has volume data (detects enriched protocols without volume fields)
  const hasVolumeData = useMemo(() => {
    if (!dex) return false;
    // A DEX is considered to have volume data if any of these are non-zero
    return (dex.total24h || 0) > 0 || (dex.total7d || 0) > 0 || (dex.total30d || 0) > 0;
  }, [dex]);

  // Volume Analytics - ALWAYS CALL
  const volumeAnalytics = useMemo(() => {
    if (!dex || !hasVolumeData) return null;
    const current24h = dex.total24h || 0;
    const current7d = dex.total7d || 0;
    const avg7d = current7d / 7;
    
    // Safe division by zero checks
    const growth7d = avg7d !== 0 ? ((current24h - avg7d) / avg7d) * 100 : 0;
    const volatility = avg7d !== 0 ? ((current24h - avg7d) / avg7d) * 100 : 0;
    
    const ranking = allDexs ? allDexs.findIndex((d) => d.name === dex.name) : 0;
    const percentile = allDexs && allDexs.length > 0 ? ((allDexs.length - ranking) / allDexs.length) * 100 : 0;
    
    return {
      growth7d: isFinite(growth7d) ? growth7d : 0,
      percentile: isFinite(percentile) ? percentile : 0,
      avgDaily: isFinite(avg7d) ? avg7d : 0,
      volatility: isFinite(volatility) ? volatility : 0,
    };
  }, [dex, allDexs, hasVolumeData]);

  // Related DEXs - ALWAYS CALL
  const relatedDexs = useMemo(() => {
    if (!allDexs || !dex) return [];
    return allDexs
      .filter((d) => d.name !== dex.name)
      .sort((a, b) => (b.total24h || 0) - (a.total24h || 0))
      .slice(0, 5);
  }, [allDexs, dex]);

  // Comparison data - ALWAYS CALL
  const comparisonData = useMemo(() => {
    if (!allDexs || !dex) return [];
    const sorted = [...allDexs]
      .sort((a, b) => (b.total24h || 0) - (a.total24h || 0))
      .slice(0, 6);
    
    return sorted.map((d) => ({
      name: (d.displayName || d.name || "").substring(0, 12),
      volume: d.total24h || 0,
      isCurrentItem: d.name === dex.name,
    }));
  }, [allDexs, dex]);

  const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--muted))",
  ];

  const change1d = typeof dex?.change_1d === "number" ? dex.change_1d : 0;
  const change7d = typeof dex?.change_7d === "number" ? dex.change_7d : 0;

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6 animate-fade-in">
          <div className="skeleton h-8 w-32" />
          <div className="skeleton h-16 w-64" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-lg" />
            ))}
          </div>
          <div className="skeleton h-[300px] rounded-lg" />
        </div>
      </Layout>
    );
  }

  if (!dex) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Activity className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">DEX not found</h2>
          <p className="text-muted-foreground mb-4">
            The DEX "{id}" could not be found.
          </p>
          <Link to="/dexs">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to DEXs
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
        <Link to="/dexs" className="inline-flex">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to DEXs
          </Button>
        </Link>

        {/* Enhanced Header */}
        <div className="rounded-xl border border-border bg-gradient-to-br from-card to-card/50 p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            <div>
              {dex.logo ? (
                <img
                  src={dex.logo}
                  alt={dex.displayName || dex.name}
                  className="h-20 w-20 rounded-full bg-muted flex-shrink-0 shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-3xl flex-shrink-0 shadow-lg">
                  {(dex.displayName || dex.name || "?").charAt(0)}
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">{dex.displayName || dex.name}</h1>
                {rank > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    Rank #{rank}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mb-4">
                Decentralized exchange analytics and volume tracking
              </p>
              
              {hasVolumeData ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">24h Volume</p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(dex.total24h || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">7d Avg</p>
                    <p className="text-xl font-bold">{formatCurrency((dex.total7d || 0) / 7)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">24h Change</p>
                    <p className={cn(
                      "text-xl font-bold",
                      change1d >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {formatPercentage(change1d)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Chains</p>
                    <p className="text-xl font-bold text-amber-500">{dex.chains?.length || 0}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    <span className="font-semibold">Volume data not available</span> - This protocol is still being indexed by DefiLlama or doesn't have volume tracking enabled.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {hasVolumeData ? (
          <>
            {/* Enhanced Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <StatCard
                title="24h Volume"
                value={formatCurrency(dex.total24h || 0)}
                icon={Activity}
              />
              <StatCard
                title="7d Avg Daily"
                value={formatCurrency((dex.total7d || 0) / 7)}
                icon={BarChart3}
              />
              <StatCard
                title="Growth (7d)"
                value={`${volumeAnalytics?.growth7d.toFixed(2) || 0}%`}
                change={volumeAnalytics?.growth7d || 0}
                icon={volumeAnalytics?.growth7d || 0 >= 0 ? TrendingUp : TrendingDown}
              />
              <StatCard
                title="DEX Rank"
                value={`#${rank}`}
                icon={Award}
              />
            </div>

            {/* Volume Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Volume Score</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-primary">
                    {volumeAnalytics?.percentile?.toFixed(0) || "—"}
                  </span>
                  <span className="text-sm text-muted-foreground mb-0.5">/ 100</span>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Activity Level</p>
                <p className="text-2xl font-bold">
                  {(dex.total24h || 0) > 10000000 ? "Very High" : (dex.total24h || 0) > 1000000 ? "High" : (dex.total24h || 0) > 100000 ? "Medium" : "Low"}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Momentum</p>
                <div className="flex items-center gap-2">
                  {change1d >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-success" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-destructive" />
                  )}
                  <span className={cn(
                    "text-2xl font-bold",
                    change1d >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {change1d >= 0 ? "Positive" : "Negative"}
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Chain Coverage</p>
                <p className="text-2xl font-bold">{dex.chains?.length || 0} chains</p>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-6">
            <div className="flex items-start gap-4">
              <div className="bg-amber-100 dark:bg-amber-800/40 rounded-full p-3 flex-shrink-0">
                <Activity className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-1">
                  Volume Data Unavailable
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  This protocol doesn't currently have volume data from DefiLlama. It may have been recently added to XLayer or doesn't have volume tracking enabled yet.
                </p>
              </div>
            </div>
          </div>
        )}

        {hasVolumeData && (
          <>
            {/* Volume Overview Chart */}
            <Card className="p-4 md:p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Volume Timeline
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volumeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `$${(v / 1e9).toFixed(1)}B`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [formatCurrency(value), "Volume"]}
                    />
                    <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Comparison and Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Volume Comparison */}
              <Card className="p-4 md:p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  DEX Volume Ranking
                </h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        type="number"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `$${(v / 1e9).toFixed(1)}B`}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        width={80}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [formatCurrency(value), "24h Volume"]}
                      />
                      <Bar 
                        dataKey="volume" 
                        fill="hsl(var(--primary))" 
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Analytics Card */}
              <Card className="p-4 md:p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Volume Analytics
                </h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">7-Day Growth Rate</span>
                      <span className={cn(
                        "text-2xl font-bold",
                        (volumeAnalytics?.growth7d || 0) >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {volumeAnalytics?.growth7d.toFixed(2) || 0}%
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.min(Math.max((volumeAnalytics?.growth7d || 0) + 50, 0), 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Flame className="h-4 w-4" />
                    Percentile Rank
                  </span>
                  <span className="font-mono font-bold">{volumeAnalytics?.percentile.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Avg Daily Volume
                  </span>
                  <span className="font-mono font-bold">{formatCurrency(volumeAnalytics?.avgDaily || 0)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Volatility Index
                  </span>
                  <span className={cn(
                    "font-mono font-bold",
                    (volumeAnalytics?.volatility || 0) > 30 ? "text-destructive" : "text-success"
                  )}>
                    {volumeAnalytics?.volatility.toFixed(2) || 0}%
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
          </>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Supported Chains */}
          {dex.chains && dex.chains.length > 0 && (
            <Card className="p-4 md:p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Supported Chains ({dex.chains.length})
              </h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chainData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {chainData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {dex.chains.map((chain, index) => (
                  <Badge
                    key={chain}
                    style={{
                      backgroundColor: `${COLORS[index % COLORS.length]}20`,
                      color: COLORS[index % COLORS.length],
                    }}
                  >
                    {chain}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* DEX Info */}
          <Card className="p-4 md:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Volume Details
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">24h Volume</span>
                <span className="font-mono font-bold text-primary">{formatCurrency(dex.total24h || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">7d Total</span>
                <span className="font-mono font-bold">{formatCurrency(dex.total7d || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">30d Total</span>
                <span className="font-mono font-bold">{formatCurrency(dex.total30d || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">All Time Total</span>
                <span className="font-mono font-bold">{formatCurrency(dex.totalAllTime || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-muted-foreground">Supported Chains</span>
                <span className="font-bold">{dex.chains?.length || 0}</span>
              </div>
            </div>

            {/* External Links */}
            <div className="mt-6 pt-4 border-t border-border">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Explore</h4>
              <a
                href={`https://defillama.com/dexs/${encodeURIComponent(dex.name.toLowerCase())}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on DefiLlama
                </Button>
              </a>
            </div>
          </Card>
        </div>

        {/* Related DEXs + Market Share */}
        {relatedDexs.length > 0 && (
          <Card className="p-4 md:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Other Top DEXs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedDexs.map((d) => {
                const totalVol = allDexs?.reduce((a, dx) => a + (dx.total24h || 0), 0) || 1;
                const share = ((d.total24h || 0) / totalVol * 100);
                return (
                  <Link key={d.name} to={`/dexs/${(d.displayName || d.name).toLowerCase().replace(/\s+/g, '-')}`}>
                    <div className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {d.displayName || d.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{d.chains?.length || 0} chains • {share.toFixed(1)}% share</p>
                        </div>
                        {d.logo && (
                          <img src={d.logo} alt={d.name} className="h-8 w-8 rounded-full bg-muted"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        )}
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-sm text-muted-foreground">24h Volume</span>
                        <span className="font-mono font-bold">{formatCurrency(d.total24h || 0)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>
        )}

        {/* Market Share Stat */}
        {hasVolumeData && allDexs && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 md:p-6">
            <h3 className="text-base font-semibold text-foreground mb-2">Market Share</h3>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-primary">
                {((dex.total24h || 0) / (allDexs.reduce((a, d) => a + (d.total24h || 0), 0) || 1) * 100).toFixed(2)}%
              </span>
              <span className="text-muted-foreground text-sm">of total DEX volume across all tracked protocols</span>
            </div>
          </div>
        )}

        {/* Additional DEX Details from API */}
        {dexDetails && (
          <div className="space-y-6">
            {/* Core Metadata */}
            <Card className="p-4 md:p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                DEX Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <strong className="text-sm text-muted-foreground block mb-1">Module</strong>
                    <div className="text-foreground font-mono text-sm">{dexDetails.module || 'N/A'}</div>
                  </div>
                  <div>
                    <strong className="text-sm text-muted-foreground block mb-1">Listed On</strong>
                    <div className="text-foreground">
                      {dexDetails.listedAt 
                        ? new Date(dexDetails.listedAt * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                        : 'N/A'}
                    </div>
                  </div>
                  {dexDetails.audits && (
                    <div>
                      <strong className="text-sm text-muted-foreground block mb-1">Audit Status</strong>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-500" />
                        <span className="text-foreground">Audited</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {dexDetails.forkedFrom && dexDetails.forkedFrom.length > 0 && (
                    <div>
                      <strong className="text-sm text-muted-foreground block mb-2">Forked From</strong>
                      <div className="flex flex-wrap gap-2">
                        {dexDetails.forkedFrom.map((fork: string) => (
                          <Badge key={fork} variant="secondary">{fork}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {dexDetails.gecko_id && (
                    <div>
                      <strong className="text-sm text-muted-foreground block mb-1">CoinGecko</strong>
                      <a 
                        href={`https://www.coingecko.com/en/coins/${dexDetails.gecko_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 text-sm"
                      >
                        {dexDetails.gecko_id}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Methodology */}
            {dexDetails.methodology && (
              <Card className="p-4 md:p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Methodology
                </h3>
                <p className="text-foreground text-sm leading-relaxed line-clamp-6">
                  {dexDetails.methodology}
                </p>
              </Card>
            )}

            {/* Contract Addresses */}
            {dexDetails.addresses && dexDetails.addresses.length > 0 && (
              <Card className="p-4 md:p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Contract Addresses
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {dexDetails.addresses.slice(0, 12).map((addr: string, idx: number) => (
                    <a
                      key={addr}
                      href={`https://www.okx.com/explorer/xlayer/address/${addr}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded bg-muted/40 hover:bg-muted/60 transition-colors group"
                      title={addr}
                    >
                      <div className="flex items-center gap-2 justify-between">
                        <span className="font-mono text-xs text-muted-foreground group-hover:text-foreground truncate">
                          {addr.slice(0, 10)}...{addr.slice(-8)}
                        </span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      </div>
                    </a>
                  ))}
                </div>
                {dexDetails.addresses.length > 12 && (
                  <p className="text-xs text-muted-foreground mt-3">
                    +{dexDetails.addresses.length - 12} more addresses
                  </p>
                )}
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
