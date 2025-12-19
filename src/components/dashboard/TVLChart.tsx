import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { formatCurrency } from "@/lib/api/defillama";
import { cn } from "@/lib/utils";

interface TVLChartProps {
  data: { date: number; tvl: number }[];
  loading?: boolean;
  className?: string;
  height?: number;
  showGrid?: boolean;
  showAxis?: boolean;
}

export function TVLChart({
  data,
  loading = false,
  className,
  height = 300,
  showGrid = true,
  showAxis = true,
}: TVLChartProps) {
  if (loading) {
    return (
      <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
        <div className="skeleton h-6 w-32 mb-4" />
        <div className="skeleton w-full" style={{ height }} />
      </div>
    );
  }

  const chartData = (data || [])
    .filter((item) => item && typeof item.date === 'number' && typeof item.tvl === 'number')
    .map((item) => ({
      date: item.date * 1000,
      tvl: item.tvl,
    }));

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatFullDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">TVL History</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-3 w-3 rounded-full bg-primary" />
          Total Value Locked
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
          )}
          {showAxis && (
            <>
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                tickFormatter={(value) => formatCurrency(value, 0)}
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dx={-10}
                width={60}
              />
            </>
          )}
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border border-border bg-popover p-3 shadow-lg">
                    <p className="text-xs text-muted-foreground mb-1">
                      {formatFullDate(payload[0].payload.date)}
                    </p>
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(payload[0].value as number)}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="tvl"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#tvlGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
