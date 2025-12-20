import { Layout } from "@/components/layout/Layout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Wallet, TrendingUp, Search, Coins, Activity, ExternalLink, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/api/defillama";
import { useTokenPrices } from "@/hooks/useTokenData";
import { Link, useNavigate } from "react-router-dom";
import { TOKEN_IDS } from "@/lib/api/coingecko";

export default function Tokens() {
  const { data: tokens, isLoading } = useTokenPrices();
  const [searchQuery, setSearchQuery] = useState("");
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

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tokens</h1>
            <p className="text-muted-foreground mt-1">
              Live token prices on XLayer
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 text-success text-sm font-medium">
            <Activity className="h-4 w-4 animate-pulse" />
            Live Prices
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Market Cap"
            value={formatCurrency(totalMcap)}
            icon={Coins}
            loading={isLoading}
          />
          <StatCard
            title="24h Volume"
            value={formatCurrency(totalVolume)}
            icon={Activity}
            loading={isLoading}
          />
          <StatCard
            title="Tokens Tracked"
            value={(tokens?.length || 0).toString()}
            icon={Wallet}
            loading={isLoading}
          />
          <StatCard
            title="Avg. 24h Change"
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
            placeholder="Search tokens..."
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
                <th className="w-12 hidden sm:table-cell">#</th>
                <th className="text-left">Token</th>
                <th className="text-right">Price</th>
                <th className="text-right">24h</th>
                <th className="text-right hidden md:table-cell">Volume</th>
                <th className="text-right hidden lg:table-cell">MCap</th>
                <th className="w-12 hidden sm:table-cell"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i}>
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
                const tokenId = TOKEN_IDS[token.symbol];
                return (
                  <tr
                    key={token.symbol}
                    className="group hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/tokens/${tokenId || token.symbol.toLowerCase()}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/tokens/${tokenId || token.symbol.toLowerCase()}`); }}
                  >
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
                          <span className="font-medium text-foreground block truncate">
                            {token.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {token.symbol}
                            </span>
                            {token.contract && (
                              <a
                                href={`https://www.okx.com/explorer/xlayer/address/${token.contract}`}
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
                      {token.price > 0 
                        ? `$${token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: token.price < 1 ? 6 : 2 })}`
                        : <span className="text-muted-foreground">-</span>
                      }
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
                      {tokenId && (
                        <Link 
                          to={`/tokens/${tokenId}`}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      )}
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
            Token prices are fetched live from CoinGecko with 5-second refresh. Community tokens (DOG, NIUMA, XDOG) are native XLayer tokens.
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
    </Layout>
  );
}
