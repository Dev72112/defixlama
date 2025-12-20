import { Layout } from "@/components/layout/Layout";
import { useParams, Link } from "react-router-dom";
import { useXLayerProtocols, useProtocolTVLHistory, useProtocolDetails } from "@/hooks/useDefiData";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatCurrency, formatPercentage } from "@/lib/api/defillama";
import { ArrowLeft, TrendingUp, TrendingDown, Layers, ExternalLink, Globe, Shield, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function ProtocolDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: protocols, isLoading: protocolsLoading } = useXLayerProtocols();
  const { data: tvlHistory, isLoading: historyLoading } = useProtocolTVLHistory(slug || null);
  const { data: protocolDetails, isLoading: detailsLoading } = useProtocolDetails(slug || null);

  // Find protocol
  const protocol = protocols?.find((p) => p.slug === slug || p.name.toLowerCase().replace(/\s+/g, "-") === slug);

  // Format chart data
  const chartData = (tvlHistory || []).slice(-90).map((item: any) => ({
    date: new Date(item.date * 1000).toLocaleDateString(),
    tvl: item.totalLiquidityUSD || 0,
  }));

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
              {protocol.description || `${protocol.name} is a DeFi protocol on XLayer.`}
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
            value={formatPercentage(protocol.change_1d)}
            change={protocol.change_1d}
            icon={protocol.change_1d && protocol.change_1d >= 0 ? TrendingUp : TrendingDown}
          />
          <StatCard
            title="7d Change"
            value={formatPercentage(protocol.change_7d)}
            change={protocol.change_7d}
            icon={protocol.change_7d && protocol.change_7d >= 0 ? TrendingUp : TrendingDown}
          />
          <StatCard
            title="Market Cap"
            value={formatCurrency(protocol.mcap || 0)}
            icon={TrendingUp}
          />
        </div>

        {/* TVL Chart */}
        <div className="rounded-lg border border-border bg-card p-4 md:p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6">TVL History (90 Days)</h2>
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
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatCurrency(value)}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
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
            <h3 className="text-lg font-semibold text-foreground mb-4">TVL by Chain</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(protocol.chainTvls)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, 8)
                .map(([chain, tvl]) => (
                  <div key={chain} className="p-3 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground capitalize">{chain}</p>
                    <p className="font-mono font-medium text-foreground">{formatCurrency(tvl as number)}</p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Additional DeFiLlama details */}
        {protocolDetails && (
          <div className="rounded-lg border border-border bg-card p-4 md:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Detailed Data (DefiLlama)</h3>
            <div className="space-y-3">
              <div>
                <strong className="text-sm text-muted-foreground">Module:</strong>
                <div className="text-foreground">{protocolDetails.module || '-'}</div>
              </div>
              <div>
                <strong className="text-sm text-muted-foreground">Listed At:</strong>
                <div className="text-foreground">{protocolDetails.listedAt ? new Date(protocolDetails.listedAt * 1000).toLocaleDateString() : '-'}</div>
              </div>
              <div>
                <strong className="text-sm text-muted-foreground">Addresses:</strong>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(protocolDetails.addresses || []).slice(0, 8).map((a: any) => (
                    <a
                      key={a}
                      href={`https://www.okx.com/explorer/xlayer/address/${a}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm"
                    >
                      {a.slice(0, 6)}...{a.slice(-4)}
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <pre className="mt-4 text-xs text-muted-foreground overflow-auto max-h-48">{JSON.stringify(protocolDetails, null, 2)}</pre>
          </div>
        )}

        {/* Additional Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chains */}
          {protocol.chains && protocol.chains.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-4 md:p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Deployed Chains</h3>
              <div className="flex flex-wrap gap-2">
                {protocol.chains.map((chain) => (
                  <span
                    key={chain}
                    className={cn(
                      "px-3 py-1 rounded-full text-sm",
                      chain.toLowerCase().includes("xlayer")
                        ? "bg-primary/20 text-primary"
                        : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {chain}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Oracles */}
          {protocol.oracles && protocol.oracles.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-4 md:p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Oracles Used</h3>
              <div className="flex flex-wrap gap-2">
                {protocol.oracles.map((oracle) => (
                  <span
                    key={oracle}
                    className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm"
                  >
                    {oracle}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
