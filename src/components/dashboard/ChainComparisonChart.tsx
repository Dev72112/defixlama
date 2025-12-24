import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatCurrency } from "@/lib/api/defillama";

interface ChainComparisonChartProps {
  chains: { name: string; tvl: number }[];
  loading?: boolean;
  highlightChain?: string;
}

export function ChainComparisonChart({ chains, loading, highlightChain = "xlayer" }: ChainComparisonChartProps) {
  const chartData = useMemo(() => {
    if (!chains || chains.length === 0) return [];
    return chains
      .slice(0, 15)
      .map((c) => ({
        name: c.name.length > 10 ? c.name.slice(0, 10) + "…" : c.name,
        fullName: c.name,
        tvl: c.tvl || 0,
        isHighlighted: c.name.toLowerCase().includes(highlightChain.toLowerCase()),
      }));
  }, [chains, highlightChain]);

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
        <h3 className="font-semibold text-foreground mb-4">Top Chains by TVL</h3>
        <p className="text-sm text-muted-foreground">No chain data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="font-semibold text-foreground mb-4">Top 15 Chains by TVL</h3>
      <ResponsiveContainer width="100%" height={280}>
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
            width={75}
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
            formatter={(value: number) => [formatCurrency(value), "TVL"]}
            labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
          />
          <Bar dataKey="tvl" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.isHighlighted ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.5)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
