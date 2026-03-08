import { useMemo } from "react";
import { formatCurrency, formatPercentage, getChangeColor, Protocol } from "@/lib/api/defillama";
import { TrendingUp, TrendingDown } from "lucide-react";
import { ResponsiveDataTable, ResponsiveColumn } from "@/components/ui/responsive-table";

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

  const columns: ResponsiveColumn<any>[] = [
    {
      key: "name", label: "Protocol", priority: "always",
      render: (p: any) => (
        <div className="flex items-center gap-2 min-w-0">
          {p.logo && <img src={p.logo} alt="" className="h-5 w-5 rounded-full flex-shrink-0" />}
          <span className="font-medium text-foreground truncate max-w-[120px] sm:max-w-none">{p.name}</span>
        </div>
      ),
    },
    {
      key: "category", label: "Category", priority: "expanded",
      render: (p: any) => <span className="text-muted-foreground text-xs">{p.category || "—"}</span>,
    },
    {
      key: "tvl", label: "TVL", priority: "expanded", align: "right",
      render: (p: any) => <span className="font-mono text-sm">{formatCurrency(p.tvl)}</span>,
    },
    {
      key: "change_1d", label: "24h Change", priority: "always", align: "right",
      render: (p: any) => {
        const isPositive = (p.change_1d || 0) >= 0;
        return (
          <div className={`flex items-center justify-end gap-1 font-mono text-sm ${getChangeColor(p.change_1d)}`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {formatPercentage(p.change_1d)}
          </div>
        );
      },
    },
    {
      key: "flow", label: "Flow", priority: "expanded", align: "right",
      render: (p: any) => {
        const isPositive = (p.change_1d || 0) >= 0;
        return (
          <span className={`font-mono text-sm ${getChangeColor(p.change_1d)}`}>
            {isPositive ? "+" : ""}{formatCurrency(Math.abs(p.tvlChange))}
          </span>
        );
      },
    },
  ];

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="text-base font-semibold text-foreground">TVL Flow Analysis</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Largest absolute TVL movements in 24h</p>
      </div>
      <ResponsiveDataTable
        columns={columns}
        data={movers}
        keyField={(p: any) => p.id || p.name}
        loading={loading}
        loadingRows={5}
        emptyMessage="No significant TVL movements detected"
      />
    </div>
  );
}
