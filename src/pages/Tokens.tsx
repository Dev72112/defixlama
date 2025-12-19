import { Layout } from "@/components/layout/Layout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Wallet, TrendingUp, Search, Coins, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/api/defillama";

// XLayer native and community tokens
const XLAYER_TOKENS = [
  { symbol: "OKB", name: "OKB", price: 45.23, change24h: 2.34, volume24h: 125000000, mcap: 2700000000, logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/3897.png", contract: null },
  { symbol: "WOKB", name: "Wrapped OKB", price: 45.20, change24h: 2.31, volume24h: 5600000, mcap: 450000000, logo: null, contract: null },
  { symbol: "USDT", name: "Tether USD", price: 1.00, change24h: 0.01, volume24h: 85000000000, mcap: 119000000000, logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/825.png", contract: null },
  { symbol: "USDC", name: "USD Coin", price: 1.00, change24h: -0.01, volume24h: 12000000000, mcap: 43000000000, logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png", contract: null },
  { symbol: "WETH", name: "Wrapped Ether", price: 3450.67, change24h: 1.56, volume24h: 2300000000, mcap: 415000000000, logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/2396.png", contract: null },
  { symbol: "WBTC", name: "Wrapped Bitcoin", price: 97234.45, change24h: 0.89, volume24h: 890000000, mcap: 12500000000, logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/3717.png", contract: null },
  { symbol: "DAI", name: "Dai Stablecoin", price: 1.00, change24h: 0.02, volume24h: 450000000, mcap: 5300000000, logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/4943.png", contract: null },
  { symbol: "LINK", name: "Chainlink", price: 18.45, change24h: 3.21, volume24h: 890000000, mcap: 11200000000, logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1975.png", contract: null },
  // XLayer Community Tokens
  { symbol: "DOG", name: "DOG", price: 0, change24h: 0, volume24h: 0, mcap: 0, logo: null, contract: "0x903358faf7c6304afbd560e9e29b12ab1b8fddc5" },
  { symbol: "NIUMA", name: "NIUMA", price: 0, change24h: 0, volume24h: 0, mcap: 0, logo: null, contract: "0x87669801a1fad6dad9db70d27ac752f452989667" },
  { symbol: "XDOG", name: "XDOG", price: 0, change24h: 0, volume24h: 0, mcap: 0, logo: null, contract: "0x0cc24c51bf89c00c5affbfcf5e856c25ecbdb48e" },
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
        <div className="rounded-lg border border-border bg-card overflow-hidden overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr className="bg-muted/30">
                <th className="w-12">#</th>
                <th>Token</th>
                <th className="text-left hidden lg:table-cell">Contract</th>
                <th className="text-right">Price</th>
                <th className="text-right">24h Change</th>
                <th className="text-right hidden sm:table-cell">24h Volume</th>
                <th className="text-right hidden md:table-cell">Market Cap</th>
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
                  <td className="text-left hidden lg:table-cell">
                    {token.contract ? (
                      <a
                        href={`https://www.okx.com/explorer/xlayer/address/${token.contract}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-primary/70 hover:text-primary transition-colors"
                        title={token.contract}
                      >
                        {token.contract.slice(0, 6)}...{token.contract.slice(-4)}
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-xs">Native</span>
                    )}
                  </td>
                  <td className="text-right font-mono font-medium text-foreground">
                    {token.price > 0 
                      ? `$${token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`
                      : <span className="text-muted-foreground">-</span>
                    }
                  </td>
                  <td className="text-right">
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
                  <td className="text-right font-mono text-muted-foreground hidden sm:table-cell">
                    {token.volume24h > 0 ? formatCurrency(token.volume24h) : "-"}
                  </td>
                  <td className="text-right font-mono font-medium text-foreground hidden md:table-cell">
                    {token.mcap > 0 ? formatCurrency(token.mcap) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Info */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            Token prices are aggregated from major exchanges. Community tokens (DOG, NIUMA, XDOG) are native XLayer tokens - 
            click contract addresses to view on OKX Explorer.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
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
          </div>
        </div>
      </div>
    </Layout>
  );
}
