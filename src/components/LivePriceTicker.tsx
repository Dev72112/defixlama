import { useWebSocketPrices } from "@/hooks/useWebSocketPrices";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface PriceTickerItemProps {
  symbol: string;
  price: number;
  prevPrice: number;
}

function PriceTickerItem({ symbol, price, prevPrice }: PriceTickerItemProps) {
  const [animate, setAnimate] = useState(false);
  const direction = price > prevPrice ? "up" : price < prevPrice ? "down" : "neutral";
  
  useEffect(() => {
    if (price !== prevPrice) {
      setAnimate(true);
      const timeout = setTimeout(() => setAnimate(false), 500);
      return () => clearTimeout(timeout);
    }
  }, [price, prevPrice]);

  return (
    <div 
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-300",
        animate && direction === "up" && "bg-success/20",
        animate && direction === "down" && "bg-destructive/20"
      )}
    >
      <span className="font-medium text-foreground">{symbol}</span>
      <span 
        className={cn(
          "font-mono text-sm transition-colors duration-300",
          animate && direction === "up" && "text-success",
          animate && direction === "down" && "text-destructive",
          !animate && "text-muted-foreground"
        )}
      >
        ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      {direction !== "neutral" && animate && (
        direction === "up" 
          ? <TrendingUp className="h-3 w-3 text-success animate-bounce" />
          : <TrendingDown className="h-3 w-3 text-destructive animate-bounce" />
      )}
    </div>
  );
}

const TRACKED_SYMBOLS = ["BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "DOGE", "AVAX", "DOT", "LINK"];

export function LivePriceTicker() {
  const { prices, isConnected } = useWebSocketPrices(TRACKED_SYMBOLS);
  const prevPricesRef = useRef<Record<string, number>>({});
  
  // Update previous prices after each render
  useEffect(() => {
    const timeout = setTimeout(() => {
      prevPricesRef.current = { ...prices };
    }, 600); // Slightly longer than animation duration
    return () => clearTimeout(timeout);
  }, [prices]);

  // Gracefully hide when not connected - no error state shown
  if (!isConnected || Object.keys(prices).length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2 px-1 scrollbar-hide">
      {TRACKED_SYMBOLS.map(symbol => {
        const price = prices[symbol];
        if (price === undefined) return null;
        return (
          <PriceTickerItem
            key={symbol}
            symbol={symbol}
            price={price}
            prevPrice={prevPricesRef.current[symbol] || price}
          />
        );
      })}
    </div>
  );
}