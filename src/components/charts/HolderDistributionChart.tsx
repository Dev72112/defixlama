import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { OkxTopHolder } from "@/lib/api/okx";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink } from "lucide-react";

interface HolderDistributionChartProps {
  holders: OkxTopHolder[];
  isLoading?: boolean;
  chainExplorerUrl?: string;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(210, 80%, 60%)",
  "hsl(280, 60%, 55%)",
  "hsl(340, 70%, 50%)",
  "hsl(170, 60%, 45%)",
  "hsl(var(--muted-foreground))",
];

export function HolderDistributionChart({ 
  holders, 
  isLoading, 
  chainExplorerUrl 
}: HolderDistributionChartProps) {
  const chartData = useMemo(() => {
    if (!holders || holders.length === 0) return [];
    
    const topHolders = holders.slice(0, 9).map((holder, index) => ({
      name: `Holder #${holder.rank}`,
      address: holder.address,
      value: parseFloat(holder.percentage) || 0,
      balance: holder.balance,
      fill: COLORS[index % COLORS.length],
    }));
    
    // Calculate "Others" if there are more holders
    const topPercentage = topHolders.reduce((sum, h) => sum + h.value, 0);
    if (topPercentage < 100) {
      topHolders.push({
        name: "Others",
        address: "",
        value: Math.max(0, 100 - topPercentage),
        balance: "...",
        fill: COLORS[9],
      });
    }
    
    return topHolders;
  }, [holders]);

  const formatAddress = (address: string) => {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return <Skeleton className="w-full h-[300px]" />;
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No holder data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            label={({ name, value }) => value > 3 ? `${value.toFixed(1)}%` : ''}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]?.payload) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                  <p className="font-medium text-foreground">{d.name}</p>
                  {d.address && (
                    <p className="text-xs text-muted-foreground font-mono">
                      {formatAddress(d.address)}
                    </p>
                  )}
                  <p className="text-sm text-primary font-medium mt-1">
                    {d.value.toFixed(2)}% of supply
                  </p>
                </div>
              );
            }}
          />
          <Legend 
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span className="text-xs text-muted-foreground">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Holder List */}
      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        {holders.slice(0, 10).map((holder) => (
          <div 
            key={holder.address}
            className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground w-6">
                #{holder.rank}
              </span>
              <span className="font-mono text-sm text-foreground">
                {formatAddress(holder.address)}
              </span>
              {chainExplorerUrl && (
                <a
                  href={`${chainExplorerUrl}/address/${holder.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary/70 hover:text-primary"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-foreground">
                {parseFloat(holder.percentage).toFixed(2)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HolderDistributionChart;
