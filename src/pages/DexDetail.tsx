import { Layout } from "@/components/layout/Layout";
import { useParams, Link } from "react-router-dom";
import { useXLayerDexVolumes, useAllDexVolumes } from "@/hooks/useDefiData";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatCurrency, formatPercentage } from "@/lib/api/defillama";
import { ArrowLeft, Activity, TrendingUp, TrendingDown, BarChart3, ExternalLink, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
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
} from "recharts";

export default function DexDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: xlayerDexs, isLoading: xlayerLoading } = useXLayerDexVolumes();
  const { data: allDexs, isLoading: allLoading } = useAllDexVolumes();

  const isLoading = xlayerLoading || allLoading;

  // Find DEX from XLayer dexs first, then all dexs
  const dex = useMemo(() => {
    if (!id) return null;
    const searchId = id.toLowerCase();
    
    // Try XLayer dexs first
    const xlayerMatch = xlayerDexs?.find(
      (d) =>
        d.name.toLowerCase() === searchId ||
        (d.displayName || "").toLowerCase() === searchId ||
        d.name.toLowerCase().replace(/\s+/g, "-") === searchId
    );
    if (xlayerMatch) return xlayerMatch;

    // Then try all dexs
    return allDexs?.find(
      (d) =>
        d.name.toLowerCase() === searchId ||
        (d.displayName || "").toLowerCase() === searchId ||
        d.name.toLowerCase().replace(/\s+/g, "-") === searchId
    );
  }, [xlayerDexs, allDexs, id]);

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
    // Since we don't have per-chain volumes, just show which chains are supported
    return dex.chains.map((chain, index) => ({
      name: chain,
      value: 1, // Equal weight for visualization
    }));
  }, [dex]);

  const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--muted))",
  ];

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

  const change1d = dex.change_1d || 0;
  const change7d = dex.change_7d || 0;

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

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {dex.logo ? (
            <img
              src={dex.logo}
              alt={dex.displayName || dex.name}
              className="h-16 w-16 rounded-full bg-muted flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl flex-shrink-0">
              {(dex.displayName || dex.name).charAt(0)}
            </div>
          )}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{dex.displayName || dex.name}</h1>
              {rank > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  Rank #{rank}
                </span>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              {dex.chains?.length || 0} chains • DEX
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{formatCurrency(dex.total24h || 0)}</p>
            <p className="text-sm text-muted-foreground">24h Volume</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="24h Volume"
            value={formatCurrency(dex.total24h || 0)}
            icon={Activity}
          />
          <StatCard
            title="7d Volume"
            value={formatCurrency(dex.total7d || 0)}
            icon={BarChart3}
          />
          <StatCard
            title="24h Change"
            value={formatPercentage(change1d)}
            change={change1d}
            icon={change1d >= 0 ? TrendingUp : TrendingDown}
          />
          <StatCard
            title="7d Change"
            value={formatPercentage(change7d)}
            change={change7d}
            icon={change7d >= 0 ? TrendingUp : TrendingDown}
          />
        </div>

        {/* Volume Comparison Chart */}
        <div className="rounded-lg border border-border bg-card p-4 md:p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Volume Overview</h3>
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
                  tickFormatter={(v) => formatCurrency(v)}
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Supported Chains */}
          {dex.chains && dex.chains.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-4 md:p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Supported Chains</h3>
              <div className="h-[200px]">
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
                  <span
                    key={chain}
                    className="px-3 py-1 rounded-full text-sm"
                    style={{
                      backgroundColor: `${COLORS[index % COLORS.length]}20`,
                      color: COLORS[index % COLORS.length],
                    }}
                  >
                    {chain}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* DEX Info */}
          <div className="rounded-lg border border-border bg-card p-4 md:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">DEX Information</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium text-foreground">{dex.displayName || dex.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">24h Volume</span>
                <span className="font-mono font-medium text-foreground">{formatCurrency(dex.total24h || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">7d Volume</span>
                <span className="font-mono text-foreground">{formatCurrency(dex.total7d || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">30d Volume</span>
                <span className="font-mono text-foreground">{formatCurrency(dex.total30d || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">All Time Volume</span>
                <span className="font-mono text-foreground">{formatCurrency(dex.totalAllTime || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Chains</span>
                <span className="font-medium text-foreground">{dex.chains?.length || 0}</span>
              </div>
            </div>

            {/* External Links */}
            <div className="mt-6 pt-4 border-t border-border">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Explore</h4>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`https://defillama.com/dexs/${encodeURIComponent(dex.name.toLowerCase())}`}
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
          </div>
        </div>
      </div>
    </Layout>
  );
}
