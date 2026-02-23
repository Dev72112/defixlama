/**
 * React hook for real-time price updates via WebSocket
 */

import { useEffect, useState, useRef } from 'react';
import { initPriceManager } from '@/lib/websocket/priceManager';

/**
 * Hook to subscribe to real-time prices
 * @param protocols - Array of protocol slugs to track
 * @param wsUrl - WebSocket URL (optional, defaults to polling)
 */
export function useLivePrice(protocols: string[], wsUrl?: string) {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [isConnected, setIsConnected] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (protocols.length === 0) return;

    const manager = initPriceManager(wsUrl || '');

    // Initialize connection
    manager.connect(protocols).then(() => {
      setIsConnected(manager.isConnectedStatus());

      // Subscribe to updates
      unsubscribeRef.current = manager.onPriceUpdate((newPrices) => {
        setPrices(newPrices);
      });

      // Set initial prices
      setPrices(manager.getAllPrices());
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [protocols, wsUrl]);

  return {
    prices,
    isConnected,
    getPrice: (protocol: string) => prices[protocol] || null,
  };
}

/**
 * Hook to get single price with live updates
 */
export function useLiveSinglePrice(protocol: string, wsUrl?: string) {
  const { prices, isConnected } = useLivePrice([protocol], wsUrl);

  return {
    price: prices[protocol] || null,
    isConnected,
  };
}
