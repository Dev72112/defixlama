import * as React from "react";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps {
  value: string | number;
  duration?: number;
  className?: string;
  // Flash effect on change
  flashOnChange?: boolean;
  // Format function for display
  formatFn?: (value: number) => string;
}

// Parse formatted currency/number string: "$1.23B" → { prefix: "$", value: 1.23, suffix: "B" }
function parseFormattedNumber(str: string): { prefix: string; value: number; suffix: string } {
  if (typeof str === 'number') {
    return { prefix: '', value: str, suffix: '' };
  }
  
  const match = str.match(/^([^0-9.-]*)(-?[\d,]+\.?\d*)(.*)$/);
  if (!match) {
    return { prefix: '', value: 0, suffix: '' };
  }
  
  return {
    prefix: match[1] || '',
    value: parseFloat(match[2]?.replace(/,/g, '') || '0') || 0,
    suffix: match[3] || '',
  };
}

// Format number with commas and decimals
function formatNumber(num: number, decimals: number = 2): string {
  if (isNaN(num)) return '0';
  
  // Handle very small numbers
  if (num !== 0 && Math.abs(num) < 0.01) {
    return num.toFixed(6);
  }
  
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Easing function (ease-out cubic)
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function AnimatedNumber({
  value,
  duration = 800,
  className,
  flashOnChange = true,
  formatFn,
}: AnimatedNumberProps) {
  const parsed = React.useMemo(() => parseFormattedNumber(String(value)), [value]);
  const [displayValue, setDisplayValue] = React.useState(parsed.value);
  const [flashClass, setFlashClass] = React.useState<string>('');
  const prevValueRef = React.useRef(parsed.value);
  const animationRef = React.useRef<number>();
  const elementRef = React.useRef<HTMLSpanElement>(null);
  const hasAnimatedRef = React.useRef(false);

  // Determine decimal places from original value
  const decimals = React.useMemo(() => {
    const strValue = String(parsed.value);
    const decimalIndex = strValue.indexOf('.');
    if (decimalIndex === -1) return 0;
    return Math.min(strValue.length - decimalIndex - 1, 6);
  }, [parsed.value]);

  // Animation on value change
  React.useEffect(() => {
    const startValue = prevValueRef.current;
    const endValue = parsed.value;
    
    // Skip animation if values are the same
    if (startValue === endValue && hasAnimatedRef.current) {
      return;
    }

    // Flash effect
    if (flashOnChange && hasAnimatedRef.current) {
      if (endValue > startValue) {
        setFlashClass('price-flash-up');
      } else if (endValue < startValue) {
        setFlashClass('price-flash-down');
      }
      setTimeout(() => setFlashClass(''), 600);
    }

    hasAnimatedRef.current = true;
    prevValueRef.current = endValue;

    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      
      const current = startValue + (endValue - startValue) * easedProgress;
      setDisplayValue(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [parsed.value, duration, flashOnChange]);

  const formattedDisplay = React.useMemo(() => {
    if (formatFn) {
      return formatFn(displayValue);
    }
    return formatNumber(displayValue, decimals);
  }, [displayValue, decimals, formatFn]);

  return (
    <span 
      ref={elementRef}
      className={cn("tabular-nums transition-colors duration-300", flashClass, className)}
    >
      {parsed.prefix}
      {formattedDisplay}
      {parsed.suffix}
    </span>
  );
}

// Simplified version for just currency values
interface AnimatedCurrencyProps {
  value: number;
  duration?: number;
  className?: string;
  showSign?: boolean;
}

export function AnimatedCurrency({
  value,
  duration = 800,
  className,
  showSign = false,
}: AnimatedCurrencyProps) {
  const formatCurrency = React.useCallback((num: number) => {
    const absValue = Math.abs(num);
    let formatted: string;
    
    if (absValue >= 1e12) {
      formatted = `$${(absValue / 1e12).toFixed(2)}T`;
    } else if (absValue >= 1e9) {
      formatted = `$${(absValue / 1e9).toFixed(2)}B`;
    } else if (absValue >= 1e6) {
      formatted = `$${(absValue / 1e6).toFixed(2)}M`;
    } else if (absValue >= 1e3) {
      formatted = `$${(absValue / 1e3).toFixed(2)}K`;
    } else {
      formatted = `$${absValue.toFixed(2)}`;
    }
    
    if (showSign && num > 0) {
      return '+' + formatted;
    }
    if (num < 0) {
      return '-' + formatted;
    }
    return formatted;
  }, [showSign]);

  return (
    <AnimatedNumber
      value={value}
      duration={duration}
      className={className}
      formatFn={formatCurrency}
    />
  );
}

// Percentage animation
interface AnimatedPercentageProps {
  value: number;
  duration?: number;
  className?: string;
  showSign?: boolean;
  decimals?: number;
}

export function AnimatedPercentage({
  value,
  duration = 800,
  className,
  showSign = true,
  decimals = 2,
}: AnimatedPercentageProps) {
  const formatPercent = React.useCallback((num: number) => {
    const sign = showSign && num > 0 ? '+' : '';
    return `${sign}${num.toFixed(decimals)}%`;
  }, [showSign, decimals]);

  return (
    <AnimatedNumber
      value={value}
      duration={duration}
      className={className}
      formatFn={formatPercent}
    />
  );
}

export default AnimatedNumber;
