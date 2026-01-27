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
      <div className={cn("stat-card touch-card", className)}>
        <div className="space-y-3">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-8 w-32" />
          <div className="skeleton h-4 w-20" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("stat-card card-hover group touch-card stagger-spring", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-muted-foreground/80 transition-colors truncate">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums group-hover:text-gradient-primary transition-all truncate count-up">
            {value}
          </p>
        </div>
        {Icon && (
          <div className="rounded-xl bg-primary/10 p-2 sm:p-2.5 text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300 flex-shrink-0">
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        )}
      </div>

      {(change !== undefined || miniChart) && (
        <div className="mt-3 flex items-center justify-between gap-2">
          {change !== undefined && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs sm:text-sm font-medium px-2 py-0.5 rounded-full",
                isPositive 
                  ? "text-success bg-success/10" 
                  : "text-destructive bg-destructive/10"
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              ) : (
                <TrendingDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              )}
              <span>
                {isPositive ? "+" : ""}
                {typeof change === 'number' && !isNaN(change) ? change.toFixed(2) : '0.00'}%
              </span>
              <span className="text-muted-foreground font-normal hidden sm:inline ml-1">
                {changeLabel}
              </span>
            </div>
          )}

          {miniChart && miniChart.length > 0 && (
            <div className="flex items-end gap-0.5 h-6 sm:h-8">
              {miniChart.slice(-7).map((val, i) => {
                const chartSlice = miniChart.slice(-7).filter(v => typeof v === 'number' && !isNaN(v));
                const max = chartSlice.length > 0 ? Math.max(...chartSlice) : 1;
                const safeVal = typeof val === 'number' && !isNaN(val) ? val : 0;
                const height = max > 0 ? (safeVal / max) * 100 : 0;
                return (
                  <div
                    key={i}
                    className="mini-bar w-1 sm:w-1.5 rounded-t transition-all duration-300 hover:bg-primary"
                    style={{ 
                      height: `${Math.max(height, 10)}%`,
                      animationDelay: `${i * 50}ms`
                    }}
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
