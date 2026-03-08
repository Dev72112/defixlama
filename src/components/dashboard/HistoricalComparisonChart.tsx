import { useMemo, useState } from "react";
import { ComposedChart, Area, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { formatCurrency } from "@/lib/api/defillama";
import { DateRangeSelector, DateRange, filterByDateRange } from "./DateRangeSelector";
import { format } from "date-fns";

interface HistoricalComparisonChartProps {
  tvlData: { date: number; tvl?: number }[];
  volumeData?: { name?: string; total24h?: number }[];
  loading?: boolean;
  title?: string;
}

export function HistoricalComparisonChart({ 
  tvlData, 
  volumeData,
  loading, 
  title = "TVL vs Volume Trend"
}: HistoricalComparisonChartProps) {
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  const chartData = useMemo(() => {
    if (!tvlData || tvlData.length === 0) return [];
    
    const filtered = filterByDateRange(tvlData, dateRange);
    const totalVolume = volumeData?.reduce((acc, d) => acc + (d.total24h || 0), 0) || 0;
    
    // Sample data to avoid too many points
    const step = Math.max(1, Math.floor(filtered.length / 50));
    
    const sampled = filtered.filter((_, i) => i % step === 0 || i === filtered.length - 1);
    
    // Calculate TVL deltas for proportional volume distribution
    const deltas = sampled.map((item, i, arr) => {
      if (i === 0) return 1;
      const prev = arr[i - 1].tvl || 1;
      return Math.abs((item.tvl || 0) - prev) / prev + 0.1;
    });
    const deltaSum = deltas.reduce((a, b) => a + b, 0) || 1;
    
    return sampled.map((item, index) => ({
        date: item.date,
        tvl: item.tvl || 0,
        // Distribute volume proportionally based on TVL changes
        volume: totalVolume * (deltas[index] / deltaSum),
        formattedDate: format(new Date(item.date * 1000), "MMM d"),
      }));
  }, [tvlData, volumeData, dateRange]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="skeleton h-5 w-48" />
          <div className="skeleton h-8 w-48" />
        </div>
        <div className="skeleton h-[350px] rounded-lg" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <DateRangeSelector value={dateRange} onChange={setDateRange} />
      </div>

      {chartData.length === 0 ? (
        <div className="h-[350px] flex items-center justify-center text-muted-foreground">
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <defs>
              <linearGradient id="tvlAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
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
              yAxisId="left"
              tickFormatter={(v) => formatCurrency(v, 0)}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
              width={70}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
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
                name === "tvl" ? "TVL" : "Volume"
              ]}
            />
            <Legend />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="tvl"
              name="TVL"
              stroke="hsl(var(--primary))"
              fill="url(#tvlAreaGradient)"
              strokeWidth={2}
            />
            <Bar
              yAxisId="right"
              dataKey="volume"
              name="Volume"
              fill="hsl(var(--chart-3))"
              opacity={0.6}
              radius={[2, 2, 0, 0]}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
