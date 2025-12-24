import { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
}

export function PullToRefresh({ children, onRefresh, disabled = false }: PullToRefreshProps) {
  const { isPulling, isRefreshing, pullDistance, progress } = usePullToRefresh({
    onRefresh,
    threshold: 80,
    disabled,
  });

  return (
    <div className="relative">
      {/* Pull indicator */}
      <div
        className={cn(
          "fixed left-1/2 -translate-x-1/2 z-50 flex items-center justify-center transition-all duration-300 pointer-events-none",
          (isPulling || isRefreshing) && pullDistance > 10 ? "opacity-100" : "opacity-0"
        )}
        style={{
          top: Math.min(pullDistance - 40, 60),
        }}
      >
        <div
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full bg-card border border-border shadow-lg transition-all duration-200",
            isRefreshing && "bg-primary/10"
          )}
          style={{
            transform: `rotate(${progress * 360}deg) scale(${0.8 + progress * 0.2})`,
          }}
        >
          <RefreshCw
            className={cn(
              "h-5 w-5 text-primary transition-all",
              isRefreshing && "animate-spin"
            )}
          />
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: isPulling || isRefreshing ? `translateY(${pullDistance}px)` : "translateY(0)",
          transition: isPulling ? "none" : "transform 0.3s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
