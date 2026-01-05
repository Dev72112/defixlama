import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChainSelector, POPULAR_CHAINS } from "@/components/ChainSelector";
import {
  useOkxTokenRanking,
  useOkxTopGainers,
  useOkxTopLosers,
  useOkxTopVolume,
} from "@/hooks/useOkxData";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  RefreshCw,
  ExternalLink,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_CHAIN = '196'; // X Layer

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

interface RankingTableProps {
  data: any[];
  loading: boolean;
  showRank?: boolean;
  highlightChange?: 'positive' | 'negative' | null;
}

function RankingTable({ data, loading, showRank = true, highlightChange = null }: RankingTableProps) {
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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {showRank && <TableHead className="w-12">#</TableHead>}
            <TableHead>Token</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">5m</TableHead>
            <TableHead className="text-right">1h</TableHead>
            <TableHead className="text-right">24h</TableHead>
            <TableHead className="text-right">Volume (24h)</TableHead>
            <TableHead className="text-right">Liquidity</TableHead>
            <TableHead className="text-right">Holders</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((token, index) => {
            const change24h = parseFloat(token.priceChange24h || '0');
            const change1h = parseFloat(token.priceChange1h || '0');
            const change5m = parseFloat(token.priceChange5m || '0');
            
            return (
              <TableRow key={`${token.chainIndex}-${token.tokenContractAddress}`}>
                {showRank && (
                  <TableCell className="font-medium text-muted-foreground">
                    {index + 1}
                  </TableCell>
                )}
                <TableCell>
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
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatPrice(token.price)}
                </TableCell>
                <TableCell className={cn(
                  "text-right font-mono",
                  change5m > 0 ? "text-green-500" : change5m < 0 ? "text-red-500" : ""
                )}>
                  {formatChange(change5m)}
                </TableCell>
                <TableCell className={cn(
                  "text-right font-mono",
                  change1h > 0 ? "text-green-500" : change1h < 0 ? "text-red-500" : ""
                )}>
                  {formatChange(change1h)}
                </TableCell>
                <TableCell className={cn(
                  "text-right font-mono",
                  change24h > 0 ? "text-green-500" : change24h < 0 ? "text-red-500" : "",
                  highlightChange === 'positive' && "font-bold",
                  highlightChange === 'negative' && "font-bold"
                )}>
                  {formatChange(change24h)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatVolume(token.volume24h || 0)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatVolume(token.liquidity || 0)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatHolders(token.holders || 0)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default function TokenRanking() {
  const { t } = useTranslation();
  const [chainIndex, setChainIndex] = useState(DEFAULT_CHAIN);
  const [activeTab, setActiveTab] = useState('gainers');
  
  // Fetch different rankings
  const { data: gainers, isLoading: gainersLoading, refetch: refetchGainers } = useOkxTopGainers(chainIndex, 50);
  const { data: losers, isLoading: losersLoading, refetch: refetchLosers } = useOkxTopLosers(chainIndex, 50);
  const { data: volume, isLoading: volumeLoading, refetch: refetchVolume } = useOkxTopVolume(chainIndex, 50);
  const { data: marketCap, isLoading: mcLoading, refetch: refetchMC } = useOkxTokenRanking(chainIndex, 'marketCap', 'desc', 50);

  const chainName = useMemo(() => {
    return POPULAR_CHAINS.find(c => c.index === chainIndex)?.name || 'Unknown Chain';
  }, [chainIndex]);

  const handleRefresh = () => {
    refetchGainers();
    refetchLosers();
    refetchVolume();
    refetchMC();
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
            <Button variant="outline" size="icon" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Badge variant="outline" className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live Data
            </Badge>
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
              {gainersLoading ? (
                <Skeleton className="h-6 w-24 mt-2" />
              ) : gainers?.[0] ? (
                <div className="mt-2">
                  <span className="font-bold">{gainers[0].tokenSymbol}</span>
                  <span className="text-green-500 ml-2">
                    {formatChange(gainers[0].priceChange24h || 0)}
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
              {losersLoading ? (
                <Skeleton className="h-6 w-24 mt-2" />
              ) : losers?.[0] ? (
                <div className="mt-2">
                  <span className="font-bold">{losers[0].tokenSymbol}</span>
                  <span className="text-red-500 ml-2">
                    {formatChange(losers[0].priceChange24h || 0)}
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
              {volumeLoading ? (
                <Skeleton className="h-6 w-24 mt-2" />
              ) : volume?.[0] ? (
                <div className="mt-2">
                  <span className="font-bold">{volume[0].tokenSymbol}</span>
                  <span className="text-muted-foreground ml-2">
                    {formatVolume(volume[0].volume24h || 0)}
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
