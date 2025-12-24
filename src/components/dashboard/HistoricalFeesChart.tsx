import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { formatCurrency } from "@/lib/api/defillama";
import { DateRangeSelector, DateRange } from "./DateRangeSelector";

interface FeeData {
  name?: string;
  displayName?: string;
  total24h?: number;
  total7d?: number;
  total30d?: number;
  change_1d?: number;
}

interface HistoricalFeesChartProps {
  data: FeeData[];
  loading?: boolean;
  title?: string;
}

export function HistoricalFeesChart({ 
  data, 
  loading, 
  title = "Fee Revenue"
}: HistoricalFeesChartProps) {
  const [dateRange, setDateRange] = useState<DateRange>("7d");

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Determine which fee field to use based on date range
    const getFeeValue = (item: FeeData) => {
      switch (dateRange) {
        case "7d": return item.total7d || 0;
        case "30d": return item.total30d || 0;
        case "90d": return (item.total30d || 0) * 3; // Approximate
        case "1y": return (item.total30d || 0) * 12; // Approximate
        case "all": return (item.total30d || 0) * 12; // Approximate
        default: return item.total24h || 0;
      }
    };

    // Get top 8 fee earners based on selected range
    const topFees = [...data]
      .filter((d) => getFeeValue(d) > 0)
      .sort((a, b) => getFeeValue(b) - getFeeValue(a))
      .slice(0, 8);

    return topFees.map((item) => {
      const name = item.displayName || item.name || "Unknown";
      return {
        name: name.length > 12 ? name.slice(0, 12) + "…" : name,
        fullName: name,
        fees: getFeeValue(item),
        fees24h: item.total24h || 0,
        change: item.change_1d || 0,
      };
    });
  }, [data, dateRange]);

  const stats = useMemo(() => {
    if (!data || data.length === 0) return { total24h: 0, total7d: 0, avgChange: 0 };
    
    const total24h = data.reduce((acc, d) => acc + (d.total24h || 0), 0);
    const total7d = data.reduce((acc, d) => acc + (d.total7d || 0), 0);
    const changes = data.filter((d) => d.change_1d !== undefined).map((d) => d.change_1d || 0);
    const avgChange = changes.length > 0 ? changes.reduce((a, b) => a + b, 0) / changes.length : 0;
    
    return { total24h, total7d, avgChange };
  }, [data]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="skeleton h-5 w-32" />
          <div className="skeleton h-8 w-48" />
        </div>
        <div className="skeleton h-[300px] rounded-lg" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-xl font-bold text-foreground">{formatCurrency(stats.total24h)}</span>
            <span className={`text-sm font-medium ${stats.avgChange >= 0 ? "text-success" : "text-destructive"}`}>
              Avg {stats.avgChange >= 0 ? "+" : ""}{stats.avgChange.toFixed(1)}%
            </span>
          </div>
        </div>
        <DateRangeSelector value={dateRange} onChange={setDateRange} />
      </div>

      {chartData.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          No fee data available
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 60, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
                angle={-45}
                textAnchor="end"
              />
              <YAxis
                tickFormatter={(v) => formatCurrency(v, 0)}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
                width={70}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))",
                }}
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === "fees" ? `${dateRange === "7d" ? "7d" : dateRange === "30d" ? "30d" : dateRange} Fees` : "24h Fees"
                ]}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="fees"
                name={`${dateRange === "7d" ? "7d" : dateRange === "30d" ? "30d" : dateRange} Fees`}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="fees24h"
                name="24h Fees"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">24h Total</p>
              <p className="font-mono font-medium text-foreground">{formatCurrency(stats.total24h)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">7d Total</p>
              <p className="font-mono font-medium text-foreground">{formatCurrency(stats.total7d)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Protocols</p>
              <p className="font-mono font-medium text-foreground">{data?.length || 0}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
