import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatCurrency } from "@/lib/api/defillama";
import { DateRangeSelector, DateRange } from "./DateRangeSelector";

interface VolumeData {
  name?: string;
  displayName?: string;
  total24h?: number;
  total7d?: number;
  total30d?: number;
}

interface HistoricalVolumeChartProps {
  data: VolumeData[];
  loading?: boolean;
  title?: string;
}

export function HistoricalVolumeChart({ 
  data, 
  loading, 
  title = "Volume by DEX"
}: HistoricalVolumeChartProps) {
  const [dateRange, setDateRange] = useState<DateRange>("7d");

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Get volume based on selected range
    const getVolume = (item: VolumeData) => {
      switch (dateRange) {
        case "7d": return item.total24h || 0; // Show daily for 7d view
        case "30d": return item.total7d || item.total24h || 0;
        case "90d":
        case "1y":
        case "all": return item.total30d || item.total7d || item.total24h || 0;
        default: return item.total24h || 0;
      }
    };

    return data
      .filter((d) => getVolume(d) > 0)
      .sort((a, b) => getVolume(b) - getVolume(a))
      .slice(0, 12)
      .map((item) => {
        const name = item.displayName || item.name || "Unknown";
        return {
          name: name.length > 10 ? name.slice(0, 10) + "…" : name,
          fullName: name,
          volume: getVolume(item),
        };
      });
  }, [data, dateRange]);

  const totalVolume = useMemo(() => {
    return chartData.reduce((acc, d) => acc + d.volume, 0);
  }, [chartData]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="skeleton h-5 w-40" />
          <div className="skeleton h-8 w-48" />
        </div>
        <div className="skeleton h-[300px] rounded-lg" />
      </div>
    );
  }

  const rangeLabel = {
    "7d": "24h",
    "30d": "7d",
    "90d": "30d",
    "1y": "30d",
    "all": "30d",
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-xl font-bold text-foreground">{formatCurrency(totalVolume)}</span>
            <span className="text-sm text-muted-foreground">{rangeLabel[dateRange]} volume</span>
          </div>
        </div>
        <DateRangeSelector value={dateRange} onChange={setDateRange} />
      </div>

      {chartData.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          No volume data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
              angle={-45}
              textAnchor="end"
              height={60}
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
              formatter={(value: number) => [formatCurrency(value), "Volume"]}
              labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
            />
            <Bar
              dataKey="volume"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
