import { useMemo } from "react";
import { Layers, DollarSign, Globe } from "lucide-react";
import { formatCurrency } from "@/lib/api/defillama";

interface ActivityBreakdownProps {
  protocols: any[];
  fees: any[];
  chains: any[];
  loading?: boolean;
}

export function ActivityBreakdown({ protocols, fees, chains, loading }: ActivityBreakdownProps) {
  const stats = useMemo(() => {
    const protocolTVL = protocols?.reduce((acc, p) => acc + (p.tvl || 0), 0) || 0;
    const feeTotal = fees?.reduce((acc, f) => acc + (f.total24h || 0), 0) || 0;
    const chainTVL = chains?.reduce((acc, c) => acc + (c.tvl || 0), 0) || 0;

    return {
      protocolCount: protocols?.length || 0,
      protocolTVL,
      feeCount: fees?.length || 0,
      feeTotal,
      chainCount: chains?.length || 0,
      chainTVL,
    };
  }, [protocols, fees, chains]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="skeleton h-5 w-40 mb-4" />
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const items = [
    {
      label: "Protocols",
      count: stats.protocolCount,
      value: formatCurrency(stats.protocolTVL),
      sublabel: "Total TVL",
      icon: Layers,
      color: "text-primary bg-primary/10",
    },
    {
      label: "Fee Sources",
      count: stats.feeCount,
      value: formatCurrency(stats.feeTotal),
      sublabel: "24h Fees",
      icon: DollarSign,
      color: "text-amber-500 bg-amber-500/10",
    },
    {
      label: "Chains",
      count: stats.chainCount,
      value: formatCurrency(stats.chainTVL),
      sublabel: "Total TVL",
      icon: Globe,
      color: "text-blue-500 bg-blue-500/10",
    },
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="font-semibold text-foreground mb-4">Activity Breakdown</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
          >
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${item.color}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.count} tracked</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-foreground">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.sublabel}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
