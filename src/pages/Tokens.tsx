import { Layout } from "@/components/layout/Layout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Wallet, TrendingUp, Search, Coins, Activity, ExternalLink, ChevronRight, GitCompare, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/api/defillama";
import { useTokenPrices } from "@/hooks/useTokenData";
import { useNavigate } from "react-router-dom";
import { TOKEN_IDS, XLAYER_COMMUNITY_TOKENS } from "@/lib/api/coingecko";
import { PriceComparison } from "@/components/PriceComparison";
import { WatchlistButton } from "@/components/WatchlistButton";
import { exportToCSV } from "@/lib/export";

export default function Tokens() {
  const { t } = useTranslation();
  const { data: tokens, isLoading } = useTokenPrices();
  const [searchQuery, setSearchQuery] = useState("");
  const [showComparison, setShowComparison] = useState(false);
  const navigate = useNavigate();

  // Filter tokens
  const filteredTokens = (tokens || []).filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate metrics
  const totalMcap = (tokens || []).reduce((acc, t) => acc + (t.mcap || 0), 0);
  const totalVolume = (tokens || []).reduce((acc, t) => acc + (t.volume24h || 0), 0);
  const validTokens = (tokens || []).filter((t) => t.price > 0);
  const avgChange = validTokens.length > 0 
    ? validTokens.reduce((acc, t) => acc + (t.change24h || 0), 0) / validTokens.length 
    : 0;

  // Get the correct route ID for each token
  const getTokenRouteId = (token: any) => {
    // For community tokens, use the contract address
    if (token.isCommunityToken && token.contract) {
      return token.contract;
    }
    
    // For standard tokens, use CoinGecko ID if available, otherwise the stored id
    if (token.id) {
      return token.id;
    }
    
    // Check if we have a mapping for this symbol
    const cgId = TOKEN_IDS[token.symbol];
    if (cgId) {
      return cgId;
    }
    
    // Fallback to lowercase symbol
    return token.symbol.toLowerCase();
  };

  // Prepare tokens for price comparison component
  const comparisonTokens = (tokens || []).map((t) => ({
    symbol: t.symbol,
    name: t.name,
    price: t.price,
    change24h: t.change24h,
    logo: t.logo,
  }));

  const handleExport = () => {
    if (!filteredTokens.length) return;
    exportToCSV(
      filteredTokens.map(t => ({
        Symbol: t.symbol,
        Name: t.name,
        Price: t.price,
        "24h Change": t.change24h,
        Volume: t.volume24h,
        "Market Cap": t.mcap,
      })),
      "tokens"
    );
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("tokens.title")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("tokens.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-3">
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

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t("tokens.totalMarketCap")}
            value={formatCurrency(totalMcap)}
            icon={Coins}
            loading={isLoading}
          />
          <StatCard
            title={t("tokens.volume24h")}
            value={formatCurrency(totalVolume)}
            icon={Activity}
            loading={isLoading}
          />
          <StatCard
            title={t("tokens.tokensTracked")}
            value={(tokens?.length || 0).toString()}
            icon={Wallet}
            loading={isLoading}
          />
          <StatCard
            title={t("tokens.avgChange24h")}
            value={`${avgChange >= 0 ? "+" : ""}${avgChange.toFixed(2)}%`}
            change={avgChange}
            icon={TrendingUp}
            loading={isLoading}
          />
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("tokens.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tokens Table */}
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr className="bg-muted/30">
                <th className="w-10 hidden sm:table-cell"></th>
                <th className="w-12 hidden sm:table-cell">#</th>
                <th className="text-left">{t("tokens.token")}</th>
                <th className="text-right">{t("tokens.price")}</th>
                <th className="text-right">{t("tokens.change24h")}</th>
                <th className="text-right hidden md:table-cell">{t("tokens.volume")}</th>
                <th className="text-right hidden lg:table-cell">{t("tokens.mcap")}</th>
                <th className="w-12 hidden sm:table-cell"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="hidden sm:table-cell"></td>
                    <td className="hidden sm:table-cell"><div className="skeleton h-4 w-6" /></td>
                    <td><div className="skeleton h-8 w-32" /></td>
                    <td><div className="skeleton h-4 w-20 ml-auto" /></td>
                    <td><div className="skeleton h-4 w-16 ml-auto" /></td>
                    <td className="hidden md:table-cell"><div className="skeleton h-4 w-20 ml-auto" /></td>
                    <td className="hidden lg:table-cell"><div className="skeleton h-4 w-20 ml-auto" /></td>
                    <td className="hidden sm:table-cell"></td>
                  </tr>
                ))
              ) : filteredTokens.map((token, index) => {
                const routeId = getTokenRouteId(token);
                const isCommunity = token.isCommunityToken;
                return (
                  <tr
                    key={token.symbol}
                    className={cn(
                      "group hover:bg-muted/30 transition-colors cursor-pointer",
                      isCommunity && "bg-primary/5"
                    )}
                    onClick={() => navigate(`/tokens/${routeId}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/tokens/${routeId}`); }}
                  >
                    <td className="hidden sm:table-cell">
                      <WatchlistButton
                        item={{
                          id: routeId,
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
                            {isCommunity && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/20 text-primary font-medium">
                                {t("tokens.community")}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {token.symbol}
                            </span>
                            {token.contract && (
                                <a
                                href={`https://www.okx.com/explorer/xlayer/address/${encodeURIComponent(token.contract)}`}
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
                    <td className="text-right font-mono font-medium text-foreground whitespace-nowrap">
                      {token.price > 0 ? (
                        (() => {
                          const p = token.price;
                          if (p >= 1) return `$${p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                          // small prices: show up to 8 decimals, trim trailing zeros
                          const s = p.toFixed(8).replace(/(?:\.0+|(?<=\.[0-9]*?)0+)$/, "");
                          return `$${s}`;
                        })()
                      ) : (
                        <span className="text-muted-foreground">{t("tokens.fetching")}</span>
                      )}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {token.price > 0 ? (
                        <span
                          className={cn(
                            "font-mono text-sm",
                            token.change24h >= 0 ? "text-success" : "text-destructive"
                          )}
                        >
                          {token.change24h >= 0 ? "+" : ""}{token.change24h.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="text-right font-mono text-muted-foreground hidden md:table-cell whitespace-nowrap">
                      {token.volume24h > 0 ? formatCurrency(token.volume24h) : "-"}
                    </td>
                    <td className="text-right font-mono font-medium text-foreground hidden lg:table-cell whitespace-nowrap">
                      {token.mcap > 0 ? formatCurrency(token.mcap) : "-"}
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
            {t("tokens.priceInfo")}
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <a
              href="https://defillama.com/docs/api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary/70 hover:text-primary transition-colors"
            >
              DefiLlama API Docs →
            </a>
            <a
              href="https://www.okx.com/xlayer/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary/70 hover:text-primary transition-colors"
            >
              XLayer Docs →
            </a>
            <a
              href="https://defillama.com/chain/xlayer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary/70 hover:text-primary transition-colors"
            >
              XLayer on DefiLlama →
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
