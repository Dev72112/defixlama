import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Activity } from "lucide-react";

interface ActivityTimelineProps {
  activities: { timestamp?: number; type: string }[];
  loading?: boolean;
}

export function ActivityTimeline({ activities, loading }: ActivityTimelineProps) {
  const chartData = useMemo(() => {
    if (!activities || activities.length === 0) return [];
    
    // Group activities by hour for the last 24 hours
    const now = Math.floor(Date.now() / 1000);
    const hourAgo = 3600;
    const hours: Record<number, { protocol: number; fee: number; chain: number }> = {};
    
    for (let i = 0; i < 24; i++) {
      hours[i] = { protocol: 0, fee: 0, chain: 0 };
    }
    
    activities.forEach((a) => {
      if (!a.timestamp) return;
      const hourIndex = Math.floor((now - a.timestamp) / hourAgo);
      if (hourIndex >= 0 && hourIndex < 24) {
        const inverted = 23 - hourIndex; // Invert so recent is on right
        if (a.type === "protocol") hours[inverted].protocol++;
        else if (a.type === "fee") hours[inverted].fee++;
        else if (a.type === "chain") hours[inverted].chain++;
      }
    });
    
    return Object.entries(hours)
      .map(([hour, counts]) => ({
        hour: `${23 - parseInt(hour)}h`,
        ...counts,
        total: counts.protocol + counts.fee + counts.chain,
      }))
      .reverse();
  }, [activities]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="skeleton h-5 w-40 mb-4" />
        <div className="skeleton h-[180px] rounded-lg" />
      </div>
    );
  }

  const hasData = chartData.some((d) => d.total > 0);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Activity Timeline (24h)</h3>
        <Activity className="h-4 w-4 text-primary" />
      </div>
      
      {!hasData ? (
        <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
          Activity data will appear here
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="colorProtocol" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="hour"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--foreground))",
              }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="hsl(var(--primary))"
              fill="url(#colorProtocol)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
