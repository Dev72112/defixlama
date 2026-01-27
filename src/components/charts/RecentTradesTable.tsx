import { OkxTrade } from "@/lib/api/okx";
import { formatTokenPrice } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecentTradesTableProps {
  trades: OkxTrade[];
  isLoading?: boolean;
  chainExplorerUrl?: string;
}

export function RecentTradesTable({ 
  trades, 
  isLoading,
  chainExplorerUrl,
}: RecentTradesTableProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(parseInt(timestamp));
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatAddress = (address: string) => {
    if (!address || address.length < 10) return address || "-";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array(5).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        No recent trades available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Time</th>
            <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Type</th>
            <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Price</th>
            <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Amount</th>
            <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Value</th>
            <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground hidden md:table-cell">Tx</th>
          </tr>
        </thead>
        <tbody>
          {trades.slice(0, 20).map((trade, index) => {
            const isBuy = trade.side === 'buy';
            
            return (
              <tr 
                key={`${trade.txHash}-${index}`}
                className={cn(
                  "border-b border-border/50 hover:bg-muted/30 transition-colors",
                  isBuy ? "bg-success/5" : "bg-destructive/5"
                )}
              >
                <td className="py-2 px-2 font-mono text-xs text-muted-foreground">
                  {formatTime(trade.timestamp)}
                </td>
                <td className="py-2 px-2">
                  <Badge 
                    variant={isBuy ? "default" : "destructive"}
                    className={cn(
                      "text-[10px] px-1.5",
                      isBuy ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                    )}
                  >
                    {isBuy ? (
                      <><ArrowUpRight className="h-3 w-3 mr-0.5" /> Buy</>
                    ) : (
                      <><ArrowDownRight className="h-3 w-3 mr-0.5" /> Sell</>
                    )}
                  </Badge>
                </td>
                <td className="py-2 px-2 text-right font-mono text-foreground">
                  {formatTokenPrice(parseFloat(trade.price))}
                </td>
                <td className="py-2 px-2 text-right font-mono text-muted-foreground">
                  {parseFloat(trade.amount).toLocaleString(undefined, { 
                    maximumFractionDigits: 4 
                  })}
                </td>
                <td className="py-2 px-2 text-right font-mono text-foreground">
                  ${parseFloat(trade.totalValue).toLocaleString(undefined, { 
                    maximumFractionDigits: 2 
                  })}
                </td>
                <td className="py-2 px-2 text-right hidden md:table-cell">
                  {chainExplorerUrl && trade.txHash && (
                    <a
                      href={`${chainExplorerUrl}/tx/${trade.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary/70 hover:text-primary inline-flex items-center gap-1"
                    >
                      <span className="font-mono text-xs">{formatAddress(trade.txHash)}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default RecentTradesTable;
