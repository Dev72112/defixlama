import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Shield, ShieldCheck, ShieldAlert } from "lucide-react";

interface SecurityOverviewChartProps {
  audited: number;
  unaudited: number;
  loading?: boolean;
}

export function SecurityOverviewChart({ audited, unaudited, loading }: SecurityOverviewChartProps) {
  const chartData = useMemo(() => [
    { name: "Audited", value: audited, color: "hsl(var(--success))" },
    { name: "Unaudited", value: unaudited, color: "hsl(var(--warning))" },
  ], [audited, unaudited]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="skeleton h-5 w-32 mb-4" />
        <div className="skeleton h-[200px] rounded-lg" />
      </div>
    );
  }

  const total = audited + unaudited;
  const auditRate = total > 0 ? (audited / total) * 100 : 0;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Audit Overview</h3>
        <Shield className="h-4 w-4 text-primary" />
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-success" />
            <div>
              <p className="text-sm font-medium text-foreground">{audited} Audited</p>
              <p className="text-xs text-muted-foreground">{auditRate.toFixed(1)}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-warning" />
            <div>
              <p className="text-sm font-medium text-foreground">{unaudited} Unaudited</p>
              <p className="text-xs text-muted-foreground">{(100 - auditRate).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
