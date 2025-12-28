import { useState, useEffect, useCallback, useRef } from "react";

export interface PriceUpdate {
  [symbol: string]: number;
}

interface WebSocketState {
  prices: PriceUpdate;
  isConnected: boolean;
  lastUpdate: number | null;
  error: string | null;
}

// CoinCap public WebSocket API for real-time crypto prices
const WS_URL = "wss://ws.coincap.io/prices?assets=";

// Map common symbols to CoinCap asset IDs
const SYMBOL_TO_ASSET: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  USDC: "usd-coin",
  BNB: "binance-coin",
  XRP: "ripple",
  ADA: "cardano",
  DOGE: "dogecoin",
  SOL: "solana",
  DOT: "polkadot",
  MATIC: "polygon",
  AVAX: "avalanche",
  LINK: "chainlink",
  UNI: "uniswap",
  ATOM: "cosmos",
  LTC: "litecoin",
  TRX: "tron",
  APT: "aptos",
  ARB: "arbitrum",
  OP: "optimism",
};

// Reverse map for display
const ASSET_TO_SYMBOL: Record<string, string> = Object.entries(SYMBOL_TO_ASSET).reduce(
  (acc, [symbol, asset]) => ({ ...acc, [asset]: symbol }),
  {}
);

export function useWebSocketPrices(symbols: string[] = ["BTC", "ETH", "SOL", "BNB", "XRP"]) {
  const [state, setState] = useState<WebSocketState>({
    prices: {},
    isConnected: false,
    lastUpdate: null,
    error: null,
  });
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000;

  const connect = useCallback(() => {
    // Convert symbols to CoinCap asset IDs
    const assets = symbols
      .map(s => SYMBOL_TO_ASSET[s.toUpperCase()])
      .filter(Boolean)
      .join(",");
    
    if (!assets) {
      console.warn("No valid assets to track");
      return;
    }

    const wsUrl = `${WS_URL}${assets}`;
    console.log("[WebSocket] Connecting to:", wsUrl);
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[WebSocket] Connected successfully");
        setState(prev => ({ ...prev, isConnected: true, error: null }));
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Transform asset IDs back to symbols for easier use
          const transformedPrices: PriceUpdate = {};
          for (const [asset, price] of Object.entries(data)) {
            const symbol = ASSET_TO_SYMBOL[asset] || asset.toUpperCase();
            transformedPrices[symbol] = Number(price);
          }
          
          setState(prev => ({
            ...prev,
            prices: { ...prev.prices, ...transformedPrices },
            lastUpdate: Date.now(),
          }));
        } catch (err) {
          console.error("[WebSocket] Error parsing message:", err);
        }
      };

      ws.onerror = (error) => {
        console.error("[WebSocket] Error:", error);
        setState(prev => ({ ...prev, error: "WebSocket connection error" }));
      };

      ws.onclose = (event) => {
        console.log("[WebSocket] Closed:", event.code, event.reason);
        setState(prev => ({ ...prev, isConnected: false }));
        wsRef.current = null;
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
          console.log(`[WebSocket] Reconnecting in ${delay}ms...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else {
          console.warn("[WebSocket] Max reconnect attempts reached");
          setState(prev => ({ ...prev, error: "Connection lost. Please refresh the page." }));
        }
      };
    } catch (err) {
      console.error("[WebSocket] Failed to create connection:", err);
      setState(prev => ({ ...prev, error: "Failed to connect" }));
    }
  }, [symbols]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setState(prev => ({ ...prev, isConnected: false }));
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    prices: state.prices,
    isConnected: state.isConnected,
    lastUpdate: state.lastUpdate,
    error: state.error,
    reconnect: connect,
  };
}

// Hook to get a single price with animation state
export function useAnimatedPrice(symbol: string, fallbackPrice?: number) {
  const { prices, isConnected } = useWebSocketPrices([symbol]);
  const [priceState, setPriceState] = useState<{
    price: number;
    direction: "up" | "down" | "neutral";
    animate: boolean;
  }>({
    price: fallbackPrice || 0,
    direction: "neutral",
    animate: false,
  });
  
  const prevPriceRef = useRef<number>(fallbackPrice || 0);

  useEffect(() => {
    const newPrice = prices[symbol.toUpperCase()];
    if (newPrice !== undefined && newPrice !== prevPriceRef.current) {
      const direction = newPrice > prevPriceRef.current ? "up" : newPrice < prevPriceRef.current ? "down" : "neutral";
      setPriceState({
        price: newPrice,
        direction,
        animate: true,
      });
      prevPriceRef.current = newPrice;
      
      // Reset animation after 500ms
      const timeout = setTimeout(() => {
        setPriceState(prev => ({ ...prev, animate: false }));
      }, 500);
      
      return () => clearTimeout(timeout);
    }
  }, [prices, symbol]);

  // Use fallback price if WebSocket price not available
  useEffect(() => {
    if (fallbackPrice !== undefined && !prices[symbol.toUpperCase()]) {
      setPriceState(prev => ({ ...prev, price: fallbackPrice }));
      prevPriceRef.current = fallbackPrice;
    }
  }, [fallbackPrice, prices, symbol]);

  return {
    ...priceState,
    isLive: isConnected && prices[symbol.toUpperCase()] !== undefined,
  };
}