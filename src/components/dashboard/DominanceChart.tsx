import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatCurrency } from "@/lib/api/defillama";

interface DominanceChartProps {
  protocols: any[];
  loading?: boolean;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--muted-foreground))",
];

export function DominanceChart({ protocols, loading }: DominanceChartProps) {
  const chartData = useMemo(() => {
    if (!protocols || protocols.length === 0) return [];

    const sorted = [...protocols]
      .filter((p) => p.tvl && p.tvl > 0)
      .sort((a, b) => b.tvl - a.tvl);

    const top5 = sorted.slice(0, 5);
    const othersTotal = sorted.slice(5).reduce((acc, p) => acc + (p.tvl || 0), 0);
    const totalTVL = sorted.reduce((acc, p) => acc + (p.tvl || 0), 0);

    const data = top5.map((p, i) => ({
      name: p.name,
      value: p.tvl,
      percentage: totalTVL > 0 ? ((p.tvl / totalTVL) * 100).toFixed(1) : "0",
      color: COLORS[i],
    }));

    if (othersTotal > 0) {
      data.push({
        name: "Others",
        value: othersTotal,
        percentage: totalTVL > 0 ? ((othersTotal / totalTVL) * 100).toFixed(1) : "0",
        color: COLORS[5],
      });
    }

    return data;
  }, [protocols]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="skeleton h-5 w-40 mb-4" />
        <div className="skeleton h-[200px] w-full rounded-lg" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="font-semibold text-foreground mb-4">TVL Dominance</h3>
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="font-semibold text-foreground mb-4">Protocol Dominance</h3>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value: number) => [formatCurrency(value), "TVL"]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-muted-foreground truncate">{item.name}</span>
            <span className="text-xs font-medium text-foreground ml-auto">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
