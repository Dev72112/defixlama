import { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/api/defillama";
import { Link } from "react-router-dom";

interface TopMoversProps {
  protocols: any[];
  tokens?: any[];
  loading?: boolean;
  limit?: number;
}

export function TopMovers({ protocols, tokens = [], loading, limit = 5 }: TopMoversProps) {
  const { gainers, losers } = useMemo(() => {
    const protocolItems = protocols
      .filter((p) => p.change_1d !== undefined && p.change_1d !== null && p.tvl > 0)
      .map((p) => ({
        id: p.slug || p.name,
        name: p.name,
        symbol: p.symbol,
        change: p.change_1d,
        value: p.tvl,
        type: "protocol" as const,
        logo: p.logo,
      }));

    const tokenItems = tokens
      .filter((t) => t.change24h !== undefined && t.change24h !== null && t.price > 0)
      .map((t) => ({
        id: t.id || t.symbol.toLowerCase(),
        name: t.name,
        symbol: t.symbol,
        change: t.change24h,
        value: t.price,
        type: "token" as const,
        logo: t.logo,
      }));

    const allItems = [...protocolItems, ...tokenItems];
    const sorted = allItems.sort((a, b) => b.change - a.change);

    return {
      gainers: sorted.filter((i) => i.change > 0).slice(0, limit),
      losers: sorted.filter((i) => i.change < 0).slice(-limit).reverse(),
    };
  }, [protocols, tokens, limit]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="skeleton h-5 w-32 mb-4" />
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="skeleton h-8 w-8 rounded-full" />
              <div className="flex-1">
                <div className="skeleton h-4 w-24 mb-1" />
                <div className="skeleton h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-3 sm:gap-4">
      {/* Gainers */}
      <div className="rounded-lg border border-success/20 bg-success/5 p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-success" />
          <h3 className="font-semibold text-foreground">Top Gainers</h3>
        </div>
        {gainers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No gainers today</p>
        ) : (
          <div className="space-y-2">
            {gainers.map((item, i) => (
              <Link
                key={item.id}
                to={item.type === "protocol" ? `/protocols/${item.id}` : `/tokens/${item.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-success/10 transition-colors"
              >
                <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                {item.logo ? (
                  <img src={item.logo} alt={item.name} className="h-7 w-7 rounded-full bg-muted" />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {item.symbol?.slice(0, 2) || item.name.slice(0, 2)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.type === "token" ? `$${item.value.toFixed(item.value < 1 ? 6 : 2)}` : formatCurrency(item.value)}
                  </p>
                </div>
                <span className="text-success font-mono text-sm font-medium">
                  +{item.change.toFixed(2)}%
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Losers */}
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="h-5 w-5 text-destructive" />
          <h3 className="font-semibold text-foreground">Top Losers</h3>
        </div>
        {losers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No losers today</p>
        ) : (
          <div className="space-y-2">
            {losers.map((item, i) => (
              <Link
                key={item.id}
                to={item.type === "protocol" ? `/protocols/${item.id}` : `/tokens/${item.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-destructive/10 transition-colors"
              >
                <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                {item.logo ? (
                  <img src={item.logo} alt={item.name} className="h-7 w-7 rounded-full bg-muted" />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {item.symbol?.slice(0, 2) || item.name.slice(0, 2)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.type === "token" ? `$${item.value.toFixed(item.value < 1 ? 6 : 2)}` : formatCurrency(item.value)}
                  </p>
                </div>
                <span className="text-destructive font-mono text-sm font-medium">
                  {item.change.toFixed(2)}%
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
