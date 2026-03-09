import { Layout } from "@/components/layout/Layout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Wallet, TrendingUp, Search, Coins, Activity, ExternalLink, GitCompare, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/api/defillama";
import { useTokenPrices } from "@/hooks/useTokenData";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TOKEN_IDS, XLAYER_COMMUNITY_TOKENS } from "@/lib/api/coingecko";
import { PriceComparison } from "@/components/PriceComparison";
import { WatchlistButton } from "@/components/WatchlistButton";
import { exportToCSV } from "@/lib/export";
import { PriceDisplay, ChangeDisplay } from "@/components/PriceDisplay";
import { ErrorState } from "@/components/ErrorState";
import { useChain } from "@/contexts/ChainContext";
import { ResponsiveDataTable, ResponsiveColumn } from "@/components/ui/responsive-table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProFeatureTeaser } from "@/components/dashboard/ProFeatureTeaser";

export default function Tokens() {
  const { t } = useTranslation();
  const { selectedChain, isAllChains } = useChain();
  const { data: tokens, isLoading, isError, error, refetch } = useTokenPrices();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "overview";
  const [searchQuery, setSearchQuery] = useState("");
  const [showComparison, setShowComparison] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const navigate = useNavigate();
  const { selectedChain: chainForReset } = useChain();
  useEffect(() => { setCurrentPage(1); }, [chainForReset.id]);

  const setTab = (tab: string) => {
    setSearchParams({ tab });
    setCurrentPage(1);
  };

  // Filter tokens by chain and search query
  const chainFilteredTokens = (tokens || []).filter((t: any) => {
    if (isAllChains) return true;
    const chainId = selectedChain.id.toLowerCase();
    const chainSlug = selectedChain.slug.toLowerCase();
    if (t.chain && (t.chain.toLowerCase() === chainId || t.chain.toLowerCase() === chainSlug)) return true;
    if (t.isCommunityToken && chainId === "xlayer") return true;
    if (t.isDbListing && t.chain && (t.chain.toLowerCase() === chainId || t.chain.toLowerCase() === chainSlug)) return true;
    if (!t.chain && !t.isCommunityToken && !t.isDbListing) return true;
    return false;
  });

  const filteredTokens = chainFilteredTokens.filter((t: any) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalMcap = chainFilteredTokens.reduce((acc: number, t: any) => acc + (t.mcap || 0), 0);
  const totalVolume = chainFilteredTokens.reduce((acc: number, t: any) => acc + (t.volume24h || 0), 0);
  const validTokens = chainFilteredTokens.filter((t: any) => t.price > 0);
  const avgChange = validTokens.length > 0
    ? validTokens.reduce((acc: number, t: any) => acc + (t.change24h || 0), 0) / validTokens.length : 0;

  // Movers: top gainers & losers
  const topGainers = useMemo(() => {
    return [...chainFilteredTokens].filter((t: any) => t.price > 0 && t.change24h !== undefined)
      .sort((a: any, b: any) => (b.change24h || 0) - (a.change24h || 0)).slice(0, 15);
  }, [chainFilteredTokens]);

  const topLosers = useMemo(() => {
    return [...chainFilteredTokens].filter((t: any) => t.price > 0 && t.change24h !== undefined)
      .sort((a: any, b: any) => (a.change24h || 0) - (b.change24h || 0)).slice(0, 15);
  }, [chainFilteredTokens]);

  // New listings: community tokens and DB listings
  const newListings = useMemo(() => {
    return chainFilteredTokens.filter((t: any) => t.isCommunityToken || t.isDbListing);
  }, [chainFilteredTokens]);

  const getTokenRouteId = (token: any) => {
    if (token.isDbListing) return token.id;
    if (token.isCommunityToken) {
      const communityMatch = XLAYER_COMMUNITY_TOKENS.find(
        t => t.symbol.toLowerCase() === token.symbol.toLowerCase()
      );
      if (communityMatch?.coingeckoId) return communityMatch.coingeckoId;
      if (token.contract) return token.contract;
    }
    if (token.id) return token.id;
    const cgId = TOKEN_IDS[token.symbol];
    if (cgId) return cgId;
    return token.symbol.toLowerCase();
  };

  const comparisonTokens = (tokens || []).map((t) => ({
    symbol: t.symbol, name: t.name, price: t.price, change24h: t.change24h, logo: t.logo,
  }));

  const handleExport = () => {
    if (!filteredTokens.length) return;
    exportToCSV(
      filteredTokens.map(t => ({
        Symbol: t.symbol, Name: t.name, Price: t.price,
        "24h Change": t.change24h, Volume: t.volume24h, "Market Cap": t.mcap,
      })),
      "tokens"
    );
  };

  const totalPages = Math.ceil(filteredTokens.length / itemsPerPage);
  const paginatedTokens = filteredTokens.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const columns: ResponsiveColumn<any>[] = [
    {
      key: "watchlist", label: "", priority: "desktop", className: "w-10",
      render: (token) => {
        const routeId = getTokenRouteId(token);
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <WatchlistButton item={{ id: routeId, symbol: token.symbol, name: token.name, type: "token" }} />
          </div>
        );
      },
    },
    {
      key: "rank", label: "#", priority: "desktop", className: "w-12",
      render: (_token, index) => (
        <span className="text-muted-foreground font-mono text-sm">
          {(currentPage - 1) * itemsPerPage + index + 1}
        </span>
      ),
    },
    {
      key: "name", label: t("tokens.token"), priority: "always",
      render: (token) => (
        <div className="flex items-center gap-3">
          {token.logo ? (
            <img src={token.logo} alt={token.name} className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-muted flex-shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${token.symbol}&background=1a1a2e&color=2dd4bf&size=32`; }}
            />
          ) : (
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs sm:text-sm flex-shrink-0">
              {token.symbol.slice(0, 2)}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground truncate max-w-[120px] sm:max-w-none">{token.name}</span>
              {token.isCommunityToken && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/20 text-primary font-medium">{t("tokens.community")}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{token.symbol}</span>
              {token.contract && selectedChain.id === "xlayer" && (
                <a href={`https://www.okx.com/explorer/xlayer/address/${encodeURIComponent(token.contract)}`}
                  target="_blank" rel="noopener noreferrer" className="text-xs text-primary/70 hover:text-primary"
                  onClick={(e) => e.stopPropagation()}>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "price", label: t("tokens.price"), priority: "always", align: "right",
      render: (token) => (
        <span className="font-mono font-medium text-foreground whitespace-nowrap">
          <PriceDisplay price={token.price} />
        </span>
      ),
    },
    {
      key: "change24h", label: t("tokens.change24h"), priority: "always", align: "right",
      render: (token) => token.price > 0 ? <ChangeDisplay change={token.change24h} /> : <span className="text-muted-foreground">-</span>,
    },
    {
      key: "volume24h", label: t("tokens.volume"), priority: "expanded", align: "right",
      render: (token) => <span className="font-mono text-muted-foreground whitespace-nowrap">{token.volume24h > 0 ? formatCurrency(token.volume24h) : "-"}</span>,
    },
    {
      key: "mcap", label: t("tokens.mcap"), priority: "expanded", align: "right",
      render: (token) => <span className="font-mono font-medium text-foreground whitespace-nowrap">{token.mcap > 0 ? formatCurrency(token.mcap) : "-"}</span>,
    },
  ];

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{selectedChain.name} {t("tokens.title")}</h1>
            <p className="text-muted-foreground mt-1">{t("tokens.subtitle")}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />{t("tokens.export")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowComparison(true)} className="gap-2">
              <GitCompare className="h-4 w-4" />{t("tokens.compare")}
            </Button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 text-success text-sm font-medium">
              <Activity className="h-4 w-4 animate-pulse" />{t("common.live")}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title={t("tokens.totalMarketCap")} value={formatCurrency(totalMcap)} icon={Coins} loading={isLoading} />
          <StatCard title={t("tokens.volume24h")} value={formatCurrency(totalVolume)} icon={Activity} loading={isLoading} />
          <StatCard title={t("tokens.tokensTracked")} value={chainFilteredTokens.length.toString()} icon={Wallet} loading={isLoading} />
          <StatCard title={t("tokens.avgChange24h")} value={`${avgChange >= 0 ? "+" : ""}${avgChange.toFixed(2)}%`} change={avgChange} icon={TrendingUp} loading={isLoading} />
        </div>

        <Tabs value={currentTab} onValueChange={setTab}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="movers">Top Movers</TabsTrigger>
            <TabsTrigger value="new">New Listings</TabsTrigger>
          </TabsList>

          {/* Tab: Overview */}
          <TabsContent value="overview">
            <div className="space-y-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder={t("tokens.searchPlaceholder")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>

              {isError ? (
                <ErrorState error={error as Error} onRetry={() => refetch()} />
              ) : (
                <ResponsiveDataTable
                  columns={columns}
                  data={paginatedTokens}
                  keyField={(token: any) => token.symbol}
                  onRowClick={(token) => navigate(`/tokens/${getTokenRouteId(token)}`)}
                  loading={isLoading}
                  loadingRows={8}
                  emptyMessage={t("tokens.noTokensFound") || "No tokens found"}
                />
              )}

              {!isLoading && totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    {t("common.showing") || "Showing"} {paginatedTokens.length} {t("common.of") || "of"} {filteredTokens.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                      {t("protocols.prev") || "Prev"}
                    </Button>
                    <span className="text-sm text-muted-foreground">{currentPage} / {totalPages}</span>
                    <Button variant="ghost" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                      {t("protocols.next") || "Next"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab: Top Movers */}
          <TabsContent value="movers">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" /> Top Gainers (24h)
                  </h3>
                  {isLoading ? (
                    <div className="space-y-2">{Array(5).fill(0).map((_, i) => <div key={i} className="rounded-lg border border-border bg-card p-4 animate-pulse h-14" />)}</div>
                  ) : (
                    <div className="space-y-2">
                      {topGainers.map((token: any, i) => (
                        <div key={token.symbol} className="rounded-lg border border-border bg-card p-3 flex items-center justify-between cursor-pointer hover:border-primary/30 transition-colors"
                          onClick={() => navigate(`/tokens/${getTokenRouteId(token)}`)}>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground font-mono text-xs w-5">{i + 1}</span>
                            {token.logo ? (
                              <img src={token.logo} alt={token.name} className="h-6 w-6 rounded-full bg-muted" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-[10px]">{token.symbol.slice(0, 2)}</div>
                            )}
                            <div>
                              <span className="font-medium text-foreground text-sm">{token.name}</span>
                              <span className="text-xs text-muted-foreground ml-2">{token.symbol}</span>
                            </div>
                          </div>
                          <ChangeDisplay change={token.change24h} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-red-500 rotate-180" /> Top Losers (24h)
                  </h3>
                  {isLoading ? (
                    <div className="space-y-2">{Array(5).fill(0).map((_, i) => <div key={i} className="rounded-lg border border-border bg-card p-4 animate-pulse h-14" />)}</div>
                  ) : (
                    <div className="space-y-2">
                      {topLosers.map((token: any, i) => (
                        <div key={token.symbol} className="rounded-lg border border-border bg-card p-3 flex items-center justify-between cursor-pointer hover:border-primary/30 transition-colors"
                          onClick={() => navigate(`/tokens/${getTokenRouteId(token)}`)}>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground font-mono text-xs w-5">{i + 1}</span>
                            {token.logo ? (
                              <img src={token.logo} alt={token.name} className="h-6 w-6 rounded-full bg-muted" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-[10px]">{token.symbol.slice(0, 2)}</div>
                            )}
                            <div>
                              <span className="font-medium text-foreground text-sm">{token.name}</span>
                              <span className="text-xs text-muted-foreground ml-2">{token.symbol}</span>
                            </div>
                          </div>
                          <ChangeDisplay change={token.change24h} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <ProFeatureTeaser
                title="Advanced Token Analytics"
                description="Get whale transaction tracking, smart money flow analysis, and token correlation matrices."
                requiredTier="pro"
                features={["Whale wallet tracking", "Smart money flow detection", "Token correlation analysis"]}
              />
            </div>
          </TabsContent>

          {/* Tab: New Listings */}
          <TabsContent value="new">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Recently added community tokens and new listings</p>
              {isLoading ? (
                <div className="space-y-2">{Array(5).fill(0).map((_, i) => <div key={i} className="rounded-lg border border-border bg-card p-4 animate-pulse h-16" />)}</div>
              ) : newListings.length === 0 ? (
                <div className="rounded-lg border border-border bg-card p-8 text-center">
                  <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No new listings found for this chain</p>
                </div>
              ) : (
                <ResponsiveDataTable
                  columns={columns}
                  data={newListings}
                  keyField={(token: any) => token.symbol}
                  onRowClick={(token) => navigate(`/tokens/${getTokenRouteId(token)}`)}
                  loading={false}
                  loadingRows={5}
                  emptyMessage="No new listings"
                />
              )}
              <ProFeatureTeaser
                title="Early Token Alerts"
                description="Get notified about new token launches, liquidity additions, and listing events before the market."
                requiredTier="pro_plus"
                features={["New listing alerts", "Liquidity event notifications", "Pre-launch token screening"]}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="rounded-lg border border-border bg-card p-4 space-y-2">
          <p className="text-sm text-muted-foreground">{t("tokens.priceInfo")}</p>
          <div className="flex flex-wrap gap-4 pt-2">
            <a href="https://defillama.com/docs/api" target="_blank" rel="noopener noreferrer" className="text-xs text-primary/70 hover:text-primary transition-colors">DefiLlama API Docs →</a>
            {selectedChain.slug && (
              <a href={`https://defillama.com/chain/${selectedChain.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary/70 hover:text-primary transition-colors">{selectedChain.name} on DefiLlama →</a>
            )}
          </div>
        </div>
      </div>

      <PriceComparison tokens={comparisonTokens} isOpen={showComparison} onClose={() => setShowComparison(false)} />
    </Layout>
  );
}
