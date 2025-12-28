import { useWebSocketPrices } from "@/hooks/useWebSocketPrices";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface LivePriceIndicatorProps {
  className?: string;
}

export function LivePriceIndicator({ className }: LivePriceIndicatorProps) {
  const { isConnected, lastUpdate, error } = useWebSocketPrices();
  
  const lastUpdateText = lastUpdate 
    ? `Last update: ${new Date(lastUpdate).toLocaleTimeString()}`
    : "Waiting for data...";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all duration-300",
              isConnected 
                ? "bg-success/10 text-success" 
                : "bg-destructive/10 text-destructive",
              className
            )}
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
                <WifiOff className="h-3 w-3" />
                <span className="hidden sm:inline">{error ? "Error" : "Offline"}</span>
              </>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="text-xs">
            <p className="font-medium">
              {isConnected ? "Real-time prices active" : "Real-time prices unavailable"}
            </p>
            <p className="text-muted-foreground mt-0.5">{lastUpdateText}</p>
            {error && <p className="text-destructive mt-0.5">{error}</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}