import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatPercentage, getChangeColor, Protocol } from "@/lib/api/defillama";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TVLFlowTableProps {
  protocols: Protocol[];
  loading?: boolean;
  limit?: number;
}

export function TVLFlowTable({ protocols, loading, limit = 15 }: TVLFlowTableProps) {
  const movers = useMemo(() => {
    if (!protocols?.length) return [];
    return protocols
      .filter((p) => p.tvl && p.tvl > 100000 && p.change_1d !== undefined)
      .map((p) => ({
        ...p,
        absChange: Math.abs(p.change_1d || 0),
        tvlChange: (p.tvl || 0) * ((p.change_1d || 0) / 100),
      }))
      .sort((a, b) => Math.abs(b.tvlChange) - Math.abs(a.tvlChange))
      .slice(0, limit);
  }, [protocols, limit]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="skeleton h-5 w-40" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-border">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">TVL Flow Analysis</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Largest absolute TVL movements in 24h</p>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs sm:text-sm">Protocol</TableHead>
              <TableHead className="hidden sm:table-cell text-xs sm:text-sm">Category</TableHead>
              <TableHead className="text-right text-xs sm:text-sm">TVL</TableHead>
              <TableHead className="text-right text-xs sm:text-sm">24h Change</TableHead>
              <TableHead className="text-right hidden sm:table-cell text-xs sm:text-sm">Flow</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8 text-xs sm:text-sm">
                  No significant TVL movements detected
                </TableCell>
              </TableRow>
            ) : (
              movers.map((p) => {
                const isPositive = (p.change_1d || 0) >= 0;
                return (
                  <TableRow key={p.id || p.name}>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-0">
                        {p.logo && <img src={p.logo} alt="" className="h-5 w-5 rounded-full flex-shrink-0" />}
                        <span className="font-medium text-foreground truncate max-w-[120px] sm:max-w-none text-xs sm:text-sm">{p.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">{p.category || "—"}</TableCell>
                    <TableCell className="text-right font-mono text-xs sm:text-sm">{formatCurrency(p.tvl)}</TableCell>
                    <TableCell className={`text-right font-mono text-xs sm:text-sm ${getChangeColor(p.change_1d)}`}>
                      <div className="flex items-center justify-end gap-0.5">
                        {isPositive ? <TrendingUp className="h-3 w-3 flex-shrink-0" /> : <TrendingDown className="h-3 w-3 flex-shrink-0" />}
                        {formatPercentage(p.change_1d)}
                      </div>
                    </TableCell>
                    <TableCell className={`text-right font-mono text-xs sm:text-sm hidden sm:table-cell ${getChangeColor(p.change_1d)}`}>
                      {isPositive ? "+" : ""}{formatCurrency(Math.abs(p.tvlChange))}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
