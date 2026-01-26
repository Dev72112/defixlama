import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChainSelector, POPULAR_CHAINS } from "@/components/ChainSelector";
import {
  useOkxTokenRanking,
  useOkxTopGainers,
  useOkxTopLosers,
  useOkxTopVolume,
  useOkxRankingSummary,
} from "@/hooks/useOkxData";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  RefreshCw,
  Flame,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const DEFAULT_CHAIN = '196';

function formatPrice(price: string | number): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (num === 0) return '$0.00';
  if (num < 0.00001) return `$${num.toExponential(2)}`;
  if (num < 1) return `$${num.toFixed(6)}`;
  if (num < 1000) return `$${num.toFixed(2)}`;
  return `$${(num / 1000).toFixed(2)}K`;
}

function formatVolume(volume: string | number): string {
  const num = typeof volume === 'string' ? parseFloat(volume) : volume;
  if (num === 0) return '$0';
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

function formatChange(change: string | number): string {
  const num = typeof change === 'string' ? parseFloat(change) : change;
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
}

function formatHolders(holders: string | number): string {
  const num = typeof holders === 'string' ? parseFloat(holders) : holders;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toFixed(0);
}

function formatTimeAgo(timestamp: number): string {
  if (!timestamp) return '';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

interface RankingTableProps {
  data: any[];
  loading: boolean;
  showRank?: boolean;
  highlightChange?: 'positive' | 'negative' | null;
}

// Mobile card view for tokens
function MobileTokenCard({ token, index }: { token: any; index: number }) {
  const change24h = parseFloat(token.priceChange24h || '0');
  
  return (
    <Link 
      to={`/tokens/${token.tokenContractAddress}`}
      className="touch-card flex items-center gap-3 p-3"
    >
      <span className="text-sm text-muted-foreground w-6">{index + 1}</span>
      {token.tokenLogo ? (
        <img 
          src={token.tokenLogo} 
          alt={token.tokenSymbol} 
          className="w-10 h-10 rounded-full"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder.svg';
          }}
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
          {token.tokenSymbol?.charAt(0)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{token.tokenSymbol}</div>
        <div className="text-xs text-muted-foreground">{formatPrice(token.price)}</div>
      </div>
      <div className="text-right">
        <div className={cn(
          "font-mono text-sm font-bold",
          change24h > 0 ? "text-success" : change24h < 0 ? "text-destructive" : ""
        )}>
          {formatChange(change24h)}
        </div>
        <div className="text-xs text-muted-foreground">{formatVolume(token.volume24h || 0)}</div>
      </div>
    </Link>
  );
}

function RankingTable({ data, loading, showRank = true, highlightChange = null }: RankingTableProps) {
  const isMobile = useIsMobile();
  
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No tokens found for this chain</p>
      </div>
    );
  }

  // Mobile: Card list view
  if (isMobile) {
    return (
      <div className="space-y-2">
        {data.map((token, index) => (
          <MobileTokenCard key={`${token.chainIndex}-${token.tokenContractAddress}`} token={token} index={index} />
        ))}
      </div>
    );
  }

  // Desktop: Table view
  return (
    <div className="rounded-md border overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            {showRank && <th className="text-left p-3 text-xs font-medium text-muted-foreground w-12">#</th>}
            <th className="text-left p-3 text-xs font-medium text-muted-foreground">Token</th>
            <th className="text-right p-3 text-xs font-medium text-muted-foreground">Price</th>
            <th className="text-right p-3 text-xs font-medium text-muted-foreground">Change (24h)</th>
            <th className="text-right p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Volume (24h)</th>
            <th className="text-right p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Liquidity</th>
            <th className="text-right p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Holders</th>
          </tr>
        </thead>
        <tbody>
          {data.map((token, index) => {
            const change24h = parseFloat(token.priceChange24h || '0');
            
            return (
              <tr key={`${token.chainIndex}-${token.tokenContractAddress}`} className="border-b hover:bg-muted/30 transition-colors">
                {showRank && (
                  <td className="p-3 font-medium text-muted-foreground">
                    {index + 1}
                  </td>
                )}
                <td className="p-3">
                  <Link 
                    to={`/tokens/${token.tokenContractAddress}`}
                    className="flex items-center gap-3 hover:underline"
                  >
                    {token.tokenLogo ? (
                      <img 
                        src={token.tokenLogo} 
                        alt={token.tokenSymbol} 
                        className="w-8 h-8 rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                        {token.tokenSymbol?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{token.tokenSymbol}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {token.tokenName}
                      </div>
                    </div>
                  </Link>
                </td>
                <td className="p-3 text-right font-mono">
                  {formatPrice(token.price)}
                </td>
                <td className={cn(
                  "p-3 text-right font-mono font-bold",
                  change24h > 0 ? "text-success" : change24h < 0 ? "text-destructive" : ""
                )}>
                  {formatChange(change24h)}
                </td>
                <td className="p-3 text-right font-mono hidden md:table-cell">
                  {formatVolume(token.volume24h || 0)}
                </td>
                <td className="p-3 text-right font-mono hidden lg:table-cell">
                  {formatVolume(token.liquidity || 0)}
                </td>
                <td className="p-3 text-right font-mono hidden lg:table-cell">
                  {formatHolders(token.holders || 0)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function TokenRanking() {
  const { t } = useTranslation();
  const [chainIndex, setChainIndex] = useState(DEFAULT_CHAIN);
  const [activeTab, setActiveTab] = useState('gainers');
  
  // Summary data for stat cards (always enabled, longer cache)
  const { 
    topGainer, 
    topLoser, 
    topVolume, 
    isLoading: summaryLoading,
    dataUpdatedAt,
    isFetching,
    isStale,
  } = useOkxRankingSummary(chainIndex);

  // Only fetch the active tab's data to avoid rate limiting
  const { data: gainers, isLoading: gainersLoading, refetch: refetchGainers } = useOkxTopGainers(
    chainIndex, 
    50,
    activeTab === 'gainers'
  );
  const { data: losers, isLoading: losersLoading, refetch: refetchLosers } = useOkxTopLosers(
    chainIndex, 
    50,
    activeTab === 'losers'
  );
  const { data: volume, isLoading: volumeLoading, refetch: refetchVolume } = useOkxTopVolume(
    chainIndex, 
    50,
    activeTab === 'volume'
  );
  const { data: marketCap, isLoading: mcLoading, refetch: refetchMC } = useOkxTokenRanking(
    chainIndex, 
    'marketCap', 
    'desc', 
    50,
    activeTab === 'marketcap'
  );

  const chainName = useMemo(() => {
    return POPULAR_CHAINS.find(c => c.index === chainIndex)?.name || 'Unknown Chain';
  }, [chainIndex]);

  const handleRefresh = () => {
    // Only refetch active tab
    if (activeTab === 'gainers') refetchGainers();
    else if (activeTab === 'losers') refetchLosers();
    else if (activeTab === 'volume') refetchVolume();
    else if (activeTab === 'marketcap') refetchMC();
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Token Rankings
            </h1>
            <p className="text-muted-foreground mt-1">
              Explore top performing tokens across chains
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ChainSelector 
              value={chainIndex} 
              onChange={setChainIndex}
              className="w-[180px]"
            />
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isFetching}>
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
            </Button>
            <Badge 
              variant="outline" 
              className={cn(
                "flex items-center gap-1.5",
                isStale && "border-yellow-500/50"
              )}
            >
              <span className={cn(
                "w-2 h-2 rounded-full",
                isStale ? "bg-yellow-500" : "bg-green-500",
                !isStale && "animate-pulse"
              )} />
              {isStale ? "Cached" : "Live"}
            </Badge>
            {dataUpdatedAt > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(dataUpdatedAt)}
              </span>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Top Gainer (24h)
              </div>
              {summaryLoading ? (
                <Skeleton className="h-6 w-24 mt-2" />
              ) : topGainer ? (
                <div className="mt-2">
                  <span className="font-bold">{topGainer.tokenSymbol}</span>
                  <span className="text-green-500 ml-2">
                    {formatChange(topGainer.priceChange24h || 0)}
                  </span>
                </div>
              ) : (
                <div className="mt-2 text-muted-foreground">-</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Top Loser (24h)
              </div>
              {summaryLoading ? (
                <Skeleton className="h-6 w-24 mt-2" />
              ) : topLoser ? (
                <div className="mt-2">
                  <span className="font-bold">{topLoser.tokenSymbol}</span>
                  <span className="text-red-500 ml-2">
                    {formatChange(topLoser.priceChange24h || 0)}
                  </span>
                </div>
              ) : (
                <div className="mt-2 text-muted-foreground">-</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <BarChart3 className="h-4 w-4 text-primary" />
                Highest Volume
              </div>
              {summaryLoading ? (
                <Skeleton className="h-6 w-24 mt-2" />
              ) : topVolume ? (
                <div className="mt-2">
                  <span className="font-bold">{topVolume.tokenSymbol}</span>
                  <span className="text-muted-foreground ml-2">
                    {formatVolume(topVolume.volume24h || 0)}
                  </span>
                </div>
              ) : (
                <div className="mt-2 text-muted-foreground">-</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Flame className="h-4 w-4 text-orange-500" />
                Chain
              </div>
              <div className="mt-2 font-bold">{chainName}</div>
            </CardContent>
          </Card>
        </div>

        {/* Ranking Tabs */}
        <Card>
          <CardHeader className="pb-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
                <TabsTrigger value="gainers" className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Gainers</span>
                </TabsTrigger>
                <TabsTrigger value="losers" className="flex items-center gap-1">
                  <TrendingDown className="h-4 w-4" />
                  <span className="hidden sm:inline">Losers</span>
                </TabsTrigger>
                <TabsTrigger value="volume" className="flex items-center gap-1">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Volume</span>
                </TabsTrigger>
                <TabsTrigger value="marketcap" className="flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  <span className="hidden sm:inline">Market Cap</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="gainers">
                <RankingTable 
                  data={gainers || []} 
                  loading={gainersLoading}
                  highlightChange="positive"
                />
              </TabsContent>
              <TabsContent value="losers">
                <RankingTable 
                  data={losers || []} 
                  loading={losersLoading}
                  highlightChange="negative"
                />
              </TabsContent>
              <TabsContent value="volume">
                <RankingTable 
                  data={volume || []} 
                  loading={volumeLoading}
                />
              </TabsContent>
              <TabsContent value="marketcap">
                <RankingTable 
                  data={marketCap || []} 
                  loading={mcLoading}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
