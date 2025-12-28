import { useWebSocketPrices } from "@/hooks/useWebSocketPrices";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface LivePriceIndicatorProps {
  className?: string;
}

export function LivePriceIndicator({ className }: LivePriceIndicatorProps) {
  const { isConnected, lastUpdate, error, reconnect } = useWebSocketPrices();
  
  const lastUpdateText = lastUpdate 
    ? `Last update: ${new Date(lastUpdate).toLocaleTimeString()}`
    : "Waiting for data...";

  // Don't show error state prominently - just show neutral "Prices" indicator
  const hasError = !!error && !isConnected;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all duration-300",
              isConnected 
                ? "bg-success/10 text-success" 
                : hasError
                  ? "bg-muted text-muted-foreground cursor-pointer hover:bg-muted/80"
                  : "bg-muted text-muted-foreground",
              className
            )}
            onClick={hasError ? reconnect : undefined}
          >
            {isConnected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                </span>
                <Wifi className="h-3 w-3" />
                <span className="hidden sm:inline">Live</span>
              </>
            ) : (
              <>
                {hasError ? (
                  <RefreshCw className="h-3 w-3" />
                ) : (
                  <WifiOff className="h-3 w-3" />
                )}
                <span className="hidden sm:inline">{hasError ? "Retry" : "Connecting..."}</span>
              </>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="text-xs">
            <p className="font-medium">
              {isConnected 
                ? "Real-time prices active" 
                : hasError 
                  ? "Click to reconnect" 
                  : "Connecting to live prices..."}
            </p>
            <p className="text-muted-foreground mt-0.5">{lastUpdateText}</p>
            {hasError && (
              <p className="text-muted-foreground mt-0.5">
                Live prices temporarily unavailable
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}