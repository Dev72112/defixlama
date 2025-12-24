import { useState, useEffect, useCallback } from "react";
import { useTokenPrices } from "./useTokenData";
import { useXLayerProtocols } from "./useDefiData";

export interface Notification {
  id: string;
  type: "price_alert" | "new_protocol" | "tvl_change" | "volume_spike";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  icon?: string;
  data?: any;
}

// Store previous values for comparison
let previousTokenPrices: Record<string, number> = {};
let previousProtocolCount = 0;
let seenProtocols = new Set<string>();

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    // Load from localStorage
    try {
      const stored = localStorage.getItem("xlayer-notifications");
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) }));
      }
    } catch (e) {}
    return [];
  });

  const { data: tokens } = useTokenPrices();
  const { data: protocols } = useXLayerProtocols();

  // Save to localStorage when notifications change
  useEffect(() => {
    try {
      localStorage.setItem("xlayer-notifications", JSON.stringify(notifications.slice(0, 50)));
    } catch (e) {}
  }, [notifications]);

  // Generate price alerts when prices move significantly
  useEffect(() => {
    if (!tokens || tokens.length === 0) return;

    const newNotifications: Notification[] = [];

    tokens.forEach((token) => {
      const prevPrice = previousTokenPrices[token.symbol];
      const currentPrice = token.price;

      if (prevPrice && currentPrice > 0) {
        const changePercent = ((currentPrice - prevPrice) / prevPrice) * 100;

        // Alert if price moved more than 5%
        if (Math.abs(changePercent) >= 5) {
          const isUp = changePercent > 0;
          newNotifications.push({
            id: `price-${token.symbol}-${Date.now()}`,
            type: "price_alert",
            title: `${token.symbol} ${isUp ? "surged" : "dropped"} ${Math.abs(changePercent).toFixed(1)}%`,
            message: `${token.name} is now $${currentPrice.toFixed(currentPrice < 1 ? 6 : 2)}`,
            timestamp: new Date(),
            read: false,
            icon: token.logo,
            data: { symbol: token.symbol, change: changePercent },
          });
        }
      }

      previousTokenPrices[token.symbol] = currentPrice;
    });

    if (newNotifications.length > 0) {
      setNotifications((prev) => [...newNotifications, ...prev].slice(0, 50));
    }
  }, [tokens]);

  // Detect new protocols
  useEffect(() => {
    if (!protocols || protocols.length === 0) return;

    const newNotifications: Notification[] = [];

    // Initialize seen protocols on first load
    if (seenProtocols.size === 0) {
      protocols.forEach((p: any) => seenProtocols.add(p.slug || p.name));
      previousProtocolCount = protocols.length;
      return;
    }

    // Check for new protocols
    protocols.forEach((protocol: any) => {
      const key = protocol.slug || protocol.name;
      if (!seenProtocols.has(key)) {
        seenProtocols.add(key);
        newNotifications.push({
          id: `protocol-${key}-${Date.now()}`,
          type: "new_protocol",
          title: "New Protocol Listed",
          message: `${protocol.name} has been added with $${((protocol.tvl || 0) / 1e6).toFixed(2)}M TVL`,
          timestamp: new Date(),
          read: false,
          icon: protocol.logo,
          data: { slug: protocol.slug, name: protocol.name },
        });
      }
    });

    previousProtocolCount = protocols.length;

    if (newNotifications.length > 0) {
      setNotifications((prev) => [...newNotifications, ...prev].slice(0, 50));
    }
  }, [protocols]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
}
