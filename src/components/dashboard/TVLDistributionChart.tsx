import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency } from "@/lib/api/defillama";

interface TVLDistributionChartProps {
  chains: { name: string; tvl: number }[];
  loading?: boolean;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--muted-foreground) / 0.6)",
];

export function TVLDistributionChart({ chains, loading }: TVLDistributionChartProps) {
  const chartData = useMemo(() => {
    if (!chains || chains.length === 0) return [];
    
    const sorted = [...chains].sort((a, b) => (b.tvl || 0) - (a.tvl || 0));
    const top6 = sorted.slice(0, 6);
    const othersTotal = sorted.slice(6).reduce((acc, c) => acc + (c.tvl || 0), 0);
    
    const data = top6.map((c) => ({
      name: c.name,
      value: c.tvl || 0,
    }));
    
    if (othersTotal > 0) {
      data.push({ name: "Others", value: othersTotal });
    }
    
    return data;
  }, [chains]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="skeleton h-5 w-40 mb-4" />
        <div className="skeleton h-[250px] rounded-lg" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="font-semibold text-foreground mb-4">TVL Distribution</h3>
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="font-semibold text-foreground mb-4">TVL Distribution</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={{ stroke: "hsl(var(--muted-foreground))" }}
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              color: "hsl(var(--foreground))",
            }}
            formatter={(value: number) => formatCurrency(value)}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
