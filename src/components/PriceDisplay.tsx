import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  price: number;
  className?: string;
  showAnimation?: boolean;
  precision?: number;
}

export function PriceDisplay({ 
  price, 
  className, 
  showAnimation = true,
  precision = 2 
}: PriceDisplayProps) {
  const prevPriceRef = useRef<number>(price);
  const [animationClass, setAnimationClass] = useState<string>("");
  
  useEffect(() => {
    if (!showAnimation) return;
    
    const prevPrice = prevPriceRef.current;
    
    if (price > prevPrice) {
      setAnimationClass("price-up");
    } else if (price < prevPrice) {
      setAnimationClass("price-down");
    }
    
    prevPriceRef.current = price;
    
    const timer = setTimeout(() => {
      setAnimationClass("");
    }, 600);
    
    return () => clearTimeout(timer);
  }, [price, showAnimation]);
  
  const formatPrice = (p: number) => {
    if (p >= 1) {
      return `$${p.toLocaleString(undefined, { 
        minimumFractionDigits: precision, 
        maximumFractionDigits: precision 
      })}`;
    }
    // Small prices: show up to 8 decimals, trim trailing zeros
    const s = p.toFixed(8).replace(/(?:\.0+|(?<=\.[0-9]*?)0+)$/, "");
    return `$${s}`;
  };
  
  return (
    <span 
      className={cn(
        "font-mono font-medium transition-colors duration-300",
        animationClass,
        className
      )}
    >
      {price > 0 ? formatPrice(price) : "-"}
    </span>
  );
}

interface ChangeDisplayProps {
  change: number;
  className?: string;
  showAnimation?: boolean;
}

export function ChangeDisplay({ 
  change, 
  className,
  showAnimation = true 
}: ChangeDisplayProps) {
  const prevChangeRef = useRef<number>(change);
  const [flash, setFlash] = useState(false);
  
  useEffect(() => {
    if (!showAnimation) return;
    
    if (change !== prevChangeRef.current) {
      setFlash(true);
      prevChangeRef.current = change;
      
      const timer = setTimeout(() => setFlash(false), 600);
      return () => clearTimeout(timer);
    }
  }, [change, showAnimation]);
  
  const isPositive = change >= 0;
  
  return (
    <span 
      className={cn(
        "font-mono text-sm transition-all duration-300",
        isPositive ? "text-success" : "text-destructive",
        flash && (isPositive ? "price-up" : "price-down"),
        className
      )}
    >
      {isPositive ? "+" : ""}{change.toFixed(2)}%
    </span>
  );
}
