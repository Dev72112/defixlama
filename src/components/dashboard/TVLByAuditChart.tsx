import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatCurrency } from "@/lib/api/defillama";

interface Protocol {
  name: string;
  tvl?: number;
  audits?: string;
}

interface TVLByAuditChartProps {
  protocols: Protocol[];
  loading?: boolean;
}

export function TVLByAuditChart({ protocols, loading }: TVLByAuditChartProps) {
  const chartData = useMemo(() => {
    if (!protocols || protocols.length === 0) return [];
    
    return protocols
      .filter((p) => p.tvl && p.tvl > 0)
      .sort((a, b) => (b.tvl || 0) - (a.tvl || 0))
      .slice(0, 10)
      .map((p) => ({
        name: p.name.length > 12 ? p.name.slice(0, 12) + "…" : p.name,
        fullName: p.name,
        tvl: p.tvl || 0,
        isAudited: p.audits && p.audits !== "0",
      }));
  }, [protocols]);

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
        <h3 className="font-semibold text-foreground mb-4">Top Protocols by TVL</h3>
        <p className="text-sm text-muted-foreground">No protocol data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Top 10 Protocols by TVL</h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-success" /> Audited
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-warning" /> Unaudited
          </span>
        </div>
      </div>
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
            width={85}
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
            labelFormatter={(label, payload) => {
              const item = payload?.[0]?.payload;
              return `${item?.fullName || label} (${item?.isAudited ? "Audited" : "Unaudited"})`;
            }}
          />
          <Bar dataKey="tvl" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.isAudited ? "hsl(var(--success))" : "hsl(var(--warning))"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
