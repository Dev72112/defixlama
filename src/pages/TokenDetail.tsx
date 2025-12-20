import { Layout } from "@/components/layout/Layout";
import { useParams, Link } from "react-router-dom";
import { useTokenDetails, useTokenPriceHistory, useOklinkContract } from "@/hooks/useTokenData";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatCurrency } from "@/lib/api/defillama";
import { ArrowLeft, TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, stripHtml, safeEncode } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";

export default function TokenDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: token, isLoading } = useTokenDetails(id || null);
  const [days, setDays] = useState(7);
  const { data: priceHistory } = useTokenPriceHistory(id || null, days);
  const { data: oklinkInfo } = useOklinkContract(token?.contract || null);

  // Format chart data
  const chartData = priceHistory?.prices?.map(([timestamp, price]) => ({
    date: new Date(timestamp).toLocaleDateString(),
    price,
    timestamp,
  })) || [];

  if (isLoading) {
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

  if (!token) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Token not found</h2>
          <p className="text-muted-foreground mb-4">The requested token could not be found.</p>
          <Link to="/tokens">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tokens
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const priceChange24h = token.market_data?.price_change_percentage_24h || 0;
  const priceChange7d = token.market_data?.price_change_percentage_7d || 0;

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Back Button */}
        <Link to="/tokens" className="inline-flex">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tokens
          </Button>
        </Link>

        {/* Token Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <img
            src={token.image?.large || token.image?.small}
            alt={token.name}
            className="h-16 w-16 rounded-full bg-muted"
          />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{token.name}</h1>
              <span className="text-lg text-muted-foreground uppercase">{token.symbol}</span>
              <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">
                Rank #{token.market_cap_rank || "-"}
              </span>
            </div>
            {token.contract && (
              <div className="mt-2">
                <a
                  href={`https://www.okx.com/explorer/xlayer/address/${safeEncode(token.contract)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary/80 hover:text-primary"
                >
                  View on XLayer Explorer
                </a>
              </div>
            )}
            <div className="flex items-center gap-4 mt-2">
              <span className="text-3xl font-bold text-foreground">
                ${token.market_data?.current_price?.usd?.toLocaleString() || "-"}
              </span>
              <span
                className={cn(
                  "flex items-center gap-1 font-mono",
                  priceChange24h >= 0 ? "text-success" : "text-destructive"
                )}
              >
                {priceChange24h >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {priceChange24h >= 0 ? "+" : ""}{priceChange24h.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Market Cap"
            value={formatCurrency(token.market_data?.market_cap?.usd || 0)}
            icon={DollarSign}
          />
          <StatCard
            title="24h Volume"
            value={formatCurrency(token.market_data?.total_volume?.usd || 0)}
            icon={Activity}
          />
          <StatCard
            title="7d Change"
            value={`${priceChange7d >= 0 ? "+" : ""}${priceChange7d.toFixed(2)}%`}
            change={priceChange7d}
            icon={BarChart3}
          />
          <StatCard
            title="All Time High"
            value={`$${token.market_data?.ath?.usd?.toLocaleString() || "-"}`}
            icon={TrendingUp}
          />
        </div>

        {/* Price Chart */}
        <div className="rounded-lg border border-border bg-card p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold text-foreground">Price Chart</h2>
            <div className="flex gap-2">
              {[1, 7, 30, 90].map((d) => (
                <Button
                  key={d}
                  variant={days === d ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDays(d)}
                >
                  {d}D
                </Button>
              ))}
            </div>
          </div>
          <div className="h-[300px] md:h-[400px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
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
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "Price"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#priceGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Loading chart data...
              </div>
            )}
          </div>
        </div>

        {/* Token Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Supply Info */}
          <div className="rounded-lg border border-border bg-card p-4 md:p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Supply Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Circulating Supply</span>
                <span className="font-mono text-foreground">
                  {token.market_data?.circulating_supply?.toLocaleString() || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Supply</span>
                <span className="font-mono text-foreground">
                  {token.market_data?.total_supply?.toLocaleString() || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Supply</span>
                <span className="font-mono text-foreground">
                  {token.market_data?.max_supply?.toLocaleString() || "∞"}
                </span>
              </div>
            </div>
          </div>

          {/* Price Stats */}
          <div className="rounded-lg border border-border bg-card p-4 md:p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Price Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">24h High</span>
                <span className="font-mono text-foreground">
                  ${token.market_data?.high_24h?.usd?.toLocaleString() || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">24h Low</span>
                <span className="font-mono text-foreground">
                  ${token.market_data?.low_24h?.usd?.toLocaleString() || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">All Time Low</span>
                <span className="font-mono text-foreground">
                  ${token.market_data?.atl?.usd?.toLocaleString() || "-"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* On-chain / Explorer */}
        {token.contract && (
          <div className="rounded-lg border border-border bg-card p-4 md:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">On-Chain</h3>
            <div className="flex items-center justify-between">
              <div>
                <a
                  href={`https://www.okx.com/explorer/xlayer/address/${safeEncode(token.contract)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary/80 hover:text-primary"
                >
                  View contract on XLayer Explorer
                </a>
                {oklinkInfo?.address && (
                  <p className="text-sm text-muted-foreground mt-2">{oklinkInfo.address.description || ''}</p>
                )}
              </div>
              <div className="text-right font-mono text-sm text-muted-foreground">
                <div>Holders: {oklinkInfo?.holders ?? '-'}</div>
                <div>Transfers: {oklinkInfo?.txCount ?? '-'}</div>
                <div>Total Supply: {oklinkInfo?.totalSupply ?? '-'}</div>
              </div>
            </div>
            {oklinkInfo && (
              <pre className="mt-4 text-xs text-muted-foreground overflow-auto max-h-40">{JSON.stringify(oklinkInfo, null, 2)}</pre>
            )}
          </div>
        )}

        {/* Description */}
        {token.description?.en && (
          <div className="rounded-lg border border-border bg-card p-4 md:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">About {token.name}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {(() => {
                const plain = stripHtml(token.description?.en || "");
                const snippet = plain.split(/\.\s+/).slice(0, 3).join('. ');
                return snippet ? `${snippet}.` : "";
              })()}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
