import { Layout } from "@/components/layout/Layout";
import { useParams, Link } from "react-router-dom";
import { useStablecoins } from "@/hooks/useDefiData";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatCurrency } from "@/lib/api/defillama";
import { ArrowLeft, DollarSign, Globe, TrendingUp, Layers, ExternalLink, PieChart } from "lucide-react";
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
            title="Peg Type"
            value={coin.pegType || "-"}
            icon={TrendingUp}
          />
          <StatCard
            title="Chains"
            value={(coin.chains?.length || Object.keys(coin.circulating || {}).length).toString()}
            icon={Globe}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
