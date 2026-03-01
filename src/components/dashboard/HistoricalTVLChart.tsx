import { useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatCurrency } from "@/lib/api/defillama";
import { DateRangeSelector, DateRange, filterByDateRange } from "./DateRangeSelector";
import { format } from "date-fns";

interface HistoricalTVLChartProps {
  data: { date: number; tvl?: number; totalLiquidityUSD?: number }[];
  loading?: boolean;
  title?: string;
  color?: string;
}

export function HistoricalTVLChart({ 
  data, 
  loading, 
  title = "Historical TVL",
  color = "hsl(var(--primary))"
}: HistoricalTVLChartProps) {
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const filtered = filterByDateRange(data, dateRange);
    
    return filtered.map((item) => ({
      date: item.date,
      tvl: item.tvl || item.totalLiquidityUSD || 0,
      formattedDate: format(new Date(item.date * 1000), "MMM d"),
    }));
  }, [data, dateRange]);

  const stats = useMemo(() => {
    if (chartData.length === 0) return { current: 0, change: 0, min: 0, max: 0 };
    
    const tvls = chartData.map((d) => d.tvl);
    const current = tvls[tvls.length - 1] || 0;
    const first = tvls[0] || 0;
    const change = first > 0 ? ((current - first) / first) * 100 : 0;
    const min = Math.min(...tvls);
    const max = Math.max(...tvls);
    
    return { current, change, min, max };
  }, [chartData]);

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
            <span className="text-xl font-bold text-foreground">{formatCurrency(stats.current)}</span>
            <span className={`text-sm font-medium ${stats.change >= 0 ? "text-success" : "text-destructive"}`}>
              {stats.change >= 0 ? "+" : ""}{stats.change.toFixed(2)}%
            </span>
          </div>
        </div>
        <DateRangeSelector value={dateRange} onChange={setDateRange} />
      </div>

      {chartData.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          No historical data available
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <defs>
                <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="formattedDate"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
                interval="preserveStartEnd"
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
                formatter={(value: number) => [formatCurrency(value), "TVL"]}
                labelFormatter={(label) => label}
              />
              <Area
                type="monotone"
                dataKey="tvl"
                stroke={color}
                fill="url(#tvlGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Min</p>
              <p className="font-mono font-medium text-foreground">{formatCurrency(stats.min)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Max</p>
              <p className="font-mono font-medium text-foreground">{formatCurrency(stats.max)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Data Points</p>
              <p className="font-mono font-medium text-foreground">{chartData.length}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
