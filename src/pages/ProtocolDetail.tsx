import { Layout } from "@/components/layout/Layout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import React, { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useAllProtocols, useProtocolTVLHistory, useProtocolDetails } from "@/hooks/useDefiData";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatCurrency, formatPercentage } from "@/lib/api/defillama";
import { ArrowLeft, TrendingUp, TrendingDown, Layers, ExternalLink, Globe, Shield, Twitter, Code, Lock, Zap, Award, Target, Flame, Crown, Users, BarChart3, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { CHART_TOOLTIP_STYLE, AXIS_TICK_STYLE } from "@/lib/chartStyles";
import { DateRangeSelector, DateRange } from "@/components/dashboard/DateRangeSelector";
import { useState } from "react";
import { ProDetailSection } from "@/components/dashboard/ProDetailSection";

export default function ProtocolDetail() {
  return (
    <ErrorBoundary>
      <ProtocolDetailContent />
    </ErrorBoundary>
  );
}

function ProtocolDetailContent() {
  const { slug } = useParams<{ slug: string }>();
  const { data: protocols, isLoading: protocolsLoading } = useAllProtocols();
  const { data: tvlHistory, isLoading: historyLoading } = useProtocolTVLHistory(slug || null);
  const { data: protocolDetails, isLoading: detailsLoading } = useProtocolDetails(slug || null);
  const [dateRange, setDateRange] = useState<DateRange>("90d");

  // Find protocol
  const protocol = protocols?.find((p) => p.slug === slug || p.name.toLowerCase().replace(/\s+/g, "-") === slug);

  // Safe data ensuring TVL exists before rendering composition
  const hasTVLData = protocol?.tvl && protocol.tvl > 0;

  // Format chart data (memoized + defensive) - ALWAYS CALL
  const chartData = useMemo(() => {
    try {
      const arr = Array.isArray(tvlHistory) ? tvlHistory : [];
      // guard against extremely large payloads
      const days = dateRange === "all" ? arr.length : dateRange === "1y" ? 365 : dateRange === "90d" ? 90 : dateRange === "30d" ? 30 : 7;
      const safe = arr.slice(-days);
      return safe.map((item: any) => ({
        date: isNaN(Number(item?.date)) ? "" : new Date(item.date * 1000).toLocaleDateString(),
        tvl: typeof item?.totalLiquidityUSD === "number" && !isNaN(item.totalLiquidityUSD) ? item.totalLiquidityUSD : 0,
      }));
    } catch (e) {
      console.error("Error formatting chart data:", e);
      return [];
    }
  }, [tvlHistory, dateRange]);

  // TVL Analytics - ALWAYS CALL
  const tvlAnalytics = useMemo(() => {
    if (!chartData || chartData.length < 2) return null;
    
    const current = chartData[chartData.length - 1]?.tvl || 0;
    const previous7d = chartData.length >= 7 ? chartData[chartData.length - 7]?.tvl || 0 : current;
    const previous30d = chartData.length >= 30 ? chartData[chartData.length - 30]?.tvl || 0 : current;
    const lowest = Math.min(...chartData.map(d => d.tvl));
    const highest = Math.max(...chartData.map(d => d.tvl));
    
    const change7d = previous7d !== 0 ? ((current - previous7d) / previous7d) * 100 : 0;
    const change30d = previous30d !== 0 ? ((current - previous30d) / previous30d) * 100 : 0;
    const volatility = lowest !== 0 ? ((highest - lowest) / lowest) * 100 : 0;
    
    return {
      current,
      change7d: isFinite(change7d) ? change7d : 0,
      change30d: isFinite(change30d) ? change30d : 0,
      lowest,
      highest,
      volatility: isFinite(volatility) ? volatility : 0,
      avgTVL: chartData.length > 0 ? chartData.reduce((a, d) => a + d.tvl, 0) / chartData.length : 0,
    };
  }, [chartData]);

  // Related protocols - ALWAYS CALL
  const relatedProtocols = useMemo(() => {
    if (!protocols || !protocol) return [];
    return protocols
      .filter((p) => p.category === protocol.category && p.slug !== protocol.slug)
      .sort((a, b) => (b.tvl || 0) - (a.tvl || 0))
      .slice(0, 5);
  }, [protocols, protocol]);

  // Defensive: guard against null protocol with better error handling
  if (protocolsLoading) {
    return (
      <Layout>
        <div className="space-y-6 animate-fade-in">
          <div className="skeleton h-8 w-48" />
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

  if (!protocol) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Protocol not found</h2>
          <p className="text-muted-foreground mb-4">The requested protocol could not be found.</p>
          <Link to="/protocols">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Protocols
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
        <Link to="/protocols" className="inline-flex">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Protocols
          </Button>
        </Link>

        {/* Protocol Header */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {protocol.logo ? (
            <img
              src={protocol.logo}
              alt={protocol.name}
              loading="lazy"
              className="h-16 w-16 rounded-full bg-muted flex-shrink-0"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl flex-shrink-0">
              {protocol.name.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{protocol.name}</h1>
              {protocol.symbol && (
                <span className="text-lg text-muted-foreground">${protocol.symbol}</span>
              )}
              <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">
                {protocol.category || "DeFi"}
              </span>
            </div>
            <p className="text-muted-foreground mt-2 text-sm line-clamp-2">
              {protocol.description || `${protocol.name} is a ${protocol.category || 'DeFi'} protocol.`}
            </p>
            {/* Links */}
            <div className="flex flex-wrap gap-3 mt-3">
              {protocol.url && (
                <a href={protocol.url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    <Globe className="h-4 w-4 mr-2" />
                    Website
                  </Button>
                </a>
              )}
              {protocol.twitter && (
                <a href={`https://twitter.com/${protocol.twitter}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    <Twitter className="h-4 w-4 mr-2" />
                    Twitter
                  </Button>
                </a>
              )}
              {protocol.audits && (
                <Button variant="outline" size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Audited
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Value Locked"
            value={formatCurrency(protocol.tvl || 0)}
            icon={Layers}
          />
          <StatCard
            title="24h Change"
            value={formatPercentage(typeof protocol.change_1d === "number" ? protocol.change_1d : 0)}
            change={typeof protocol.change_1d === "number" ? protocol.change_1d : 0}
            icon={typeof protocol.change_1d === "number" && protocol.change_1d >= 0 ? TrendingUp : TrendingDown}
          />
          <StatCard
            title="7d Change"
            value={formatPercentage(typeof protocol.change_7d === "number" ? protocol.change_7d : 0)}
            change={typeof protocol.change_7d === "number" ? protocol.change_7d : 0}
            icon={typeof protocol.change_7d === "number" && protocol.change_7d >= 0 ? TrendingUp : TrendingDown}
          />
          {protocol.mcap ? (
            <StatCard
              title="Market Cap"
              value={formatCurrency(protocol.mcap)}
              icon={TrendingUp}
            />
          ) : (
            <StatCard
              title="1h Change"
              value={formatPercentage(typeof protocol.change_1h === "number" ? protocol.change_1h : 0)}
              change={typeof protocol.change_1h === "number" ? protocol.change_1h : 0}
              icon={typeof protocol.change_1h === "number" && protocol.change_1h >= 0 ? TrendingUp : TrendingDown}
            />
          )}
        </div>

        {/* Performance Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Performance Score</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-primary">
                {tvlAnalytics ? Math.max(0, Math.min(100, 50 + (tvlAnalytics.change7d || 0))).toFixed(0) : "—"}
              </span>
              <span className="text-sm text-muted-foreground mb-0.5">/ 100</span>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Stability</p>
            <p className="text-2xl font-bold">
              {tvlAnalytics?.volatility !== undefined ? (
                tvlAnalytics.volatility < 15 ? "High" : tvlAnalytics.volatility < 40 ? "Medium" : "Low"
              ) : "—"}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Trend</p>
            <div className="flex items-center gap-2">
              {tvlAnalytics?.change30d !== undefined ? (
                <>
                  {tvlAnalytics.change30d >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-success" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-destructive" />
                  )}
                  <span className={cn(
                    "text-2xl font-bold",
                    tvlAnalytics.change30d >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {tvlAnalytics.change30d >= 0 ? "Up" : "Down"}
                  </span>
                </>
              ) : <span className="text-2xl font-bold">—</span>}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Category Rank</p>
            <p className="text-2xl font-bold">
              #{relatedProtocols.findIndex((p) => (p.tvl || 0) < (protocol.tvl || 0)) + 1 || "—"}
            </p>
          </div>
        </div>

        {/* TVL Composition Breakdown */}
        {hasTVLData && (protocol.pool2 || protocol.staking) && (
          <div className="rounded-lg border border-border bg-card p-4 md:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">TVL Composition</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Composition Cards */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm text-muted-foreground">Core TVL</p>
                    <p className="font-mono font-medium text-foreground">
                      {formatCurrency((protocol.tvl - (protocol.pool2 || 0) - (protocol.staking || 0)) || 0)}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {(((protocol.tvl - (protocol.pool2 || 0) - (protocol.staking || 0)) / protocol.tvl) * 100).toFixed(1)}%
                  </span>
                </div>
                {protocol.pool2 ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm text-muted-foreground">Pool2 (LP Tokens)</p>
                      <p className="font-mono font-medium text-foreground">{formatCurrency(protocol.pool2)}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {((protocol.pool2 / protocol.tvl) * 100).toFixed(1)}%
                    </span>
                  </div>
                ) : null}
                {protocol.staking ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm text-muted-foreground">Staking</p>
                      <p className="font-mono font-medium text-foreground">{formatCurrency(protocol.staking)}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {((protocol.staking / protocol.tvl) * 100).toFixed(1)}%
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Pie Chart */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    {(() => {
                      const pieData = [
                        { name: "Core", value: (protocol.tvl - (protocol.pool2 || 0) - (protocol.staking || 0)) || 0 },
                        ...(protocol.pool2 ? [{ name: "Pool2", value: protocol.pool2 }] : []),
                        ...(protocol.staking ? [{ name: "Staking", value: protocol.staking }] : []),
                      ];
                      const fills = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))"];

                      return (
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={fills[i % fills.length]} />
                          ))}
                        </Pie>
                      );
                    })()}
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TVL Chart */}
        <div className="rounded-lg border border-border bg-card p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold text-foreground">TVL History</h2>
            <DateRangeSelector value={dateRange} onChange={setDateRange} />
          </div>
          <div className="h-[300px] md:h-[400px]">
            {historyLoading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Loading chart data...
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={AXIS_TICK_STYLE}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={AXIS_TICK_STYLE}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatCurrency(value)}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    formatter={(value: number) => [formatCurrency(value), "TVL"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="tvl"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#tvlGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No TVL history available
              </div>
            )}
          </div>
        </div>

        {/* Chain TVLs */}
        {protocol.chainTvls && Object.keys(protocol.chainTvls).length > 0 && (
          <div className="rounded-lg border border-border bg-card p-4 md:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">TVL by Chain</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chain Grid */}
              <div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
                  {(() => {
                    try {
                      return Object.entries(protocol.chainTvls || {})
                        .filter(([, tvl]) => typeof tvl === 'number' && !isNaN(tvl as number))
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .slice(0, 6)
                        .map(([chain, tvl]) => (
                          <div key={chain} className="p-4 rounded-lg bg-gradient-to-br from-muted/50 to-muted/20 border border-border/50 hover:border-primary/50 transition-colors">
                            <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">{chain}</p>
                            <p className="font-mono font-bold text-foreground text-lg">{formatCurrency(tvl as number)}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {((tvl as number / protocol.tvl) * 100).toFixed(1)}% of total
                            </p>
                          </div>
                        ));
                    } catch {
                      return null;
                    }
                  })()}
                </div>
              </div>

              {/* Bar Chart */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(() => {
                      try {
                        return Object.entries(protocol.chainTvls || {})
                          .filter(([, tvl]) => typeof tvl === 'number' && !isNaN(tvl as number))
                          .map(([k, v]) => ({ chain: k, tvl: v as number }))
                          .sort((a, b) => b.tvl - a.tvl)
                          .slice(0, 6);
                      } catch {
                        return [];
                      }
                    })()}
                    margin={{ left: -20, right: 10, top: 10, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="chain" 
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tickFormatter={(v) => `$${(v / 1e6).toFixed(0)}M`} 
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="tvl" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Additional DeFiLlama details */}
        {protocolDetails && (
          <div className="space-y-6">
            {/* Core Metadata */}
            <div className="rounded-lg border border-border bg-card p-4 md:p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Protocol Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <strong className="text-sm text-muted-foreground block mb-1">Module</strong>
                    <div className="text-foreground font-mono text-sm">{protocolDetails.module || 'N/A'}</div>
                  </div>
                  <div>
                    <strong className="text-sm text-muted-foreground block mb-1">Listed On</strong>
                    <div className="text-foreground">
                      {protocolDetails.listedAt 
                        ? new Date(protocolDetails.listedAt * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                        : 'N/A'}
                    </div>
                  </div>
                  {protocolDetails.audits && (
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
                  {protocolDetails.forkedFrom && protocolDetails.forkedFrom.length > 0 && (
                    <div>
                      <strong className="text-sm text-muted-foreground block mb-2">Forked From</strong>
                      <div className="flex flex-wrap gap-2">
                        {protocolDetails.forkedFrom.map((fork: string) => (
                          <span key={fork} className="px-2 py-1 rounded bg-secondary/30 text-secondary-foreground text-xs">
                            {fork}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {protocolDetails.gecko_id && (
                    <div>
                      <strong className="text-sm text-muted-foreground block mb-1">CoinGecko</strong>
                      <a 
                        href={`https://www.coingecko.com/en/coins/${protocolDetails.gecko_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 text-sm"
                      >
                        {protocolDetails.gecko_id}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Methodology */}
            {protocolDetails.methodology && (
              <div className="rounded-lg border border-border bg-card p-4 md:p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Methodology
                </h3>
                <p className="text-foreground text-sm leading-relaxed line-clamp-6">
                  {protocolDetails.methodology}
                </p>
              </div>
            )}

            {/* Contract Addresses */}
            {protocolDetails.addresses && protocolDetails.addresses.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-4 md:p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Contract Addresses
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {protocolDetails.addresses.slice(0, 12).map((addr: string, idx: number) => (
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
                {protocolDetails.addresses.length > 12 && (
                  <p className="text-xs text-muted-foreground mt-3">
                    +{protocolDetails.addresses.length - 12} more addresses
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Additional Info */}
        {/* TVL Analytics Section */}
        {tvlAnalytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Analytics Card */}
            <Card className="p-4 md:p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                TVL Analytics
              </h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">7-Day Growth</span>
                    <span className={cn(
                      "text-2xl font-bold",
                      tvlAnalytics.change7d >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {tvlAnalytics.change7d.toFixed(2)}%
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${Math.min(Math.max((tvlAnalytics.change7d || 0) + 50, 0), 100)}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Flame className="h-4 w-4" />
                      30-Day Growth
                    </span>
                    <span className={cn(
                      "font-mono font-bold",
                      tvlAnalytics.change30d >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {tvlAnalytics.change30d.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Average TVL
                    </span>
                    <span className="font-mono font-bold">{formatCurrency(tvlAnalytics.avgTVL)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      Peak TVL
                    </span>
                    <span className="font-mono font-bold">{formatCurrency(tvlAnalytics.highest)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Volatility
                    </span>
                    <span className={cn(
                      "font-mono font-bold",
                      tvlAnalytics.volatility > 30 ? "text-destructive" : "text-success"
                    )}>
                      {tvlAnalytics.volatility.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* TVL Range Card */}
            <Card className="p-4 md:p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                TVL Range
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-muted-foreground">Current TVL</span>
                    <span className="text-2xl font-bold text-primary">{formatCurrency(tvlAnalytics.current)}</span>
                  </div>
                  <div className="h-3 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${tvlAnalytics.highest !== 0 ? (tvlAnalytics.current / tvlAnalytics.highest) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Lowest</p>
                    <p className="font-mono font-bold">{formatCurrency(tvlAnalytics.lowest)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Highest</p>
                    <p className="font-mono font-bold">{formatCurrency(tvlAnalytics.highest)}</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-2">TVL Stability Score</p>
                  <div className="flex items-center justify-between">
                    <div className="h-2 flex-1 bg-secondary rounded-full overflow-hidden mr-3">
                      <div
                        className={cn(
                          "h-full",
                          tvlAnalytics.volatility < 20 ? "bg-success" : tvlAnalytics.volatility < 40 ? "bg-amber-500" : "bg-destructive"
                        )}
                        style={{
                          width: `${100 - Math.min(tvlAnalytics.volatility, 100)}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-mono font-bold">{(100 - Math.min(tvlAnalytics.volatility, 100)).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chains */}
          {protocol.chains && protocol.chains.length > 0 && (
            <Card className="p-4 md:p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Deployed Chains
              </h3>
              <div className="flex flex-wrap gap-2">
                {protocol.chains.map((chain) => (
                  <Badge
                    key={chain}
                    variant={chain.toLowerCase().includes("xlayer") ? "default" : "secondary"}
                  >
                    {chain}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Oracles */}
          {protocol.oracles && protocol.oracles.length > 0 && (
            <Card className="p-4 md:p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Oracles Used
              </h3>
              <div className="flex flex-wrap gap-2">
                {protocol.oracles.map((oracle) => (
                  <Badge key={oracle} variant="secondary">
                    {oracle}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Additional Protocol Stats */}
          <Card className="p-4 md:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Protocol Details
            </h3>
            <div className="space-y-3">
              {protocol.category && (
                <div className="flex justify-between items-center pb-3 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Category</span>
                  <Badge>{protocol.category}</Badge>
                </div>
              )}
              {protocol.symbol && (
                <div className="flex justify-between items-center pb-3 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Symbol</span>
                  <span className="font-mono font-bold">${protocol.symbol}</span>
                </div>
              )}
              {protocol.chain && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Primary Chain</span>
                  <span className="font-medium text-foreground">{protocol.chain}</span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Related Protocols */}
        {relatedProtocols.length > 0 && (
          <Card className="p-4 md:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Similar Protocols in {protocol.category || "DeFi"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedProtocols.map((proto) => (
                <Link key={proto.slug} to={`/protocols/${proto.slug}`}>
                  <div className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {proto.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{proto.category}</p>
                      </div>
                      {proto.logo && (
                        <img
                          src={proto.logo}
                          alt={proto.name}
                          className="h-8 w-8 rounded-full bg-muted"
                          loading="lazy"
                        />
                      )}
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-sm text-muted-foreground">TVL</span>
                      <span className="font-mono font-bold">{formatCurrency(proto.tvl || 0)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
           </Card>
        )}

        {/* PRO Analytics Sections */}
        <ProDetailSection title="Fee Revenue Efficiency">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Revenue per $1 TVL</p>
              <p className="text-2xl font-bold text-primary">
                {protocol.tvl && (protocol as any).fees_24h
                  ? `$${((protocol as any).fees_24h / protocol.tvl).toFixed(6)}`
                  : "N/A"}
              </p>
            </div>
            <div className="rounded-lg bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Annualized Revenue</p>
              <p className="text-2xl font-bold">
                {(protocol as any).fees_24h ? formatCurrency(((protocol as any).fees_24h || 0) * 365) : "N/A"}
              </p>
            </div>
            <div className="rounded-lg bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Fee/TVL Ratio (bps)</p>
              <p className="text-2xl font-bold">
                {protocol.tvl && (protocol as any).fees_24h
                  ? `${(((protocol as any).fees_24h / protocol.tvl) * 10000).toFixed(2)}`
                  : "N/A"}
              </p>
            </div>
          </div>
        </ProDetailSection>

        {protocolDetails?.chainTvls && Object.keys(protocolDetails.chainTvls).length > 0 && (
          <ProDetailSection title="Cross-Chain TVL Breakdown">
            <div className="space-y-2">
              {Object.entries(protocolDetails.chainTvls)
                .filter(([_, val]: [string, any]) => typeof val === "number" || (val && typeof val === "object" && val.tvl))
                .map(([chain, val]: [string, any]) => {
                  const tvlVal = typeof val === "number" ? val : val?.tvl || 0;
                  const pct = protocol.tvl ? (tvlVal / protocol.tvl) * 100 : 0;
                  return { chain, tvl: tvlVal, pct };
                })
                .sort((a, b) => b.tvl - a.tvl)
                .slice(0, 10)
                .map((d, i) => (
                  <div key={d.chain} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-6">#{i + 1}</span>
                    <span className="text-sm text-foreground w-24 truncate">{d.chain}</span>
                    <div className="flex-1 h-3 bg-muted/30 rounded overflow-hidden">
                      <div className="h-full bg-primary rounded" style={{ width: `${Math.min(d.pct, 100)}%` }} />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground w-14 text-right">{d.pct.toFixed(1)}%</span>
                    <span className="text-xs font-mono text-foreground w-20 text-right">{formatCurrency(d.tvl)}</span>
                  </div>
                ))}
            </div>
          </ProDetailSection>
        )}

        {relatedProtocols.length > 0 && (
          <ProDetailSection title="Competitor Comparison">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Protocol</th>
                    <th className="text-right">TVL</th>
                    <th className="text-right">24h Change</th>
                    <th className="text-right">7d Change</th>
                    <th className="text-right">Chains</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-primary/5">
                    <td className="font-medium text-primary">{protocol.name} (this)</td>
                    <td className="text-right font-mono">{formatCurrency(protocol.tvl || 0)}</td>
                    <td className={cn("text-right font-mono", (protocol.change_1d || 0) >= 0 ? "text-success" : "text-destructive")}>
                      {formatPercentage(protocol.change_1d || 0)}
                    </td>
                    <td className={cn("text-right font-mono", (protocol.change_7d || 0) >= 0 ? "text-success" : "text-destructive")}>
                      {formatPercentage(protocol.change_7d || 0)}
                    </td>
                    <td className="text-right">{protocol.chains?.length || 0}</td>
                  </tr>
                  {relatedProtocols.map((p) => (
                    <tr key={p.slug}>
                      <td className="font-medium text-foreground">{p.name}</td>
                      <td className="text-right font-mono">{formatCurrency(p.tvl || 0)}</td>
                      <td className={cn("text-right font-mono", (p.change_1d || 0) >= 0 ? "text-success" : "text-destructive")}>
                        {formatPercentage(p.change_1d || 0)}
                      </td>
                      <td className={cn("text-right font-mono", (p.change_7d || 0) >= 0 ? "text-success" : "text-destructive")}>
                        {formatPercentage(p.change_7d || 0)}
                      </td>
                      <td className="text-right">{p.chains?.length || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ProDetailSection>
        )}
      </div>
    </Layout>
  );
}
