import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from "react";

export interface PriceUpdate {
  [symbol: string]: number;
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

// Singleton WebSocket manager to prevent multiple connections
class WebSocketManager {
  private static instance: WebSocketManager;
  private ws: WebSocket | null = null;
  private listeners: Set<() => void> = new Set();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private baseReconnectDelay = 2000;
  private isManuallyDisconnected = false;
  
  public prices: PriceUpdate = {};
  public isConnected = false;
  public stableIsConnected = false; // debounced — won't flicker on brief disconnects
  public lastUpdate: number | null = null;
  public error: string | null = null;
  private stableTimeout: NodeJS.Timeout | null = null;
  private readonly STABLE_DELAY = 5000; // 5s before showing disconnect

  private constructor() {}

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    
    // Start connection if this is the first subscriber
    if (this.listeners.size === 1 && !this.ws && !this.isManuallyDisconnected) {
      this.connect();
    }
    
    return () => {
      this.listeners.delete(listener);
      // Disconnect if no more subscribers
      if (this.listeners.size === 0) {
        this.disconnect();
      }
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    this.isManuallyDisconnected = false;
    
    const assets = Object.values(SYMBOL_TO_ASSET).slice(0, 10).join(",");
    const wsUrl = `${WS_URL}${assets}`;
    
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.error = null;
        this.reconnectAttempts = 0;
        // Immediately show connected
        if (this.stableTimeout) { clearTimeout(this.stableTimeout); this.stableTimeout = null; }
        this.stableIsConnected = true;
        this.notify();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          for (const [asset, price] of Object.entries(data)) {
            const symbol = ASSET_TO_SYMBOL[asset] || asset.toUpperCase();
            this.prices[symbol] = Number(price);
          }
          this.lastUpdate = Date.now();
          this.notify();
        } catch (err) {
          // Silently ignore parse errors
        }
      };

      this.ws.onerror = () => {
        this.error = "Connection error";
        this.notify();
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.ws = null;
        this.notify();
        
        // Only reconnect if not manually disconnected and there are active listeners
        if (!this.isManuallyDisconnected && this.listeners.size > 0) {
          this.scheduleReconnect();
        }
      };
    } catch (err) {
      this.error = "Failed to connect";
      this.notify();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.error = "Connection unavailable";
      this.notify();
      return;
    }

    const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  disconnect() {
    this.isManuallyDisconnected = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.reconnectAttempts = 0;
  }

  reconnect() {
    this.reconnectAttempts = 0;
    this.disconnect();
    this.isManuallyDisconnected = false;
    this.connect();
  }

  getSnapshot() {
    return {
      prices: this.prices,
      isConnected: this.isConnected,
      lastUpdate: this.lastUpdate,
      error: this.error,
    };
  }
}

const manager = WebSocketManager.getInstance();

export function useWebSocketPrices(symbols: string[] = ["BTC", "ETH", "SOL", "BNB", "XRP"]) {
  const [, forceUpdate] = useState({});
  
  useEffect(() => {
    const unsubscribe = manager.subscribe(() => forceUpdate({}));
    return unsubscribe;
  }, []);

  const snapshot = manager.getSnapshot();
  
  // Filter prices to only requested symbols
  const filteredPrices: PriceUpdate = {};
  symbols.forEach(s => {
    const upper = s.toUpperCase();
    if (snapshot.prices[upper] !== undefined) {
      filteredPrices[upper] = snapshot.prices[upper];
    }
  });

  return {
    prices: filteredPrices,
    isConnected: snapshot.isConnected,
    lastUpdate: snapshot.lastUpdate,
    error: snapshot.error,
    reconnect: () => manager.reconnect(),
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
      
      const timeout = setTimeout(() => {
        setPriceState(prev => ({ ...prev, animate: false }));
      }, 500);
      
      return () => clearTimeout(timeout);
    }
  }, [prices, symbol]);

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
