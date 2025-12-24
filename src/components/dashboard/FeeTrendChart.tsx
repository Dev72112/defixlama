import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatCurrency } from "@/lib/api/defillama";

interface FeeTrendChartProps {
  fees: { name?: string; displayName?: string; total24h?: number; change_1d?: number }[];
  loading?: boolean;
}

export function FeeTrendChart({ fees, loading }: FeeTrendChartProps) {
  const chartData = useMemo(() => {
    if (!fees || fees.length === 0) return [];
    return fees
      .filter((f) => f.total24h && f.total24h > 0)
      .sort((a, b) => (b.total24h || 0) - (a.total24h || 0))
      .slice(0, 10)
      .map((f) => {
        const name = f.displayName || f.name || "Unknown";
        return {
          name: name.length > 12 ? name.slice(0, 12) + "…" : name,
          fullName: name,
          fees: f.total24h || 0,
          change: f.change_1d || 0,
        };
      });
  }, [fees]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="skeleton h-5 w-40 mb-4" />
        <div className="skeleton h-[280px] rounded-lg" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="font-semibold text-foreground mb-4">Top Fee Earners (24h)</h3>
        <p className="text-sm text-muted-foreground">No fee data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="font-semibold text-foreground mb-4">Top 10 Fee Earners (24h)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
          <XAxis
            type="number"
            tickFormatter={(v) => formatCurrency(v, 0)}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            axisLine={{ stroke: "hsl(var(--border))" }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={90}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            axisLine={{ stroke: "hsl(var(--border))" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              color: "hsl(var(--foreground))",
            }}
            formatter={(value: number) => [formatCurrency(value), "24h Fees"]}
            labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
          />
          <Bar dataKey="fees" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.change >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
