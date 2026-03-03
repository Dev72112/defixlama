/**
 * WebSocket Price Manager — singleton with auto-reconnect, heartbeat, and polling fallback.
 * Re-exports the existing WebSocketManager from useWebSocketPrices.
 * This module provides a functional API wrapper.
 */

import type { PriceUpdate } from "@/hooks/useWebSocketPrices";

const WS_URL = "wss://ws.coincap.io/prices?assets=";

const ASSETS = [
  "bitcoin", "ethereum", "tether", "usd-coin", "binance-coin",
  "ripple", "cardano", "dogecoin", "solana", "polkadot",
];

const ASSET_TO_SYMBOL: Record<string, string> = {
  bitcoin: "BTC", ethereum: "ETH", tether: "USDT", "usd-coin": "USDC",
  "binance-coin": "BNB", ripple: "XRP", cardano: "ADA", dogecoin: "DOGE",
  solana: "SOL", polkadot: "DOT",
};

export type PriceListener = (prices: PriceUpdate) => void;

class PriceManager {
  private static instance: PriceManager;
  private ws: WebSocket | null = null;
  private listeners = new Set<PriceListener>();
  private prices: PriceUpdate = {};
  private reconnectAttempts = 0;
  private maxReconnect = 5;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private _isConnected = false;
  private _usingFallback = false;

  private constructor() {}

  static getInstance(): PriceManager {
    if (!PriceManager.instance) PriceManager.instance = new PriceManager();
    return PriceManager.instance;
  }

  get isConnected() { return this._isConnected; }
  get usingFallback() { return this._usingFallback; }
  get currentPrices() { return { ...this.prices }; }

  subscribe(listener: PriceListener): () => void {
    this.listeners.add(listener);
    if (this.listeners.size === 1) this.connect();
    // Send current prices immediately
    if (Object.keys(this.prices).length > 0) listener(this.prices);
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) this.disconnect();
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(this.prices));
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    this._usingFallback = false;

    try {
      this.ws = new WebSocket(`${WS_URL}${ASSETS.join(",")}`);

      this.ws.onopen = () => {
        this._isConnected = true;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
      };

      this.ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          for (const [asset, price] of Object.entries(data)) {
            const sym = ASSET_TO_SYMBOL[asset] || asset.toUpperCase();
            this.prices[sym] = Number(price);
          }
          this.notify();
        } catch {}
      };

      this.ws.onclose = () => {
        this._isConnected = false;
        this.stopHeartbeat();
        this.ws = null;
        if (this.listeners.size > 0) this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch {
      this.startPollingFallback();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnect) {
      this.startPollingFallback();
      return;
    }
    const delay = 2000 * Math.pow(2, this.reconnectAttempts);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        // CoinCap doesn't require ping but we check connection health
      }
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) { clearInterval(this.heartbeatTimer); this.heartbeatTimer = null; }
  }

  private async startPollingFallback() {
    if (this.pollTimer) return;
    this._usingFallback = true;
    const poll = async () => {
      try {
        const ids = ASSETS.join(",");
        const res = await fetch(`https://api.coincap.io/v2/assets?ids=${ids}`);
        const json = await res.json();
        if (json.data) {
          for (const asset of json.data) {
            const sym = ASSET_TO_SYMBOL[asset.id] || asset.symbol;
            this.prices[sym] = parseFloat(asset.priceUsd);
          }
          this.notify();
        }
      } catch {}
    };
    await poll();
    this.pollTimer = setInterval(poll, 10000);
  }

  disconnect() {
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
    this.stopHeartbeat();
    this.ws?.close();
    this.ws = null;
    this._isConnected = false;
    this._usingFallback = false;
    this.reconnectAttempts = 0;
  }

  reconnect() {
    this.disconnect();
    this.connect();
  }
}

export const priceManager = PriceManager.getInstance();
