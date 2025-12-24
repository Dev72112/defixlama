import { Layout } from "@/components/layout/Layout";
import { useParams, Link } from "react-router-dom";
import { useTokenDetails, useTokenPriceHistory, useOklinkContract } from "@/hooks/useTokenData";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatCurrency } from "@/lib/api/defillama";
import { ArrowLeft, TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, Clock, Percent, Zap, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn, stripHtml, safeEncode, formatTokenPrice } from "@/lib/utils";
import { PriceAlertDialog } from "@/components/PriceAlertDialog";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState, useMemo } from "react";

export default function TokenDetail() {
  const { id } = useParams<{ id: string }>();
  const tokenId = id || "";
  
  const { data: token, isLoading: isLoadingToken } = useTokenDetails(tokenId);
  const [days, setDays] = useState(7);
  const { data: priceHistory, isLoading: isLoadingPrice } = useTokenPriceHistory(tokenId);
  const { data: oklinkInfo, isLoading: isLoadingOklink } = useOklinkContract(tokenId);

  // Create a unified token object from available sources
  const displayToken = useMemo(() => {
    if (token) return token;
    if (oklinkInfo) {
      return {
        id: tokenId,
        name: oklinkInfo?.name || oklinkInfo?.contractName || "Unknown Token",
        symbol: oklinkInfo?.symbol?.toUpperCase() || "???",
        image: { large: oklinkInfo?.logo || null, small: oklinkInfo?.logo || null },
        contract: tokenId,
        market_data: {
          current_price: { usd: oklinkInfo?.price || 0 },
          price_change_percentage_24h: oklinkInfo?.change24h || 0,
          price_change_percentage_7d: 0,
          total_volume: { usd: oklinkInfo?.volume24h || 0 },
          market_cap: { usd: oklinkInfo?.marketCap || 0 },
          circulating_supply: 0,
          total_supply: oklinkInfo?.totalSupply ? parseFloat(oklinkInfo.totalSupply) : 0,
          max_supply: null,
        },
        description: { en: oklinkInfo?.description || "" },
        isCommunityToken: true,
      };
    }
    return null;
  }, [token, oklinkInfo, tokenId]);

  // Get token logo from multiple sources with fallback
  const tokenLogo = useMemo(() => {
    if (token?.image) return token.image;
    if (oklinkInfo?.logo) return oklinkInfo.logo;
    if (oklinkInfo?.contractLogo) return oklinkInfo.contractLogo;
    return null;
  }, [token, oklinkInfo]);

  // Format chart data from price history
  const chartData = useMemo(() => {
    if (!priceHistory) return [];
    
    if (Array.isArray(priceHistory)) {
      return priceHistory.map(([timestamp, price]) => ({
        date: new Date(timestamp).toLocaleDateString(),
        price: typeof price === 'number' ? price : parseFloat(price),
        timestamp,
      }));
    }
    
    if (typeof priceHistory === 'object') {
      return Object.entries(priceHistory)
        .map(([timestamp, price]) => ({
          date: new Date(parseInt(timestamp)).toLocaleDateString(),
          price: typeof price === 'number' ? price : parseFloat(price as any),
          timestamp: parseInt(timestamp),
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
    }
    
    return [];
  }, [priceHistory]);

  // Price Analytics
  const priceAnalytics = useMemo(() => {
    if (!priceHistory?.prices || priceHistory.prices.length < 2) return null;
    
    const prices = priceHistory.prices.map(([_, price]) => price);
    const latest = prices[prices.length - 1];
    const oldest = prices[0];
    const highest = Math.max(...prices);
    const lowest = Math.min(...prices);
    
    const priceRange = highest - lowest;
    const volatility = (priceRange / lowest) * 100;
    
    const dayChange = oldest !== 0 ? ((latest - oldest) / oldest) * 100 : 0;
    
    return {
      highest,
      lowest,
      range: priceRange,
      volatility: isFinite(volatility) ? volatility : 0,
      dayChange: isFinite(dayChange) ? dayChange : 0,
      avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
    };
  }, [priceHistory]);

  // Market metrics
  const marketMetrics = useMemo(() => {
    if (!displayToken?.market_data) return null;
    const mcap = displayToken.market_data.market_cap?.usd || 0;
    const volume = displayToken.market_data.total_volume?.usd || 0;
    const mcapVolumeRatio = volume !== 0 ? mcap / volume : 0;
    const circulatingSupply = displayToken.market_data.circulating_supply || 0;
    const maxSupply = displayToken.market_data.max_supply;
    const supplyRatio = maxSupply && circulatingSupply > 0 ? (circulatingSupply / maxSupply) * 100 : 0;
    
    return {
      mcapVolumeRatio: isFinite(mcapVolumeRatio) ? mcapVolumeRatio : 0,
      supplyRatio: isFinite(supplyRatio) ? supplyRatio : 0,
      circSupplyPercent: maxSupply ? supplyRatio : 100,
    };
  }, [displayToken?.market_data]);

  // Derived values (non-hooks, safe to compute after hooks)
  const tokenName = displayToken?.name || "";
  const tokenSymbol = displayToken?.symbol || "";
  const isCommunityToken = displayToken?.isCommunityToken || !token;
  const priceChange24h = displayToken?.market_data?.price_change_percentage_24h || 0;
  const priceChange7d = displayToken?.market_data?.price_change_percentage_7d || 0;

  // Show loading state
  if (isLoadingToken && !token && !oklinkInfo) {
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

  // Show not found if we have no data from either source
  if (!displayToken && !isLoadingToken && !isLoadingOklink) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Activity className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Token not found</h2>
          <p className="text-muted-foreground mb-4">
            The token "{tokenId}" could not be found. It may not be listed yet.
          </p>
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

        {/* Community Token Alert */}
        {isCommunityToken && (
          <Alert className="border-primary/30 bg-primary/10">
            <AlertCircle className="h-4 w-4 text-primary" />
            <AlertDescription className="text-primary">
              This is a community token with limited data availability. Only price information from CoinGecko and DexScreener is available. On-chain data from the XLayer explorer may provide additional insights.
            </AlertDescription>
          </Alert>
        )}

        {/* Token Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {displayToken.image?.large || displayToken.image?.small ? (
            <img
              src={displayToken.image?.large || displayToken.image?.small}
              alt={displayToken.name}
              className="h-16 w-16 rounded-full bg-muted"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${displayToken.symbol}&background=1a1a2e&color=2dd4bf&size=64`;
              }}
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl">
              {displayToken.symbol?.slice(0, 2) || "?"}
            </div>
          )}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{displayToken.name}</h1>
              <span className="text-lg text-muted-foreground uppercase">{displayToken.symbol}</span>
              {isCommunityToken && (
                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                  Community Token
                </span>
              )}
              {!isCommunityToken && displayToken.market_cap_rank && (
                <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">
                  Rank #{displayToken.market_cap_rank}
                </span>
              )}
            </div>
            {displayToken.contract && (
              <div className="mt-2">
                <a
                  href={`https://www.okx.com/explorer/xlayer/address/${safeEncode(displayToken.contract)}`}
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
                {formatTokenPrice(displayToken.market_data?.current_price?.usd)}
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
              <PriceAlertDialog
                tokenId={tokenId}
                symbol={tokenSymbol}
                name={tokenName}
                currentPrice={displayToken.market_data?.current_price?.usd || 0}
              />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Market Cap"
            value={formatCurrency(displayToken.market_data?.market_cap?.usd || 0)}
            icon={DollarSign}
          />
          <StatCard
            title="24h Volume"
            value={formatCurrency(displayToken.market_data?.total_volume?.usd || 0)}
            icon={Activity}
          />
          <StatCard
            title="Price Range"
            value={`$${(priceAnalytics?.range || 0).toFixed(4)}`}
            icon={BarChart3}
          />
          <StatCard
            title="Volatility"
            value={`${priceAnalytics?.volatility.toFixed(1) || 0}%`}
            icon={TrendingUp}
          />
        </div>

        {/* Token Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Liquidity Score</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-primary">
                {displayToken.market_data?.total_volume?.usd && displayToken.market_data?.market_cap?.usd
                  ? Math.min(100, ((displayToken.market_data.total_volume.usd / displayToken.market_data.market_cap.usd) * 100 * 10)).toFixed(0)
                  : "—"}
              </span>
              <span className="text-sm text-muted-foreground mb-0.5">/ 100</span>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Volatility Level</p>
            <p className="text-2xl font-bold">
              {(priceAnalytics?.volatility || 0) < 15 ? "Low" : (priceAnalytics?.volatility || 0) < 40 ? "Medium" : "High"}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Price Trend</p>
            <div className="flex items-center gap-2">
              {priceChange24h >= 0 ? (
                <TrendingUp className="h-5 w-5 text-success" />
              ) : (
                <TrendingDown className="h-5 w-5 text-destructive" />
              )}
              <span className={`text-2xl font-bold ${priceChange24h >= 0 ? "text-success" : "text-destructive"}`}>
                {priceChange24h >= 0 ? "Bullish" : "Bearish"}
              </span>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Token Type</p>
            <p className="text-xl font-bold truncate">{isCommunityToken ? "Community" : "Listed"}</p>
          </div>
        </div>

        {/* Price Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm text-muted-foreground mb-1">Price Range</p>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">High</p>
                <p className="font-mono font-bold">${priceAnalytics?.highest?.toFixed(4) || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Low</p>
                <p className="font-mono font-bold">${priceAnalytics?.lowest?.toFixed(4) || "-"}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Price Volatility
            </p>
            <p className="text-2xl font-bold">{priceAnalytics?.volatility?.toFixed(1) || 0}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {(priceAnalytics?.volatility || 0) < 15 ? "Low" : (priceAnalytics?.volatility || 0) < 40 ? "Moderate" : "High"}
            </p>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Supply Status
            </p>
            <p className="text-2xl font-bold">{marketMetrics?.supplyRatio?.toFixed(1) || 0}%</p>
            <p className="text-xs text-muted-foreground mt-1">circulating of max</p>
          </div>
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
                    tickFormatter={(value) => formatTokenPrice(value)}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    formatter={(value: number) => [formatTokenPrice(value), "Price"]}
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
          {/* Market Analysis */}
          <div className="rounded-lg border border-border bg-card p-4 md:p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Market Analysis</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Market Cap Rank</span>
                <span className="font-mono text-foreground">
                  {displayToken.market_cap_rank ? `#${displayToken.market_cap_rank}` : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Market Cap / Volume</span>
                <span className="font-mono text-foreground">
                  {marketMetrics?.mcapVolumeRatio?.toFixed(2) || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">FDV Rank</span>
                <span className="font-mono text-foreground">
                  {displayToken.fully_diluted_valuation_rank ? `#${displayToken.fully_diluted_valuation_rank}` : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Market Cap vs FDV</span>
                <span className="font-mono text-foreground">
                  {displayToken.market_data?.market_cap && displayToken.market_data?.fully_diluted_valuation
                    ? `${((displayToken.market_data.market_cap.usd / displayToken.market_data.fully_diluted_valuation.usd) * 100).toFixed(1)}%`
                    : "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Supply Info */}
          <div className="rounded-lg border border-border bg-card p-4 md:p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Supply Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Circulating Supply</span>
                <span className="font-mono text-foreground">
                  {displayToken.market_data?.circulating_supply?.toLocaleString() || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Supply</span>
                <span className="font-mono text-foreground">
                  {displayToken.market_data?.total_supply?.toLocaleString() || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Supply</span>
                <span className="font-mono text-foreground">
                  {displayToken.market_data?.max_supply?.toLocaleString() || "∞"}
                </span>
              </div>
              {displayToken.market_data?.max_supply && (
                <div className="mt-4 pt-3 border-t border-border">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Circulating vs Max</span>
                    <span className="text-xs font-mono text-foreground">{marketMetrics?.supplyRatio?.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${Math.min(marketMetrics?.supplyRatio || 0, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Price Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Price Range Stats */}
          <div className="rounded-lg border border-border bg-card p-4 md:p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Price Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">24h High</span>
                <span className="font-mono text-foreground">
                  ${displayToken.market_data?.high_24h?.usd?.toLocaleString() || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">24h Low</span>
                <span className="font-mono text-foreground">
                  ${displayToken.market_data?.low_24h?.usd?.toLocaleString() || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">All Time High</span>
                <span className="font-mono text-foreground">
                  ${displayToken.market_data?.ath?.usd?.toLocaleString() || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">All Time Low</span>
                <span className="font-mono text-foreground">
                  ${displayToken.market_data?.atl?.usd?.toLocaleString() || "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Price Changes */}
          <div className="rounded-lg border border-border bg-card p-4 md:p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Price Changes</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">24h Change</span>
                <span className={cn("font-mono font-bold", priceChange24h >= 0 ? "text-success" : "text-destructive")}>
                  {priceChange24h >= 0 ? "+" : ""}{priceChange24h.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">7d Change</span>
                <span className={cn("font-mono font-bold", priceChange7d >= 0 ? "text-success" : "text-destructive")}>
                  {priceChange7d >= 0 ? "+" : ""}{priceChange7d.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">ATH Distance</span>
                <span className="font-mono text-destructive">
                  {displayToken.market_data?.ath?.usd ? 
                    `-${(((displayToken.market_data.ath.usd - (displayToken.market_data.current_price?.usd || 0)) / displayToken.market_data.ath.usd) * 100).toFixed(1)}%`
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">ATL Distance</span>
                <span className="font-mono text-success">
                  {displayToken.market_data?.atl?.usd ?
                    `+${((((displayToken.market_data.current_price?.usd || 0) - displayToken.market_data.atl.usd) / displayToken.market_data.atl.usd) * 100).toFixed(1)}%`
                    : "-"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* On-chain / Explorer */}
        {displayToken.contract && (
          <div className="rounded-lg border border-border bg-card p-4 md:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">On-Chain</h3>
            <div className="flex items-center justify-between">
              <div>
                <a
                  href={`https://www.okx.com/explorer/xlayer/address/${safeEncode(displayToken.contract)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary/80 hover:text-primary"
                >
                  View contract on XLayer Explorer
                </a>
                {oklinkInfo?.description && (
                  <p className="text-sm text-muted-foreground mt-2">{oklinkInfo.description}</p>
                )}
              </div>
              <div className="text-right font-mono text-sm text-muted-foreground">
                <div>Holders: {oklinkInfo?.holders ?? '-'}</div>
                <div>Total Supply: {oklinkInfo?.totalSupply ?? '-'}</div>
              </div>
            </div>
            {oklinkInfo && (
              <pre className="mt-4 text-xs text-muted-foreground overflow-auto max-h-40">{JSON.stringify(oklinkInfo, null, 2)}</pre>
            )}
          </div>
        )}

        {/* Description */}
        {displayToken.description?.en && (
          <div className="rounded-lg border border-border bg-card p-4 md:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">About {displayToken.name}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {(() => {
                const plain = stripHtml(displayToken.description?.en || "");
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
