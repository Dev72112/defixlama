import { Layout } from "@/components/layout/Layout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Wallet, TrendingUp, Coins, Activity, ExternalLink, ChevronRight, GitCompare, Download, Globe, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/api/defillama";
import { useNavigate } from "react-router-dom";
import { PriceComparison } from "@/components/PriceComparison";
import { WatchlistButton } from "@/components/WatchlistButton";
import { exportToCSV } from "@/lib/export";
import { PriceDisplay, ChangeDisplay } from "@/components/PriceDisplay";
import { ChainSelector } from "@/components/ChainSelector";
import { XLayerBadge } from "@/components/dashboard/XLayerSpotlight";
import { TokenSearchInput } from "@/components/TokenSearchInput";
import { useMultiChainTokens, useAllChainsStats, MultiChainToken } from "@/hooks/useMultiChainTokens";
import { isXLayerChain, getChainExplorerUrlByIndex, ALL_CHAINS_ID, SUPPORTED_CHAINS } from "@/lib/chains";
import { Skeleton } from "@/components/ui/skeleton";

export default function Tokens() {
  const { t } = useTranslation();
  const [selectedChain, setSelectedChain] = useState("196"); // Default to X Layer
  const [showComparison, setShowComparison] = useState(false);
  const [sortBy, setSortBy] = useState<'volume24h' | 'marketCap' | 'change24h'>('volume24h');
  const navigate = useNavigate();

  const isAllChains = selectedChain === ALL_CHAINS_ID;
  
  // Fetch tokens from OKX API
  const { data: tokens, isLoading, isError, error, refetch } = useMultiChainTokens(selectedChain, sortBy, 100);
  
  // Get all chains stats for aggregate view
  const { data: allChainsStats, isLoading: statsLoading } = useAllChainsStats();

  // Calculate metrics
  const stats = useMemo(() => {
    if (isAllChains && allChainsStats) {
      return {
        totalVolume: allChainsStats.totalVolume,
        totalMarketCap: allChainsStats.totalMarketCap,
        tokenCount: allChainsStats.tokenCount,
        avgChange: 0, // Not easily calculable
      };
    }
    
    const list = tokens || [];
    const totalVolume = list.reduce((acc, t) => acc + (t.volume24h || 0), 0);
    const totalMarketCap = list.reduce((acc, t) => acc + (t.marketCap || 0), 0);
    const validTokens = list.filter(t => t.priceChange24h !== 0);
    const avgChange = validTokens.length > 0
      ? validTokens.reduce((acc, t) => acc + t.priceChange24h, 0) / validTokens.length
      : 0;
    
    return { totalVolume, totalMarketCap, tokenCount: list.length, avgChange };
  }, [tokens, allChainsStats, isAllChains]);

  // Prepare tokens for price comparison
  const comparisonTokens = useMemo(() => 
    (tokens || []).map(t => ({
      symbol: t.symbol,
      name: t.name,
      price: t.price,
      change24h: t.priceChange24h,
      logo: t.logo,
    })),
    [tokens]
  );

  const handleExport = () => {
    if (!tokens?.length) return;
    exportToCSV(
      tokens.map(t => ({
        Chain: t.chainName,
        Symbol: t.symbol,
        Name: t.name,
        Price: t.price,
        "24h Change": t.priceChange24h,
        Volume: t.volume24h,
        "Market Cap": t.marketCap,
        Holders: t.holders,
        Contract: t.contractAddress,
      })),
      `tokens-${selectedChain}`
    );
  };

  const handleTokenSelect = (token: MultiChainToken) => {
    navigate(`/tokens/${token.contractAddress}?chain=${token.chainIndex}`);
  };

  const getChainName = (chainIndex: string) => {
    return SUPPORTED_CHAINS.find(c => c.index === chainIndex)?.name || `Chain ${chainIndex}`;
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("tokens.title")}</h1>
            <p className="text-muted-foreground mt-1">
              {isAllChains ? "Tokens across all supported chains" : t("tokens.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <ChainSelector 
              value={selectedChain} 
              onChange={setSelectedChain}
              highlightFeatured
              showAllChains
              className="w-[180px]"
            />
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              {t("tokens.export")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowComparison(true)}
              className="gap-2"
            >
              <GitCompare className="h-4 w-4" />
              {t("tokens.compare")}
            </Button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 text-success text-sm font-medium">
              <Activity className="h-4 w-4 animate-pulse" />
              {t("common.live")}
            </div>
          </div>
        </div>

        {/* All Chains Banner */}
        {isAllChains && (
          <div className="rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-4">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">Multi-Chain View</p>
                <p className="text-sm text-muted-foreground">
                  Showing top tokens from {allChainsStats?.chainCount || 7} chains including Ethereum, X Layer, Arbitrum, Base, and more
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t("tokens.totalMarketCap")}
            value={formatCurrency(stats.totalMarketCap)}
            icon={Coins}
            loading={isLoading || (isAllChains && statsLoading)}
          />
          <StatCard
            title={t("tokens.volume24h")}
            value={formatCurrency(stats.totalVolume)}
            icon={Activity}
            loading={isLoading || (isAllChains && statsLoading)}
          />
          <StatCard
            title={t("tokens.tokensTracked")}
            value={stats.tokenCount.toString()}
            icon={Wallet}
            loading={isLoading}
          />
          <StatCard
            title={t("tokens.avgChange24h")}
            value={`${stats.avgChange >= 0 ? "+" : ""}${stats.avgChange.toFixed(2)}%`}
            change={stats.avgChange}
            icon={TrendingUp}
            loading={isLoading}
          />
        </div>

        {/* Search + Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <TokenSearchInput 
            chainIndex={selectedChain}
            onSelect={handleTokenSelect}
            className="flex-1 max-w-lg"
            placeholder="Search by token name or contract address..."
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort:</span>
            <div className="flex gap-1">
              {(['volume24h', 'marketCap', 'change24h'] as const).map((sort) => (
                <Badge
                  key={sort}
                  variant={sortBy === sort ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setSortBy(sort)}
                >
                  {sort === 'volume24h' ? 'Volume' : sort === 'marketCap' ? 'Market Cap' : '24h Change'}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Tokens Table */}
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr className="bg-muted/30">
                <th className="w-10 hidden sm:table-cell"></th>
                <th className="w-12 hidden sm:table-cell">#</th>
                <th className="text-left">{t("tokens.token")}</th>
                {isAllChains && <th className="text-left hidden md:table-cell">Chain</th>}
                <th className="text-right">{t("tokens.price")}</th>
                <th className="text-right">{t("tokens.change24h")}</th>
                <th className="text-right hidden md:table-cell">{t("tokens.volume")}</th>
                <th className="text-right hidden lg:table-cell">{t("tokens.mcap")}</th>
                <th className="text-right hidden lg:table-cell">Holders</th>
                <th className="w-12 hidden sm:table-cell"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(10).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="hidden sm:table-cell"></td>
                    <td className="hidden sm:table-cell"><Skeleton className="h-4 w-6" /></td>
                    <td><Skeleton className="h-8 w-32" /></td>
                    {isAllChains && <td className="hidden md:table-cell"><Skeleton className="h-4 w-16" /></td>}
                    <td><Skeleton className="h-4 w-20 ml-auto" /></td>
                    <td><Skeleton className="h-4 w-16 ml-auto" /></td>
                    <td className="hidden md:table-cell"><Skeleton className="h-4 w-20 ml-auto" /></td>
                    <td className="hidden lg:table-cell"><Skeleton className="h-4 w-20 ml-auto" /></td>
                    <td className="hidden lg:table-cell"><Skeleton className="h-4 w-12 ml-auto" /></td>
                    <td className="hidden sm:table-cell"></td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={isAllChains ? 10 : 9} className="py-8">
                    <div className="flex flex-col items-center justify-center text-center px-4">
                      <AlertCircle className="h-10 w-10 text-amber-500 mb-3" />
                      <p className="font-medium text-foreground mb-1">Data temporarily unavailable</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        The OKX API is experiencing issues. Please try again in a moment.
                      </p>
                      <Button onClick={() => refetch()} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : tokens?.length === 0 ? (
                <tr>
                  <td colSpan={isAllChains ? 10 : 9} className="py-12">
                    <div className="flex flex-col items-center justify-center text-center px-4">
                      <Coins className="h-10 w-10 text-muted-foreground mb-3" />
                      <p className="font-medium text-foreground mb-1">No tokens found</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        {isAllChains 
                          ? "Unable to load tokens from any chain. This may be a temporary issue."
                          : `No tokens found for ${getChainName(selectedChain)}. Try selecting a different chain.`}
                      </p>
                      <div className="flex gap-2">
                        <Button onClick={() => refetch()} variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Retry
                        </Button>
                        {!isAllChains && (
                          <Button onClick={() => setSelectedChain(ALL_CHAINS_ID)} variant="secondary" size="sm">
                            <Globe className="h-4 w-4 mr-2" />
                            View All Chains
                          </Button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : tokens?.map((token, index) => {
                const isXLayer = isXLayerChain(token.chainIndex);
                const explorerUrl = getChainExplorerUrlByIndex(token.chainIndex, token.contractAddress);
                
                return (
                  <tr
                    key={token.id}
                    className={cn(
                      "group hover:bg-muted/30 transition-colors cursor-pointer",
                      isXLayer && "bg-primary/5 border-l-2 border-l-primary/50"
                    )}
                    onClick={() => navigate(`/tokens/${token.contractAddress}?chain=${token.chainIndex}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/tokens/${token.contractAddress}?chain=${token.chainIndex}`); }}
                  >
                    <td className="hidden sm:table-cell">
                      <WatchlistButton
                        item={{
                          id: token.contractAddress,
                          symbol: token.symbol,
                          name: token.name,
                          type: "token",
                        }}
                      />
                    </td>
                    <td className="text-muted-foreground font-mono text-sm hidden sm:table-cell">
                      {index + 1}
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        {token.logo ? (
                          <img
                            src={token.logo}
                            alt={token.name}
                            className="h-8 w-8 rounded-full bg-muted flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${token.symbol}&background=1a1a2e&color=2dd4bf&size=32`;
                            }}
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                            {token.symbol.slice(0, 2)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground block truncate">
                              {token.name}
                            </span>
                            {isXLayer && <XLayerBadge />}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {token.symbol}
                            </span>
                            {explorerUrl && (
                              <a
                                href={explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary/70 hover:text-primary"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    {isAllChains && (
                      <td className="hidden md:table-cell">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[10px]",
                            isXLayer && "border-primary/40 bg-primary/10 text-primary"
                          )}
                        >
                          {token.chainName}
                        </Badge>
                      </td>
                    )}
                    <td className="text-right font-mono font-medium text-foreground whitespace-nowrap">
                      <PriceDisplay price={token.price} />
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <ChangeDisplay change={token.priceChange24h} />
                    </td>
                    <td className="text-right font-mono text-muted-foreground hidden md:table-cell whitespace-nowrap">
                      {token.volume24h > 0 ? formatCurrency(token.volume24h) : "-"}
                    </td>
                    <td className="text-right font-mono font-medium text-foreground hidden lg:table-cell whitespace-nowrap">
                      {token.marketCap > 0 ? formatCurrency(token.marketCap) : "-"}
                    </td>
                    <td className="text-right font-mono text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                      {token.holders > 0 ? token.holders.toLocaleString() : "-"}
                    </td>
                    <td className="hidden sm:table-cell">
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Info */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            Token data powered by OKX Web3 API. Prices update every 60 seconds.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <a
              href="https://www.okx.com/web3/build/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary/70 hover:text-primary transition-colors"
            >
              OKX Web3 API Docs →
            </a>
            <a
              href="https://www.okx.com/xlayer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary/70 hover:text-primary transition-colors"
            >
              X Layer →
            </a>
          </div>
        </div>
      </div>

      {/* Price Comparison Modal */}
      <PriceComparison
        tokens={comparisonTokens}
        isOpen={showComparison}
        onClose={() => setShowComparison(false)}
      />
    </Layout>
  );
}
