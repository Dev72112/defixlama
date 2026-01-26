import { Star, TrendingUp, TrendingDown, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useTokenPrices } from "@/hooks/useTokenData";
import { formatTokenPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MiniWatchlistProps {
  className?: string;
  maxItems?: number;
}

export function MiniWatchlist({ className, maxItems = 5 }: MiniWatchlistProps) {
  const { watchlist } = useWatchlist();
  const { data: tokens, isLoading } = useTokenPrices();

  // Get watchlist tokens with prices - watchlist items have symbol property
  const watchlistSymbols = watchlist.map((item) => 
    typeof item === 'string' ? item : item.symbol
  ).map(s => s.toUpperCase());
  
  const watchlistTokens = tokens?.filter((t) =>
    watchlistSymbols.includes(t.symbol.toUpperCase())
  ).slice(0, maxItems) ?? [];

  if (isLoading) {
    return (
      <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" />
            Watchlist
          </h3>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <div className="skeleton h-8 w-8 rounded-full" />
              <div className="flex-1">
                <div className="skeleton h-4 w-16 mb-1" />
                <div className="skeleton h-3 w-12" />
              </div>
              <div className="skeleton h-4 w-14" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (watchlist.length === 0) {
    return (
      <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" />
            Watchlist
          </h3>
          <Link to="/tokens">
            <Button variant="ghost" size="sm" className="text-xs h-7">
              Browse
            </Button>
          </Link>
        </div>
        <div className="text-center py-6 text-muted-foreground">
          <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No tokens in watchlist</p>
          <p className="text-xs mt-1">Add tokens to track them here</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Star className="h-4 w-4 text-primary fill-primary" />
          Watchlist
        </h3>
        <Link to="/tokens">
          <Button variant="ghost" size="sm" className="text-xs h-7 text-primary">
            View All →
          </Button>
        </Link>
      </div>

      <div className="space-y-1">
        {watchlistTokens.map((token) => {
          const change = token.change24h ?? 0;
          const isPositive = change >= 0;

          return (
            <Link
              key={token.symbol}
              to={`/tokens/${token.contract || token.symbol.toLowerCase()}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              {/* Token icon placeholder */}
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {token.symbol.slice(0, 2)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {token.symbol}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {token.name}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="text-sm font-medium text-foreground">
                  {formatTokenPrice(token.price)}
                </p>
                <p className={cn(
                  "text-xs flex items-center justify-end gap-0.5",
                  isPositive ? "text-success" : "text-destructive"
                )}>
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(change).toFixed(2)}%
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
