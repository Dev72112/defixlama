import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatCurrency, ChainData } from "@/lib/api/defillama";

const COLORS = [
  "hsl(142, 76%, 46%)",
  "hsl(180, 80%, 45%)",
  "hsl(45, 100%, 50%)",
  "hsl(280, 80%, 60%)",
  "hsl(348, 83%, 47%)",
  "hsl(200, 70%, 50%)",
  "hsl(30, 90%, 55%)",
  "hsl(160, 60%, 40%)",
];

interface CapitalConcentrationChartProps {
  chains: ChainData[];
  loading?: boolean;
  title?: string;
}

export function CapitalConcentrationChart({ chains, loading, title = "Capital Distribution by Chain" }: CapitalConcentrationChartProps) {
  const chartData = useMemo(() => {
    if (!chains?.length) return [];
    const sorted = [...chains].sort((a, b) => (b.tvl || 0) - (a.tvl || 0));
    const top7 = sorted.slice(0, 7);
    const otherTvl = sorted.slice(7).reduce((acc, c) => acc + (c.tvl || 0), 0);
    const data = top7.map((c) => ({ name: c.name, value: c.tvl || 0 }));
    if (otherTvl > 0) data.push({ name: "Others", value: otherTvl });
    return data;
  }, [chains]);

  const totalTvl = useMemo(() => chartData.reduce((acc, d) => acc + d.value, 0), [chartData]);

  // HHI (Herfindahl-Hirschman Index) for concentration
  const hhi = useMemo(() => {
    if (totalTvl === 0) return 0;
    return chains.reduce((acc, c) => {
      const share = ((c.tvl || 0) / totalTvl) * 100;
      return acc + share * share;
    }, 0);
  }, [chains, totalTvl]);

  const concentrationLabel = hhi > 2500 ? "Highly Concentrated" : hhi > 1500 ? "Moderately Concentrated" : "Well Distributed";

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="skeleton h-5 w-48" />
        <div className="skeleton h-[250px] w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">Concentration:</span>
          <span className={`text-xs font-medium ${hhi > 2500 ? "text-destructive" : hhi > 1500 ? "text-warning" : "text-success"}`}>
            {concentrationLabel}
          </span>
          <span className="text-xs text-muted-foreground">(HHI: {Math.round(hhi)})</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={95}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{
              backgroundColor: "hsl(0 0% 3%)",
              border: "1px solid hsl(0 0% 8%)",
              borderRadius: "8px",
              color: "hsl(0 0% 93%)",
              fontSize: "12px",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px", color: "hsl(0 0% 50%)" }}
            formatter={(value: string) => <span style={{ color: "hsl(0, 0%, 70%)" }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
