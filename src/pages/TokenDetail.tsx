import { Layout } from "@/components/layout/Layout";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatCurrency } from "@/lib/api/defillama";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  BarChart3,
  Users,
  Droplets,
  Clock,
  ExternalLink,
  AlertCircle,
  Loader2,
  RefreshCw,
  Twitter,
  Globe,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatTokenPrice } from "@/lib/utils";
import { PriceAlertDialog } from "@/components/PriceAlertDialog";
import { WatchlistButton } from "@/components/WatchlistButton";
import { XLayerBadge } from "@/components/dashboard/XLayerSpotlight";
import { CandlestickChart } from "@/components/charts/CandlestickChart";
import { HolderDistributionChart } from "@/components/charts/HolderDistributionChart";
import { RecentTradesTable } from "@/components/charts/RecentTradesTable";
import { useTokenByAddress } from "@/hooks/useMultiChainTokens";
import {
  useOkxCandlesticks,
  useOkxTopHolders,
  useOkxTrades,
  useOkxTokenPriceInfo,
  useOkxTokenBasicInfo,
} from "@/hooks/useOkxData";
import { useState, useMemo } from "react";
import { isXLayerChain, getChainByIndex, SUPPORTED_CHAINS } from "@/lib/chains";
import { Skeleton } from "@/components/ui/skeleton";

type ChartInterval = "1H" | "4H" | "1D" | "1W";

