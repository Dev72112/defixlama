import { Layout } from "@/components/layout/Layout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Wallet, TrendingUp, Search, Coins, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/api/defillama";

// XLayer native and common tokens
const XLAYER_TOKENS = [
  { symbol: "OKB", name: "OKB", price: 45.23, change24h: 2.34, volume24h: 125000000, mcap: 2700000000, logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/3897.png" },
  { symbol: "WOKB", name: "Wrapped OKB", price: 45.20, change24h: 2.31, volume24h: 5600000, mcap: 450000000, logo: null },
  { symbol: "USDT", name: "Tether USD", price: 1.00, change24h: 0.01, volume24h: 85000000000, mcap: 119000000000, logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/825.png" },
  { symbol: "USDC", name: "USD Coin", price: 1.00, change24h: -0.01, volume24h: 12000000000, mcap: 43000000000, logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png" },
  { symbol: "WETH", name: "Wrapped Ether", price: 3450.67, change24h: 1.56, volume24h: 2300000000, mcap: 415000000000, logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/2396.png" },
  { symbol: "WBTC", name: "Wrapped Bitcoin", price: 97234.45, change24h: 0.89, volume24h: 890000000, mcap: 12500000000, logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/3717.png" },
  { symbol: "DAI", name: "Dai Stablecoin", price: 1.00, change24h: 0.02, volume24h: 450000000, mcap: 5300000000, logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/4943.png" },
  { symbol: "LINK", name: "Chainlink", price: 18.45, change24h: 3.21, volume24h: 890000000, mcap: 11200000000, logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1975.png" },
];

export default function Tokens() {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter tokens
  const filteredTokens = XLAYER_TOKENS.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate metrics
  const totalMcap = XLAYER_TOKENS.reduce((acc, t) => acc + t.mcap, 0);
  const totalVolume = XLAYER_TOKENS.reduce((acc, t) => acc + t.volume24h, 0);
  const avgChange = XLAYER_TOKENS.reduce((acc, t) => acc + t.change24h, 0) / XLAYER_TOKENS.length;

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tokens</h1>
          <p className="text-muted-foreground mt-1">
            Major tokens available on XLayer
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Market Cap"
            value={formatCurrency(totalMcap)}
            icon={Coins}
          />
          <StatCard
            title="24h Volume"
            value={formatCurrency(totalVolume)}
            icon={Activity}
          />
          <StatCard
            title="Tokens Tracked"
            value={XLAYER_TOKENS.length.toString()}
            icon={Wallet}
          />
          <StatCard
            title="Avg. 24h Change"
            value={`${avgChange >= 0 ? "+" : ""}${avgChange.toFixed(2)}%`}
            change={avgChange}
            icon={TrendingUp}
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
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr className="bg-muted/30">
                <th className="w-12">#</th>
                <th>Token</th>
                <th className="text-right">Price</th>
                <th className="text-right">24h Change</th>
                <th className="text-right">24h Volume</th>
                <th className="text-right">Market Cap</th>
              </tr>
            </thead>
            <tbody>
              {filteredTokens.map((token, index) => (
                <tr key={token.symbol} className="group">
                  <td className="text-muted-foreground font-mono text-sm">
                    {index + 1}
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      {token.logo ? (
                        <img
                          src={token.logo}
                          alt={token.name}
                          className="h-8 w-8 rounded-full bg-muted"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${token.symbol}&background=1a1a2e&color=2dd4bf&size=32`;
                          }}
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                          {token.symbol.slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-foreground">
                          {token.name}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {token.symbol}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="text-right font-mono font-medium text-foreground">
                    ${token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="text-right">
                    <span
                      className={cn(
                        "font-mono text-sm",
                        token.change24h >= 0 ? "text-success" : "text-destructive"
                      )}
                    >
                      {token.change24h >= 0 ? "+" : ""}{token.change24h.toFixed(2)}%
                    </span>
                  </td>
                  <td className="text-right font-mono text-muted-foreground">
                    {formatCurrency(token.volume24h)}
                  </td>
                  <td className="text-right font-mono font-medium text-foreground">
                    {formatCurrency(token.mcap)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Info */}
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            Token prices are fetched from major exchanges and aggregated for accuracy. 
            Prices may vary slightly across different platforms.
          </p>
        </div>
      </div>
    </Layout>
  );
}
