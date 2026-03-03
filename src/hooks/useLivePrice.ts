import { useState, useEffect, useRef } from "react";
import { priceManager, type PriceListener } from "@/lib/websocket/priceManager";
import type { PriceUpdate } from "@/hooks/useWebSocketPrices";

/**
 * Hook wrapping the singleton PriceManager for live prices.
 * Falls back to polling if WebSocket fails.
 */
export function useLivePrice(symbol: string, fallbackPrice?: number) {
  const [price, setPrice] = useState(fallbackPrice || 0);
  const [direction, setDirection] = useState<"up" | "down" | "neutral">("neutral");
  const [animate, setAnimate] = useState(false);
  const prevRef = useRef(fallbackPrice || 0);

  useEffect(() => {
    const listener: PriceListener = (prices) => {
      const key = symbol.toUpperCase();
      const newPrice = prices[key];
      if (newPrice !== undefined && newPrice !== prevRef.current) {
        setDirection(newPrice > prevRef.current ? "up" : "down");
        setPrice(newPrice);
        setAnimate(true);
        prevRef.current = newPrice;
        setTimeout(() => setAnimate(false), 500);
      }
    };

    const unsub = priceManager.subscribe(listener);
    return unsub;
  }, [symbol]);

  useEffect(() => {
    if (fallbackPrice !== undefined && price === 0) {
      setPrice(fallbackPrice);
      prevRef.current = fallbackPrice;
    }
  }, [fallbackPrice]);

  return {
    price,
    direction,
    animate,
    isLive: priceManager.isConnected,
    isFallback: priceManager.usingFallback,
  };
}

/**
 * Hook for multiple live prices at once.
 */
export function useLivePrices(symbols: string[] = []) {
  const [prices, setPrices] = useState<PriceUpdate>({});

  useEffect(() => {
    const listener: PriceListener = (allPrices) => {
      const filtered: PriceUpdate = {};
      for (const s of symbols) {
        const key = s.toUpperCase();
        if (allPrices[key] !== undefined) filtered[key] = allPrices[key];
      }
      setPrices(filtered);
    };

    const unsub = priceManager.subscribe(listener);
    return unsub;
  }, [symbols.join(",")]);

  return {
    prices,
    isConnected: priceManager.isConnected,
    isFallback: priceManager.usingFallback,
    reconnect: () => priceManager.reconnect(),
  };
}
