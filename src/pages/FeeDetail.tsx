import { Layout } from "@/components/layout/Layout";
import { useParams, Link } from "react-router-dom";
import { useFeesData, useProtocolDetails, useAllProtocols } from "@/hooks/useDefiData";
import { StatCard } from "@/components/dashboard/StatCard";
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, DollarSign, BarChart3, ExternalLink, Award, Zap, Target, Flame, Crown, Users, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercentage } from "@/lib/api/defillama";
import { useMemo } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { CHART_TOOLTIP_STYLE, AXIS_TICK_STYLE } from "@/lib/chartStyles";
import { ProDetailSection } from "@/components/dashboard/ProDetailSection";

export default function FeeDetail() {
  return (
    <ErrorBoundary>
      <FeeDetailContent />
    </ErrorBoundary>
  );
}

function FeeDetailContent() {
  const { id } = useParams<{ id: string }>();
  const { data: fees, isLoading } = useFeesData();
  const { data: allProtocols } = useAllProtocols();

  // Better matching logic for finding the fee item
  const item = useMemo(() => {
    if (!fees || !id) return null;
    const searchId = id.toLowerCase();
    
    return fees.find((f: any) => {
      const name = (f.name || "").toLowerCase();
      const displayName = (f.displayName || "").toLowerCase();
      const slug = (f.slug || "").toLowerCase();
      const nameSlug = name.replace(/\s+/g, "-");
      const displayNameSlug = displayName.replace(/\s+/g, "-");
      
      return (
        name === searchId ||
        displayName === searchId ||
        slug === searchId ||
        nameSlug === searchId ||
        displayNameSlug === searchId
      );
    });
  }, [fees, id]);

  const protocolSlug = useMemo(() => {
    return item?.slug || item?.name?.toLowerCase().replace(/\s+/g, "-") || null;
  }, [item]);
  
  const { data: protoDetails } = useProtocolDetails(protocolSlug);

  // Calculate rank
  const rank = useMemo(() => {
    if (!fees || !item) return 0;
    const sorted = [...fees].sort((a, b) => (b.total24h || 0) - (a.total24h || 0));
    return sorted.findIndex((f: any) => f.name === item.name) + 1;
  }, [fees, item]);

  // Volume comparison data
  const feeData = useMemo(() => {
    if (!item) return [];
    return [
      { name: "24h", fees: item.total24h || 0 },
      { name: "7d", fees: item.total7d || 0 },
      { name: "30d", fees: item.total30d || 0 },
      { name: "All Time", fees: item.totalAllTime || 0 },
    ];
  }, [item]);

  // Fee comparison with other protocols
  const comparisonData = useMemo(() => {
    if (!fees || !item) return [];
    const sorted = [...fees]
      .sort((a, b) => (b.total24h || 0) - (a.total24h || 0))
      .slice(0, 6);
    
    return sorted.map((f) => ({
      name: (f.displayName || f.name || "").substring(0, 12),
      fees: f.total24h || 0,
      isCurrentItem: f.name === item.name,
    }));
  }, [fees, item]);

  // Calculate analytics
  const feeAnalytics = useMemo(() => {
    if (!item) return null;
    const current24h = item.total24h || 0;
    const current7d = item.total7d || 0;
    const avg7d = current7d / 7;
    
    // Safe division by zero checks
    const growth7d = avg7d !== 0 ? ((current24h - avg7d) / avg7d) * 100 : 0;
    const volatility = avg7d !== 0 ? ((current24h - avg7d) / avg7d) * 100 : 0;
    
    const ranking = fees?.findIndex((f) => f.name === item.name) || 0;
    const percentile = fees && fees.length > 0 ? ((fees.length - ranking) / fees.length) * 100 : 0;
    
    return {
      growth7d: isFinite(growth7d) ? growth7d : 0,
      percentile: isFinite(percentile) ? percentile : 0,
      avgDaily: isFinite(avg7d) ? avg7d : 0,
      volatility: isFinite(volatility) ? volatility : 0,
    };
  }, [item, fees]);

  // Related protocols by category
  const relatedProtocols = useMemo(() => {
    if (!fees || !item || !item.category) return [];
    return fees
      .filter((f) => f.category === item.category && f.name !== item.name)
      .sort((a, b) => (b.total24h || 0) - (a.total24h || 0))
      .slice(0, 5);
  }, [fees, item]);

  // Fee Efficiency Score (fees / TVL in bps)
  const feeEfficiency = useMemo(() => {
    if (!item || !allProtocols) return null;
    const matchedProto = allProtocols.find((p) => p.name.toLowerCase() === (item.name || "").toLowerCase());
    if (!matchedProto || !matchedProto.tvl || matchedProto.tvl === 0) return null;
    const bps = ((item.total24h || 0) / matchedProto.tvl) * 10000;
    return {
      bps: isFinite(bps) ? bps : 0,
      tvl: matchedProto.tvl,
      interpretation: bps > 10 ? "Highly Efficient" : bps > 3 ? "Above Average" : bps > 1 ? "Average" : "Below Average",
    };
  }, [item, allProtocols]);

  // Category rank
  const categoryRank = useMemo(() => {
    if (!fees || !item || !item.category) return null;
    const inCategory = fees
      .filter((f: any) => f.category === item.category)
      .sort((a: any, b: any) => (b.total24h || 0) - (a.total24h || 0));
    const idx = inCategory.findIndex((f: any) => f.name === item.name);
    return { rank: idx + 1, total: inCategory.length };
  }, [fees, item]);
  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6 animate-fade-in">
          <div className="skeleton h-8 w-32" />
          <div className="skeleton h-16 w-64" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-lg" />
            ))}
          </div>
          <div className="skeleton h-[300px] rounded-lg" />
        </div>
      </Layout>
    );
  }

  if (!item) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Wallet className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Fee data not found</h2>
          <p className="text-muted-foreground mb-4">
            The protocol "{id}" fee data could not be found.
          </p>
          <Link to="/fees">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Fees
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  // Defensive checks for item data
  if (!item || !item.total24h) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Wallet className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Fee data not found</h2>
          <p className="text-muted-foreground mb-4">
            The protocol "{id}" fee data could not be found.
          </p>
          <Link to="/fees">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Fees
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const change1d = typeof item.change_1d === "number" ? item.change_1d : 0;
  const change7d = typeof item.change_7d === "number" ? item.change_7d : 0;

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Back Button */}
        <Link to="/fees" className="inline-flex">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Fees
          </Button>
        </Link>

        {/* Enhanced Header */}
        <div className="rounded-xl border border-border bg-gradient-to-br from-card to-card/50 p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            <div>
              {item.logo ? (
                <img
                  src={item.logo}
                  alt={item.displayName || item.name}
                  className="h-20 w-20 rounded-full bg-muted flex-shrink-0 shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-3xl flex-shrink-0 shadow-lg">
                  {(item.displayName || item.name || "?").charAt(0)}
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">{item.displayName || item.name}</h1>
                {rank > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    Rank #{rank}
                  </Badge>
                )}
              </div>
              {item.category && (
                <Badge className="mb-3">{item.category}</Badge>
              )}
              <p className="text-muted-foreground mb-4">
                Transparent fee revenue tracking and analytics
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">24h Fees</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(item.total24h || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">7d Avg</p>
                  <p className="text-xl font-bold">{formatCurrency((item.total7d || 0) / 7)}</p>
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
                  <p className="text-sm text-muted-foreground">Percentile</p>
                  <p className="text-xl font-bold text-amber-500">{feeAnalytics?.percentile.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="24h Fees"
            value={formatCurrency(item.total24h || 0)}
            icon={DollarSign}
          />
          <StatCard
            title="7d Avg Daily"
            value={formatCurrency((item.total7d || 0) / 7)}
            icon={BarChart3}
          />
          <StatCard
            title="Growth (7d)"
            value={`${feeAnalytics?.growth7d.toFixed(2) || 0}%`}
            change={feeAnalytics?.growth7d || 0}
            icon={feeAnalytics?.growth7d || 0 >= 0 ? TrendingUp : TrendingDown}
          />
          <StatCard
            title="Fee Rank"
            value={`#${rank}`}
            icon={Award}
          />
        </div>

        {/* Fee Revenue Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Revenue Score</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-primary">
                {feeAnalytics?.percentile?.toFixed(0) || "—"}
              </span>
              <span className="text-sm text-muted-foreground mb-0.5">/ 100</span>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Fee Tier</p>
            <p className="text-2xl font-bold">
              {(item.total24h || 0) > 1000000 ? "Mega" : (item.total24h || 0) > 100000 ? "Major" : (item.total24h || 0) > 10000 ? "Mid" : "Emerging"}
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
              <span className={`text-2xl font-bold ${change1d >= 0 ? "text-success" : "text-destructive"}`}>
                {change1d >= 0 ? "Growing" : "Declining"}
              </span>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Category</p>
            <p className="text-xl font-bold truncate">{item.category || "DeFi"}</p>
          </div>
        </div>

        {/* Fee Overview Chart */}
        <Card className="p-4 md:p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Fee Timeline
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={feeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  tick={AXIS_TICK_STYLE}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={AXIS_TICK_STYLE}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`}
                />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  formatter={(value: number) => [formatCurrency(value), "Fees"]}
                />
                <Bar dataKey="fees" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Comparison Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fee Comparison Chart */}
          <Card className="p-4 md:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Fee Ranking
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    type="number"
                    tick={AXIS_TICK_STYLE}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={AXIS_TICK_STYLE}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    formatter={(value: number) => [formatCurrency(value), "24h Fees"]}
                  />
                  <Bar 
                    dataKey="fees" 
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
              Fee Analytics
            </h3>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">7-Day Growth Rate</span>
                  <span className={cn(
                    "text-2xl font-bold",
                    (feeAnalytics?.growth7d || 0) >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {feeAnalytics?.growth7d.toFixed(2) || 0}%
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.min(Math.max((feeAnalytics?.growth7d || 0) + 50, 0), 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Flame className="h-4 w-4" />
                    Percentile Rank
                  </span>
                  <span className="font-mono font-bold">{feeAnalytics?.percentile.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Average Daily Fees
                  </span>
                  <span className="font-mono font-bold">{formatCurrency(feeAnalytics?.avgDaily || 0)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Volatility Index
                  </span>
                  <span className={cn(
                    "font-mono font-bold",
                    (feeAnalytics?.volatility || 0) > 30 ? "text-destructive" : "text-success"
                  )}>
                    {feeAnalytics?.volatility.toFixed(2) || 0}%
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fee Details */}
          <Card className="p-4 md:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Fee Breakdown
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">Category</span>
                <Badge>{item.category || "Unknown"}</Badge>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">24h Fees</span>
                <span className="font-mono font-bold text-primary">{formatCurrency(item.total24h || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">7d Total</span>
                <span className="font-mono font-bold">{formatCurrency(item.total7d || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">30d Total</span>
                <span className="font-mono font-bold">{formatCurrency(item.total30d || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-muted-foreground">All Time Total</span>
                <span className="font-mono font-bold">{formatCurrency(item.totalAllTime || 0)}</span>
              </div>
            </div>
          </Card>

          {/* Protocol Details */}
          <Card className="p-4 md:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Protocol Details
            </h3>
            {protoDetails ? (
              <div className="space-y-4">
                {protoDetails.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{protoDetails.description}</p>
                )}
                <div className="pt-2 space-y-3">
                  {protoDetails.tvl && (
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-muted-foreground">Total Value Locked</span>
                      <span className="font-mono font-bold">{formatCurrency(protoDetails.tvl)}</span>
                    </div>
                  )}
                  {protoDetails.chains && protoDetails.chains.length > 0 && (
                    <div className="py-3 border-b border-border">
                      <span className="text-muted-foreground text-sm block mb-2">Supported Chains</span>
                      <div className="flex flex-wrap gap-2">
                        {protoDetails.chains.slice(0, 6).map((chain: string) => (
                          <Badge key={chain} variant="secondary">{chain}</Badge>
                        ))}
                        {protoDetails.chains.length > 6 && (
                          <Badge variant="outline">+{protoDetails.chains.length - 6}</Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 pt-4">
                  {protoDetails.url && (
                    <a href={protoDetails.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Website
                      </Button>
                    </a>
                  )}
                  {protoDetails.twitter && (
                    <a
                      href={`https://twitter.com/${protoDetails.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Twitter
                      </Button>
                    </a>
                  )}
                  <a
                    href={`https://defillama.com/fees/${encodeURIComponent(item.name?.toLowerCase() || "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      DefiLlama
                    </Button>
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No additional protocol information available.</p>
            )}
          </Card>
        </div>

        {/* Fee Efficiency & Category Rank */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {feeEfficiency && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 md:p-6">
              <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Fee Efficiency Score
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Fees/TVL (bps)</p>
                  <p className="text-3xl font-bold text-primary">{feeEfficiency.bps.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Rating</p>
                  <p className="text-xl font-bold">{feeEfficiency.interpretation}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Generating {feeEfficiency.bps.toFixed(1)} bps daily from {formatCurrency(feeEfficiency.tvl)} TVL
              </p>
            </div>
          )}
          {categoryRank && (
            <div className="rounded-lg border border-border bg-card p-4 md:p-6">
              <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Category Fee Rank
              </h3>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-bold text-primary">#{categoryRank.rank}</span>
                <span className="text-muted-foreground text-sm mb-1">of {categoryRank.total} in {item.category}</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${((categoryRank.total - categoryRank.rank + 1) / categoryRank.total) * 100}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Related Protocols */}
        {relatedProtocols.length > 0 && (
          <Card className="p-4 md:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Similar Protocols in {item.category}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedProtocols.map((proto) => (
                <Link key={proto.name} to={`/fees/${(proto.displayName || proto.name).toLowerCase().replace(/\s+/g, '-')}`}>
                  <div className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{proto.displayName || proto.name}</p>
                        <p className="text-xs text-muted-foreground">{proto.category}</p>
                      </div>
                      {proto.logo && <img src={proto.logo} alt={proto.name} className="h-8 w-8 rounded-full bg-muted" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-sm text-muted-foreground">24h Fees</span>
                      <span className="font-mono font-bold">{formatCurrency(proto.total24h || 0)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
        </Card>
        )}

        {/* PRO Analytics Sections */}
        {feeEfficiency && (
          <ProDetailSection title="Fee Efficiency Score">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Efficiency (bps)</p>
                <p className="text-2xl font-bold text-primary">{feeEfficiency.bps.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">fees per $ TVL per day</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Rating</p>
                <p className="text-2xl font-bold">{feeEfficiency.interpretation}</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Annualized Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency((item.total24h || 0) * 365)}</p>
              </div>
            </div>
          </ProDetailSection>
        )}

        {categoryRank && (
          <ProDetailSection title="Category Ranking">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Rank in {item.category}</p>
                <p className="text-2xl font-bold text-primary">#{categoryRank.rank} of {categoryRank.total}</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Category Percentile</p>
                <p className="text-2xl font-bold">
                  {((categoryRank.total - categoryRank.rank + 1) / categoryRank.total * 100).toFixed(0)}%
                </p>
                <div className="h-2 bg-secondary rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-primary" style={{ width: `${((categoryRank.total - categoryRank.rank + 1) / categoryRank.total) * 100}%` }} />
                </div>
              </div>
            </div>
          </ProDetailSection>
        )}
      </div>
    </Layout>
  );
}
