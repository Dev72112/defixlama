import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  loading?: boolean;
  className?: string;
  miniChart?: number[];
}

export function StatCard({
  title,
  value,
  change,
  changeLabel = "24h",
  icon: Icon,
  loading = false,
  className,
  miniChart,
}: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;

  if (loading) {
    return (
      <div className={cn("stat-card", className)}>
        <div className="space-y-3">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-8 w-32" />
          <div className="skeleton h-4 w-20" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("stat-card card-hover group", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground group-hover:text-muted-foreground/80 transition-colors">{title}</p>
          <p className="text-2xl font-bold text-foreground tabular-nums group-hover:text-gradient-primary transition-all">
            {value}
          </p>
        </div>
        {Icon && (
          <div className="rounded-lg bg-primary/10 p-2.5 text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      {(change !== undefined || miniChart) && (
        <div className="mt-3 flex items-center justify-between">
          {change !== undefined && (
            <div
              className={cn(
                "flex items-center gap-1 text-sm font-medium",
                isPositive ? "text-success" : "text-destructive"
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>
                {isPositive ? "+" : ""}
                {typeof change === 'number' && !isNaN(change) ? change.toFixed(2) : '0.00'}%
              </span>
              <span className="text-muted-foreground font-normal">
                {changeLabel}
              </span>
            </div>
          )}

          {miniChart && miniChart.length > 0 && (
            <div className="flex items-end gap-0.5 h-8">
              {miniChart.slice(-7).map((val, i) => {
                const chartSlice = miniChart.slice(-7).filter(v => typeof v === 'number' && !isNaN(v));
                const max = chartSlice.length > 0 ? Math.max(...chartSlice) : 1;
                const safeVal = typeof val === 'number' && !isNaN(val) ? val : 0;
                const height = max > 0 ? (safeVal / max) * 100 : 0;
                return (
                  <div
                    key={i}
                    className="mini-bar w-1.5"
                    style={{ height: `${Math.max(height, 10)}%` }}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