export default function TokenDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const tokenAddress = id || "";
  
  // Get chain from URL param
  const chainParam = searchParams.get("chain");
  
  // Auto-detect token across chains with preferred chain from URL
  const { data: tokenMatch, isLoading: isSearching, error: searchError } = useTokenByAddress(
    tokenAddress, 
    chainParam || undefined
  );
  
  // Use detected chain or URL param, fallback to X Layer
  const chainIndex = tokenMatch?.chainIndex || chainParam || "196";
  const chainConfig = getChainByIndex(chainIndex);
  const isXLayer = isXLayerChain(chainIndex);
  
  // Fetch OKX data
  const { data: basicInfo, isLoading: basicLoading } = useOkxTokenBasicInfo(chainIndex, tokenAddress);
  const { data: priceInfo, isLoading: priceLoading, refetch: refetchPrice } = useOkxTokenPriceInfo(chainIndex, tokenAddress);
  
  // Chart interval state
  const [chartInterval, setChartInterval] = useState<ChartInterval>("1H");
  const { data: candlesticks, isLoading: candlesLoading } = useOkxCandlesticks(
    chainIndex,
    tokenAddress,
    chartInterval,
    100
  );
  
  // Holders and trades
  const { data: holders, isLoading: holdersLoading } = useOkxTopHolders(chainIndex, tokenAddress);
  const { data: trades, isLoading: tradesLoading } = useOkxTrades(chainIndex, tokenAddress, 50);

  // Combine data sources
  const tokenData = useMemo(() => {
    const info = basicInfo || tokenMatch?.basicInfo;
    const price = priceInfo || tokenMatch?.priceInfo;
    
    if (!info && !price) return null;
    
    return {
      symbol: info?.tokenSymbol || price?.tokenSymbol || "???",
      name: info?.tokenName || price?.tokenName || "Unknown Token",
      logo: info?.tokenLogo || price?.tokenLogo,
      decimals: info?.decimals || "18",
      totalSupply: info?.totalSupply,
      website: info?.website,
      twitter: info?.twitter,
      telegram: info?.telegram,
      discord: info?.discord,
      price: price ? parseFloat(price.price) || 0 : 0,
      priceChange24h: price ? parseFloat(price.priceChange24h || "0") : 0,
      priceChange1h: price ? parseFloat(price.priceChange1h || "0") : 0,
      priceChange4h: price ? parseFloat(price.priceChange4h || "0") : 0,
      volume24h: price ? parseFloat(price.volume24h || "0") : 0,
      volumeBuy24h: price ? parseFloat(price.volumeBuy24h || "0") : 0,
      volumeSell24h: price ? parseFloat(price.volumeSell24h || "0") : 0,
      buyCount24h: price ? parseInt(price.buyCount24h || "0") : 0,
      sellCount24h: price ? parseInt(price.sellCount24h || "0") : 0,
      holders: price ? parseInt(price.holders || "0") : 0,
      liquidity: price ? parseFloat(price.liquidity || "0") : 0,
      marketCap: price ? parseFloat(price.marketCap || "0") : 0,
      circulatingSupply: price ? parseFloat(price.circulatingSupply || "0") : 0,
    };
  }, [basicInfo, priceInfo, tokenMatch]);

  const explorerUrl = chainConfig?.explorer || "https://etherscan.io";
  const isLoading = isSearching || basicLoading || priceLoading;
  
  // Buy/Sell ratio
  const buySellRatio = useMemo(() => {
    if (!tokenData) return 50;
    const total = tokenData.buyCount24h + tokenData.sellCount24h;
    if (total === 0) return 50;
    return (tokenData.buyCount24h / total) * 100;
  }, [tokenData]);

  // Show loading state
  if (isLoading && !tokenData) {
    return (
      <Layout>
        <div className="space-y-6 animate-fade-in">
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-[400px] rounded-lg" />
        </div>
      </Layout>
    );
  }

  // Show not found if we have no data
  if (!tokenData && !isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Activity className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Token Not Found</h2>
          <p className="text-muted-foreground mb-2 max-w-md">
            The token with address "{tokenAddress.slice(0, 10)}..." could not be found.
          </p>
          {searchError && (
            <p className="text-xs text-destructive mb-4">
              {(searchError as Error)?.message || "API error occurred"}
            </p>
          )}
          <div className="text-sm text-muted-foreground mb-6 space-y-1">
            <p>This could be because:</p>
            <ul className="list-disc list-inside text-left">
              <li>The token is on a chain not yet indexed</li>
              <li>The contract address is incorrect</li>
              <li>The token has very low liquidity</li>
            </ul>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/tokens">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tokens
              </Button>
            </Link>
            <a
              href={`${explorerUrl}/address/${tokenAddress}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="secondary">
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Explorer
              </Button>
            </a>
          </div>
          {/* Quick chain links */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3">Try viewing on:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUPPORTED_CHAINS.slice(0, 6).map((chain) => (
                <Link
                  key={chain.index}
                  to={`/tokens/${tokenAddress}?chain=${chain.index}`}
                  className="text-xs text-primary/70 hover:text-primary px-2 py-1 rounded border border-border hover:border-primary/40 transition-colors"
                >
                  {chain.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!tokenData) return null;

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Back Button */}
        <div className="flex items-center justify-between">
          <Link to="/tokens" className="inline-flex">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tokens
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchPrice()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Token Header */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {tokenData.logo ? (
            <img
              src={tokenData.logo}
              alt={tokenData.name}
              className="h-16 w-16 rounded-full bg-muted flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${tokenData.symbol}&background=1a1a2e&color=2dd4bf&size=64`;
              }}
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl flex-shrink-0">
              {tokenData.symbol.slice(0, 2)}
            </div>
          )}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{tokenData.name}</h1>
              <span className="text-lg text-muted-foreground uppercase">{tokenData.symbol}</span>
              {isXLayer && <XLayerBadge />}
              <Badge variant="outline" className="text-xs">
                {chainConfig?.name || `Chain ${chainIndex}`}
              </Badge>
            </div>
            
            {/* Contract Address */}
            <div className="flex items-center gap-2 mt-2">
              <span className="font-mono text-xs text-muted-foreground">
                {tokenAddress.slice(0, 10)}...{tokenAddress.slice(-8)}
              </span>
              <a
                href={`${explorerUrl}/address/${tokenAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary/80 hover:text-primary"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* Price Display */}
            <div className="flex items-center gap-4 mt-3">
              <span className="text-3xl font-bold text-foreground">
                {formatTokenPrice(tokenData.price)}
              </span>
              <span
                className={cn(
                  "flex items-center gap-1 font-mono text-lg",
                  tokenData.priceChange24h >= 0 ? "text-success" : "text-destructive"
                )}
              >
                {tokenData.priceChange24h >= 0 ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )}
                {tokenData.priceChange24h >= 0 ? "+" : ""}
                {tokenData.priceChange24h.toFixed(2)}%
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 mt-3">
              <WatchlistButton
                item={{
                  id: tokenAddress,
                  symbol: tokenData.symbol,
                  name: tokenData.name,
                  type: "token",
                }}
              />
              <PriceAlertDialog
                tokenId={tokenAddress}
                symbol={tokenData.symbol}
                name={tokenData.name}
                currentPrice={tokenData.price}
              />
              
              {/* Social Links */}
              <div className="flex items-center gap-2 ml-2">
                {tokenData.website && (
                  <a
                    href={tokenData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                  </a>
                )}
                {tokenData.twitter && (
                  <a
                    href={tokenData.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Twitter className="h-4 w-4" />
                  </a>
                )}
                {tokenData.telegram && (
                  <a
                    href={tokenData.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Market Cap"
            value={tokenData.marketCap > 0 ? formatCurrency(tokenData.marketCap) : "-"}
            icon={DollarSign}
          />
          <StatCard
            title="24h Volume"
            value={tokenData.volume24h > 0 ? formatCurrency(tokenData.volume24h) : "-"}
            icon={Activity}
          />
          <StatCard
            title="Liquidity"
            value={tokenData.liquidity > 0 ? formatCurrency(tokenData.liquidity) : "-"}
            icon={Droplets}
          />
          <StatCard
            title="Holders"
            value={tokenData.holders > 0 ? tokenData.holders.toLocaleString() : "-"}
            icon={Users}
          />
        </div>

        {/* Price Changes Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">1h Change</p>
            <p className={cn(
              "text-xl font-bold font-mono",
              tokenData.priceChange1h >= 0 ? "text-success" : "text-destructive"
            )}>
              {tokenData.priceChange1h >= 0 ? "+" : ""}{tokenData.priceChange1h.toFixed(2)}%
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">4h Change</p>
            <p className={cn(
              "text-xl font-bold font-mono",
              tokenData.priceChange4h >= 0 ? "text-success" : "text-destructive"
            )}>
              {tokenData.priceChange4h >= 0 ? "+" : ""}{tokenData.priceChange4h.toFixed(2)}%
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">24h Change</p>
            <p className={cn(
              "text-xl font-bold font-mono",
              tokenData.priceChange24h >= 0 ? "text-success" : "text-destructive"
            )}>
              {tokenData.priceChange24h >= 0 ? "+" : ""}{tokenData.priceChange24h.toFixed(2)}%
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Buy/Sell Ratio (24h)</p>
            <div className="space-y-1">
              <p className="text-xl font-bold text-foreground">
                {buySellRatio.toFixed(0)}% / {(100 - buySellRatio).toFixed(0)}%
              </p>
              <div className="h-2 bg-destructive/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-success transition-all"
                  style={{ width: `${buySellRatio}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="chart" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="chart">
              <BarChart3 className="h-4 w-4 mr-2" />
              Chart
            </TabsTrigger>
            <TabsTrigger value="holders">
              <Users className="h-4 w-4 mr-2" />
              Holders
            </TabsTrigger>
            <TabsTrigger value="trades">
              <Clock className="h-4 w-4 mr-2" />
              Trades
            </TabsTrigger>
          </TabsList>

          {/* Chart Tab */}
          <TabsContent value="chart">
            <div className="rounded-lg border border-border bg-card p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-lg font-semibold text-foreground">Price Chart</h2>
                <div className="flex gap-2">
                  {(["1H", "4H", "1D", "1W"] as ChartInterval[]).map((interval) => (
                    <Button
                      key={interval}
                      variant={chartInterval === interval ? "default" : "outline"}
                      size="sm"
                      onClick={() => setChartInterval(interval)}
                    >
                      {interval}
                    </Button>
                  ))}
                </div>
              </div>
              <CandlestickChart
                data={candlesticks || []}
                isLoading={candlesLoading}
                height={400}
              />
            </div>
          </TabsContent>

          {/* Holders Tab */}
          <TabsContent value="holders">
            <div className="rounded-lg border border-border bg-card p-4 md:p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Top Holders Distribution
              </h2>
              <HolderDistributionChart
                holders={holders || []}
                isLoading={holdersLoading}
                chainExplorerUrl={explorerUrl}
              />
            </div>
          </TabsContent>

          {/* Trades Tab */}
          <TabsContent value="trades">
            <div className="rounded-lg border border-border bg-card p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Recent Trades
                </h2>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-success">
                    {tokenData.buyCount24h.toLocaleString()} buys
                  </span>
                  <span className="text-destructive">
                    {tokenData.sellCount24h.toLocaleString()} sells
                  </span>
                </div>
              </div>
              <RecentTradesTable
                trades={trades || []}
                isLoading={tradesLoading}
                chainExplorerUrl={explorerUrl}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Token Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Volume Analysis */}
          <div className="rounded-lg border border-border bg-card p-4 md:p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Volume Analysis (24h)</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Volume</span>
                <span className="font-mono text-foreground">
                  {formatCurrency(tokenData.volume24h)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Buy Volume</span>
                <span className="font-mono text-success">
                  {formatCurrency(tokenData.volumeBuy24h)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sell Volume</span>
                <span className="font-mono text-destructive">
                  {formatCurrency(tokenData.volumeSell24h)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Volume/Liquidity</span>
                <span className="font-mono text-foreground">
                  {tokenData.liquidity > 0
                    ? (tokenData.volume24h / tokenData.liquidity).toFixed(2)
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
                  {tokenData.circulatingSupply > 0
                    ? tokenData.circulatingSupply.toLocaleString()
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Supply</span>
                <span className="font-mono text-foreground">
                  {tokenData.totalSupply
                    ? parseFloat(tokenData.totalSupply).toLocaleString()
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Decimals</span>
                <span className="font-mono text-foreground">{tokenData.decimals}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Holder Count</span>
                <span className="font-mono text-foreground">
                  {tokenData.holders > 0 ? tokenData.holders.toLocaleString() : "-"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chain Info Banner */}
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Token data powered by OKX Web3 API on{" "}
                  <span className="font-medium text-foreground">{chainConfig?.name || "Unknown Chain"}</span>
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <a
                href={`${explorerUrl}/token/${tokenAddress}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Explorer
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
