import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatCurrency } from "@/lib/api/defillama";

interface VolumeComparisonChartProps {
  dexes: any[];
  loading?: boolean;
  limit?: number;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function VolumeComparisonChart({ dexes, loading, limit = 8 }: VolumeComparisonChartProps) {
  const chartData = useMemo(() => {
    if (!dexes || dexes.length === 0) return [];

    return [...dexes]
      .filter((d) => d.total24h && d.total24h > 0)
      .sort((a, b) => b.total24h - a.total24h)
      .slice(0, limit)
      .map((d, i) => ({
        name: d.displayName || d.name,
        volume24h: d.total24h,
        volume7d: d.total7d || 0,
        change: d.change_1d || 0,
        color: COLORS[i % COLORS.length],
      }));
  }, [dexes, limit]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="skeleton h-5 w-40 mb-4" />
        <div className="skeleton h-[250px] w-full rounded-lg" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="font-semibold text-foreground mb-4">Volume Comparison</h3>
        <p className="text-sm text-muted-foreground">No DEX data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="font-semibold text-foreground mb-4">24h Volume by DEX</h3>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20 }}>
            <XAxis
              type="number"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              tickFormatter={(value) => {
                if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
                if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
                return `$${value}`;
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              width={80}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value: number) => [formatCurrency(value), "24h Volume"]}
            />
            <Bar dataKey="volume24h" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
