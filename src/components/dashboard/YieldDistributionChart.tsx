import { useMemo } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, ZAxis } from "recharts";
import { formatCurrency } from "@/lib/api/defillama";

interface YieldDistributionChartProps {
  pools: { symbol: string; tvlUsd?: number; apyBase?: number; apyReward?: number; project?: string }[];
  loading?: boolean;
}

export function YieldDistributionChart({ pools, loading }: YieldDistributionChartProps) {
  const chartData = useMemo(() => {
    if (!pools || pools.length === 0) return [];
    return pools
      .filter((p) => p.tvlUsd && p.tvlUsd > 1000)
      .slice(0, 50)
      .map((p) => ({
        name: p.symbol,
        project: p.project || "Unknown",
        tvl: p.tvlUsd || 0,
        apy: (p.apyBase || 0) + (p.apyReward || 0),
        z: Math.sqrt(p.tvlUsd || 0) / 100,
      }));
  }, [pools]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="skeleton h-5 w-48 mb-4" />
        <div className="skeleton h-[280px] rounded-lg" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="font-semibold text-foreground mb-4">Yield vs TVL Distribution</h3>
        <p className="text-sm text-muted-foreground">No pool data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Yield vs TVL Distribution</h3>
        <p className="text-xs text-muted-foreground">Bubble size = TVL</p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <XAxis
            type="number"
            dataKey="tvl"
            name="TVL"
            tickFormatter={(v) => formatCurrency(v, 0)}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            axisLine={{ stroke: "hsl(var(--border))" }}
            label={{ value: "TVL", position: "bottom", fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          />
          <YAxis
            type="number"
            dataKey="apy"
            name="APY"
            tickFormatter={(v) => `${v.toFixed(0)}%`}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            axisLine={{ stroke: "hsl(var(--border))" }}
            label={{ value: "APY %", angle: -90, position: "left", fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          />
          <ZAxis type="number" dataKey="z" range={[20, 400]} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              color: "hsl(var(--foreground))",
            }}
            formatter={(value: number, name: string) => {
              if (name === "TVL") return formatCurrency(value);
              if (name === "APY") return `${value.toFixed(2)}%`;
              return value;
            }}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.name || ""}
          />
          <Scatter
            name="Pools"
            data={chartData}
            fill="hsl(var(--primary))"
            fillOpacity={0.6}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
