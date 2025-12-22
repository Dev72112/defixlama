import { Layout } from "@/components/layout/Layout";
import { useParams, Link } from "react-router-dom";
import { useStablecoins } from "@/hooks/useDefiData";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatCurrency } from "@/lib/api/defillama";
import { ArrowLeft, DollarSign, Globe, TrendingUp, Layers, ExternalLink, PieChart, Zap, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export default function StablecoinDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: stablecoins, isLoading } = useStablecoins();

  // Find stablecoin with better matching
  const coin = useMemo(() => {
    if (!stablecoins || !id) return null;
    const searchId = id.toLowerCase();
    
    return stablecoins.find((s) => {
      const symbol = (s.symbol || "").toLowerCase();
      const coinId = (s.id || "").toLowerCase();
      const name = (s.name || "").toLowerCase();
      const nameSlug = name.replace(/\s+/g, "-");
      
      return symbol === searchId || coinId === searchId || name === searchId || nameSlug === searchId;
    });
  }, [stablecoins, id]);

  // Calculate rank
  const rank = useMemo(() => {
    if (!stablecoins || !coin) return 0;
    // Calculate total circulating for ranking
    const withTotals = stablecoins.map((s) => ({
      ...s,
      totalCirculating: Object.values(s.circulating || {}).reduce((a, b) => a + (b || 0), 0),
    }));
    const sorted = withTotals.sort((a, b) => b.totalCirculating - a.totalCirculating);
    return sorted.findIndex((s) => s.id === coin.id) + 1;
  }, [stablecoins, coin]);

  // Calculate total circulating
  const totalCirculating = useMemo(() => {
    if (!coin?.circulating) return 0;
    return Object.values(coin.circulating).reduce((a, b) => a + (b || 0), 0);
  }, [coin]);

  // Chain distribution data
  const chainData = useMemo(() => {
    if (!coin?.circulating) return [];
    return Object.entries(coin.circulating)
      .map(([chain, value]) => ({
        name: chain,
        value: value || 0,
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [coin]);

  // Supply Analytics
  const supplyAnalytics = useMemo(() => {
    if (!coin?.circulating) return null;
    const supplies = Object.values(coin.circulating).filter(v => typeof v === "number");
    if (supplies.length === 0) return null;
    
    const total = supplies.reduce((a, b) => a + (b || 0), 0);
    const avg = total / supplies.length;
    const maxSupply = Math.max(...supplies);
    const minSupply = Math.min(...supplies);
    const concentration = (maxSupply / total) * 100;
    const chains = Object.keys(coin.circulating || {}).length;
    
    return {
      total,
      avg,
      concentration,
      maxSupply,
      minSupply,
      chains,
    };
  }, [coin]);

  // Related stablecoins (same peg type)
  const relatedStablecoins = useMemo(() => {
    if (!stablecoins || !coin) return [];
    return stablecoins
      .filter(s => s.pegType === coin.pegType && s.id !== coin.id)
      .map(s => ({
        ...s,
        totalCirculating: Object.values(s.circulating || {}).reduce((a, b) => a + (b || 0), 0),
      }))
      .sort((a, b) => (b.totalCirculating || 0) - (a.totalCirculating || 0))
      .slice(0, 5);
  }, [stablecoins, coin]);

  // Distribution concentration data
  const concentrationData = useMemo(() => {
    if (!coin?.circulating) return [];
    const sorted = Object.entries(coin.circulating)
      .map(([chain, value]) => ({ chain, value: value || 0 }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);
    
    const total = sorted.reduce((a, b) => a + b.value, 0);
    let cumulative = 0;
    return sorted.map(d => {
      cumulative += d.value;
      return {
        chain: d.chain,
        value: d.value,
        percentage: (d.value / total) * 100,
        cumulative: (cumulative / total) * 100,
      };
    });
  }, [coin]);

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

  if (!coin) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <DollarSign className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Stablecoin not found</h2>
          <p className="text-muted-foreground mb-4">
            The stablecoin "{id}" could not be found.
          </p>
          <Link to="/stablecoins">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Stablecoins
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
        <Link to="/stablecoins" className="inline-flex">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Stablecoins
          </Button>
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl flex-shrink-0">
            {coin.symbol?.charAt(0) || "$"}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{coin.name}</h1>
              <span className="text-lg text-muted-foreground">${coin.symbol}</span>
              {rank > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  Rank #{rank}
                </span>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              {coin.pegType} • {coin.pegMechanism || "Algorithmic/Backed"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalCirculating)}</p>
            <p className="text-sm text-muted-foreground">Total Supply</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Price"
            value={coin.price ? `$${coin.price.toFixed(4)}` : "$1.00"}
            icon={DollarSign}
          />
          <StatCard
            title="Total Supply"
            value={formatCurrency(totalCirculating)}
            icon={Layers}
          />
          <StatCard
            title="Concentration"
            value={`${supplyAnalytics?.concentration.toFixed(1) || 0}%`}
            icon={Percent}
          />
          <StatCard
            title="Chains"
            value={(supplyAnalytics?.chains || 0).toString()}
            icon={Globe}
          />
        </div>

        {/* Supply Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Chain Distribution
            </p>
            <p className="text-2xl font-bold">{supplyAnalytics?.chains || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">blockchains</p>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Supply Concentration
            </p>
            <p className="text-2xl font-bold">{supplyAnalytics?.concentration.toFixed(1) || 0}%</p>
            <p className="text-xs text-muted-foreground mt-1">on largest chain</p>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg per Chain
            </p>
            <p className="text-2xl font-bold">{formatCurrency(supplyAnalytics?.avg || 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">average supply</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Concentration Analysis */}
          <div className="rounded-lg border border-border bg-card p-4 md:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Supply Concentration by Chain</h3>
            <div className="h-[300px]">
              {concentrationData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={concentrationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="chain"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      label={{ value: "Percentage (%)", angle: -90, position: "insideLeft" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                    />
                    <Bar dataKey="percentage" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No distribution data
                </div>
              )}
            </div>
          </div>

          {/* Chain Distribution Pie */}
          <div className="rounded-lg border border-border bg-card p-4 md:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Supply by Chain</h3>
            <div className="h-[300px]">
              {chainData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={chainData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
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
                      formatter={(value: number) => [formatCurrency(value), "Supply"]}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No chain data available
                </div>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {chainData.slice(0, 6).map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-muted-foreground truncate">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chain Distribution Bar */}
          <div className="rounded-lg border border-border bg-card p-4 md:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Top Chains by Supply</h3>
            <div className="h-[300px]">
              {chainData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chainData.slice(0, 5)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      type="number"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      tickFormatter={(v) => formatCurrency(v)}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [formatCurrency(value), "Supply"]}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No chain data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Stablecoins */}
        {relatedStablecoins.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-4 md:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Related Stablecoins ({coin.pegType})</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {relatedStablecoins.map((s) => (
                <Link to={`/stablecoins/${s.symbol.toLowerCase()}`} key={s.id}>
                  <div className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer h-full">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                        {s.symbol?.charAt(0) || "$"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate text-sm">{s.symbol}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.name}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Supply</p>
                      <p className="font-mono font-bold text-sm">{formatCurrency(s.totalCirculating)}</p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground">{s.chains?.length || Object.keys(s.circulating || {}).length} chains</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Stablecoin Info */}
        <div className="rounded-lg border border-border bg-card p-4 md:p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Stablecoin Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium text-foreground">{coin.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Symbol</span>
                <span className="font-mono text-foreground">{coin.symbol}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Price</span>
                <span className="font-mono text-foreground">${coin.price?.toFixed(4) || "1.0000"}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Price Source</span>
                <span className="text-foreground">{coin.priceSource || "-"}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Peg Type</span>
                <span className="font-medium text-foreground">{coin.pegType}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Mechanism</span>
                <span className="text-foreground">{coin.pegMechanism || "-"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Total Supply</span>
                <span className="font-mono font-bold text-primary">{formatCurrency(totalCirculating)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Gecko ID</span>
                <span className="font-mono text-foreground">{coin.gecko_id || "-"}</span>
              </div>
            </div>
          </div>

          {/* External Links */}
          <div className="mt-6 pt-4 border-t border-border">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Explore</h4>
            <div className="flex flex-wrap gap-2">
              <a
                href={`https://defillama.com/stablecoin/${encodeURIComponent(coin.name.toLowerCase())}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  DefiLlama
                </Button>
              </a>
              {coin.gecko_id && (
                <a
                  href={`https://www.coingecko.com/en/coins/${coin.gecko_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    CoinGecko
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
