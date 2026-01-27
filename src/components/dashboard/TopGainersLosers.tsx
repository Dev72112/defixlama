import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOkxGainersAndLosers } from "@/hooks/useOkxData";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopGainersLosersProps {
  chainIndex?: string;
  limit?: number;
}

function formatPrice(price: string | number): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (num === 0) return '$0.00';
  if (num < 0.00001) return `$${num.toExponential(2)}`;
  if (num < 1) return `$${num.toFixed(6)}`;
  return `$${num.toFixed(2)}`;
}

function formatChange(change: string | number): string {
  const num = typeof change === 'string' ? parseFloat(change) : change;
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
}

export function TopGainersLosers({ chainIndex = '196', limit = 5 }: TopGainersLosersProps) {
  const { gainers, losers, isLoading } = useOkxGainersAndLosers(chainIndex, limit);

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Top Gainers */}
      <Card className="card-hover">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-success/10">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            Top Gainers (24h)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {gainers.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                No data available
              </p>
            ) : (
              gainers.map((token, idx) => (
                <Link
                  key={`${token.chainIndex}-${token.tokenContractAddress}`}
                  to={`/tokens/${token.tokenContractAddress}`}
                  className={cn(
                    "flex items-center justify-between p-2.5 rounded-lg hover:bg-success/5 transition-all duration-200 group stagger-item",
                    "border border-transparent hover:border-success/20"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-xs font-medium w-5 h-5 flex items-center justify-center rounded bg-muted/50">{idx + 1}</span>
                    {token.tokenLogo ? (
                      <img
                        src={token.tokenLogo}
                        alt={token.tokenSymbol}
                        className="w-8 h-8 rounded-full ring-2 ring-success/20 group-hover:ring-success/40 transition-all"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-xs font-bold text-success">
                        {token.tokenSymbol?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-sm group-hover:text-success transition-colors">{token.tokenSymbol}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatPrice(token.price)}
                      </div>
                    </div>
                  </div>
                  <span className="text-success font-mono text-sm font-semibold bg-success/10 px-2 py-0.5 rounded">
                    {formatChange(token.priceChange24h || 0)}
                  </span>
                </Link>
              ))
            )}
          </div>
          <Link
            to="/token-ranking"
            className="flex items-center justify-center gap-1 text-sm text-primary mt-4 hover:underline font-medium"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>

      {/* Top Losers */}
      <Card className="card-hover">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-destructive/10">
              <TrendingDown className="h-5 w-5 text-destructive" />
            </div>
            Top Losers (24h)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {losers.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                No data available
              </p>
            ) : (
              losers.map((token, idx) => (
                <Link
                  key={`${token.chainIndex}-${token.tokenContractAddress}`}
                  to={`/tokens/${token.tokenContractAddress}`}
                  className={cn(
                    "flex items-center justify-between p-2.5 rounded-lg hover:bg-destructive/5 transition-all duration-200 group stagger-item",
                    "border border-transparent hover:border-destructive/20"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-xs font-medium w-5 h-5 flex items-center justify-center rounded bg-muted/50">{idx + 1}</span>
                    {token.tokenLogo ? (
                      <img
                        src={token.tokenLogo}
                        alt={token.tokenSymbol}
                        className="w-8 h-8 rounded-full ring-2 ring-destructive/20 group-hover:ring-destructive/40 transition-all"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center text-xs font-bold text-destructive">
                        {token.tokenSymbol?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-sm group-hover:text-destructive transition-colors">{token.tokenSymbol}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatPrice(token.price)}
                      </div>
                    </div>
                  </div>
                  <span className="text-destructive font-mono text-sm font-semibold bg-destructive/10 px-2 py-0.5 rounded">
                    {formatChange(token.priceChange24h || 0)}
                  </span>
                </Link>
              ))
            )}
          </div>
          <Link
            to="/token-ranking"
            className="flex items-center justify-center gap-1 text-sm text-primary mt-4 hover:underline font-medium"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default TopGainersLosers;
