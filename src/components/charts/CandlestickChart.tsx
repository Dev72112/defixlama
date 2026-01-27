import { useMemo } from "react";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { OkxCandlestick } from "@/lib/api/okx";
import { formatTokenPrice } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface CandlestickChartProps {
  data: OkxCandlestick[];
  isLoading?: boolean;
  height?: number;
}

interface CandleData {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isGreen: boolean;
  bodyTop: number;
  bodyBottom: number;
  wickTop: number;
  wickBottom: number;
}

export function CandlestickChart({ data, isLoading, height = 400 }: CandlestickChartProps) {
  const chartData = useMemo((): CandleData[] => {
    if (!data || data.length === 0) return [];
    
    return data
      .slice()
      .reverse()
      .map((candle) => {
        const open = parseFloat(candle.open);
        const high = parseFloat(candle.high);
        const low = parseFloat(candle.low);
        const close = parseFloat(candle.close);
        const volume = parseFloat(candle.volume || '0');
        const timestamp = parseInt(candle.ts);
        
        const isGreen = close >= open;
        const bodyTop = Math.max(open, close);
        const bodyBottom = Math.min(open, close);
        
        return {
          time: new Date(timestamp).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          timestamp,
          open,
          high,
          low,
          close,
          volume,
          isGreen,
          bodyTop,
          bodyBottom,
          wickTop: high - bodyTop,
          wickBottom: bodyBottom - low,
        };
      });
  }, [data]);

  const priceRange = useMemo(() => {
    if (chartData.length === 0) return { min: 0, max: 1 };
    const prices = chartData.flatMap(d => [d.high, d.low]);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1;
    return { min: min - padding, max: max + padding };
  }, [chartData]);

  if (isLoading) {
    return <Skeleton className="w-full" style={{ height }} />;
  }

  if (chartData.length === 0) {
    return (
      <div 
        className="flex items-center justify-center text-muted-foreground"
        style={{ height }}
      >
        No candlestick data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <XAxis
          dataKey="time"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[priceRange.min, priceRange.max]}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatTokenPrice(value)}
          width={80}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.[0]?.payload) return null;
            const d = payload[0].payload as CandleData;
            return (
              <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                <p className="text-xs text-muted-foreground mb-2">{d.time}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <span className="text-muted-foreground">Open:</span>
                  <span className="font-mono text-foreground">{formatTokenPrice(d.open)}</span>
                  <span className="text-muted-foreground">High:</span>
                  <span className="font-mono text-success">{formatTokenPrice(d.high)}</span>
                  <span className="text-muted-foreground">Low:</span>
                  <span className="font-mono text-destructive">{formatTokenPrice(d.low)}</span>
                  <span className="text-muted-foreground">Close:</span>
                  <span className={`font-mono ${d.isGreen ? 'text-success' : 'text-destructive'}`}>
                    {formatTokenPrice(d.close)}
                  </span>
                </div>
              </div>
            );
          }}
        />
        
        {/* Candle bodies */}
        <Bar
          dataKey="bodyTop"
          stackId="candle"
          fill="transparent"
        />
        <Bar
          dataKey={(d: CandleData) => d.bodyTop - d.bodyBottom}
          stackId="body"
          maxBarSize={12}
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`body-${index}`}
              fill={entry.isGreen ? "hsl(var(--success))" : "hsl(var(--destructive))"}
            />
          ))}
        </Bar>
        
        {/* Reference lines for current price */}
        {chartData.length > 0 && (
          <ReferenceLine
            y={chartData[chartData.length - 1]?.close}
            stroke="hsl(var(--primary))"
            strokeDasharray="3 3"
            strokeOpacity={0.5}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export default CandlestickChart;
