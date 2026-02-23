/**
 * WebSocket price feed manager for real-time updates
 * Handles multiple price sources with fallback to polling
 */

type PriceUpdateCallback = (prices: Record<string, number>) => void;

export interface WebSocketPrice {
  symbol: string;
  price: number;
  change24h?: number;
  volume24h?: number;
  timestamp: number;
}

/**
 * WebSocket Price Manager
 * Handles real-time price updates via WebSocket with fallback to polling
 */
export class WebSocketPriceManager {
  private ws: WebSocket | null = null;
  private url: string;
  private protocols: Set<string> = new Set();
  private callbacks: Set<PriceUpdateCallback> = new Set();
  private prices: Map<string, WebSocketPrice> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnected = false;
  private pollingInterval: NodeJS.Timeout | null = null;
  private heartbeatTimeout: NodeJS.Timeout | null = null;
  private readonly heartbeatInterval = 30000; // 30 seconds

  constructor(url: string) {
    this.url = url;
  }

  /**
   * Connect to WebSocket and subscribe to protocols
   */
  connect(protocols: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.protocols = new Set(protocols);

        // Only try WebSocket if URL is provided
        if (!this.url || this.url.startsWith('http')) {
          // Fall back to polling
          this.startPolling();
          resolve();
          return;
        }

        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('✓ WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;

          // Send subscription message
          this.subscribe(Array.from(this.protocols));

          // Start heartbeat
          this.startHeartbeat();

          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handlePriceUpdate(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnected = false;
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket closed');
          this.isConnected = false;
          this.stopHeartbeat();
          this.attemptReconnect();
        };
      } catch (error) {
        console.warn('Failed to connect WebSocket, using polling:', error);
        this.startPolling();
        resolve();
      }
    });
  }

  /**
   * Subscribe to protocol price updates
   */
  private subscribe(protocols: string[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const message = {
      type: 'subscribe',
      protocols,
      timestamp: Date.now(),
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Handle incoming price updates
   */
  private handlePriceUpdate(data: string): void {
    try {
      const update: WebSocketPrice | WebSocketPrice[] = JSON.parse(data);
      const updates = Array.isArray(update) ? update : [update];

      updates.forEach((price) => {
        this.prices.set(price.symbol, price);
      });

      // Notify callbacks
      const pricesRecord = Object.fromEntries(
        Array.from(this.prices.entries()).map(([symbol, data]) => [symbol, data.price])
      );

      this.callbacks.forEach((callback) => {
        callback(pricesRecord);
      });

      // Reset heartbeat timer
      this.resetHeartbeat();
    } catch (error) {
      console.warn('Failed to parse price update:', error);
    }
  }

  /**
   * Send heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatTimeout = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.heartbeatInterval);
  }

  /**
   * Reset heartbeat timer
   */
  private resetHeartbeat(): void {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
    }
    this.startHeartbeat();
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  /**
   * Attempt to reconnect to WebSocket
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Max reconnect attempts reached, using polling');
      this.startPolling();
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Reconnecting WebSocket in ${delay}ms...`);

    setTimeout(() => {
      this.connect(Array.from(this.protocols)).catch((error) => {
        console.warn('Reconnection failed:', error);
        this.attemptReconnect();
      });
    }, delay);
  }

  /**
   * Fallback polling mechanism
   */
  private startPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    console.log('Starting polling for price updates (30s interval)');

    this.pollingInterval = setInterval(async () => {
      // This would call your price API endpoint
      // For now, just a placeholder
      if (import.meta.env.DEV) {
        console.log('Polling for price updates...');
      }
    }, 30000);
  }

  /**
   * Stop polling
   */
  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Register callback for price updates
   */
  onPriceUpdate(callback: PriceUpdateCallback): () => void {
    this.callbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Get current price for protocol
   */
  getPrice(protocol: string): number | null {
    return this.prices.get(protocol)?.price || null;
  }

  /**
   * Get all prices
   */
  getAllPrices(): Record<string, number> {
    const result: Record<string, number> = {};
    this.prices.forEach((data, symbol) => {
      result[symbol] = data.price;
    });
    return result;
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.stopHeartbeat();
    this.stopPolling();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    this.callbacks.clear();
  }

  /**
   * Check if connected
   */
  isConnectedStatus(): boolean {
    return this.isConnected;
  }
}

/**
 * Global price manager instance
 */
let globalPriceManager: WebSocketPriceManager | null = null;

/**
 * Initialize global price manager
 */
export function initPriceManager(wsUrl: string): WebSocketPriceManager {
  if (!globalPriceManager) {
    globalPriceManager = new WebSocketPriceManager(wsUrl);
  }
  return globalPriceManager;
}

/**
 * Get global price manager
 */
export function getPriceManager(): WebSocketPriceManager {
  if (!globalPriceManager) {
    // Default to polling mode
    globalPriceManager = new WebSocketPriceManager('');
  }
  return globalPriceManager;
}
