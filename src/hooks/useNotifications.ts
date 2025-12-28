import { useState, useEffect, useCallback, useRef } from "react";
import { useTokenPrices } from "./useTokenData";
import { useXLayerProtocols } from "./useDefiData";
import { usePriceAlerts, PriceAlert } from "./usePriceAlerts";

export interface Notification {
  id: string;
  type: "price_alert" | "new_protocol" | "tvl_change" | "volume_spike" | "user_alert";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  icon?: string;
  data?: any;
}

const STORAGE_KEY = "xlayer-notifications";
const SEEN_PROTOCOLS_KEY = "xlayer-seen-protocols";
const PRICE_THRESHOLD = 5; // 5% change threshold

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) }));
      }
    } catch (e) {}
    return [];
  });

  const { data: tokens } = useTokenPrices();
  const { data: protocols } = useXLayerProtocols();
  const { triggeredAlerts } = usePriceAlerts();

  // Track previous values with refs to avoid stale closures
  const previousTokenPrices = useRef<Record<string, number>>({});
  const seenProtocols = useRef<Set<string>>(
    (() => {
      try {
        const stored = localStorage.getItem(SEEN_PROTOCOLS_KEY);
        return stored ? new Set(JSON.parse(stored)) : new Set();
      } catch {
        return new Set();
      }
    })()
  );
  const processedAlertIds = useRef<Set<string>>(new Set());
  const isInitialized = useRef(false);

  // Save to localStorage when notifications change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, 50)));
    } catch (e) {}
  }, [notifications]);

  // Save seen protocols to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SEEN_PROTOCOLS_KEY, JSON.stringify([...seenProtocols.current]));
    } catch (e) {}
  }, [protocols]);

  // Generate notifications from user-created price alerts when they trigger
  useEffect(() => {
    if (!triggeredAlerts || triggeredAlerts.length === 0) return;

    const newNotifications: Notification[] = [];

    triggeredAlerts.forEach((alert: PriceAlert) => {
      // Skip if already processed
      if (processedAlertIds.current.has(alert.id)) return;
      processedAlertIds.current.add(alert.id);

      newNotifications.push({
        id: `user-alert-${alert.id}`,
        type: "user_alert",
        title: `🔔 ${alert.symbol} Alert Triggered`,
        message: `${alert.symbol} went ${alert.condition} $${alert.targetPrice.toLocaleString()}`,
        timestamp: new Date(),
        read: false,
        data: { symbol: alert.symbol, condition: alert.condition, targetPrice: alert.targetPrice },
      });
    });

    if (newNotifications.length > 0) {
      setNotifications((prev) => [...newNotifications, ...prev].slice(0, 50));
    }
  }, [triggeredAlerts]);

  // Generate price movement notifications when prices move significantly
  useEffect(() => {
    if (!tokens || tokens.length === 0) return;

    // Skip first run to establish baseline prices
    if (!isInitialized.current) {
      tokens.forEach((token) => {
        if (token.price > 0) {
          previousTokenPrices.current[token.symbol] = token.price;
        }
      });
      isInitialized.current = true;
      return;
    }

    const newNotifications: Notification[] = [];

    tokens.forEach((token) => {
      const prevPrice = previousTokenPrices.current[token.symbol];
      const currentPrice = token.price;

      if (prevPrice && prevPrice > 0 && currentPrice > 0) {
        const changePercent = ((currentPrice - prevPrice) / prevPrice) * 100;

        // Alert if price moved more than threshold
        if (Math.abs(changePercent) >= PRICE_THRESHOLD) {
          const isUp = changePercent > 0;
          const formattedPrice = currentPrice < 1 
            ? currentPrice.toFixed(6) 
            : currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          
          newNotifications.push({
            id: `price-${token.symbol}-${Date.now()}`,
            type: "price_alert",
            title: `${token.symbol} ${isUp ? "surged" : "dropped"} ${Math.abs(changePercent).toFixed(1)}%`,
            message: `${token.name} is now $${formattedPrice}`,
            timestamp: new Date(),
            read: false,
            icon: token.logo,
            data: { symbol: token.symbol, change: changePercent, price: currentPrice },
          });
        }
      }

      // Update previous price
      if (currentPrice > 0) {
        previousTokenPrices.current[token.symbol] = currentPrice;
      }
    });

    if (newNotifications.length > 0) {
      setNotifications((prev) => [...newNotifications, ...prev].slice(0, 50));
    }
  }, [tokens]);

  // Detect new protocols
  useEffect(() => {
    if (!protocols || protocols.length === 0) return;

    // Initialize seen protocols on first load
    if (seenProtocols.current.size === 0) {
      protocols.forEach((p: any) => seenProtocols.current.add(p.slug || p.name));
      return;
    }

    const newNotifications: Notification[] = [];

    protocols.forEach((protocol: any) => {
      const key = protocol.slug || protocol.name;
      if (!seenProtocols.current.has(key)) {
        seenProtocols.current.add(key);
        
        const tvlFormatted = protocol.tvl >= 1e9 
          ? `$${(protocol.tvl / 1e9).toFixed(2)}B`
          : protocol.tvl >= 1e6 
            ? `$${(protocol.tvl / 1e6).toFixed(2)}M`
            : `$${(protocol.tvl / 1e3).toFixed(2)}K`;

        newNotifications.push({
          id: `protocol-${key}-${Date.now()}`,
          type: "new_protocol",
          title: "New Protocol Listed",
          message: `${protocol.name} has been added with ${tvlFormatted} TVL`,
          timestamp: new Date(),
          read: false,
          icon: protocol.logo,
          data: { slug: protocol.slug, name: protocol.name, tvl: protocol.tvl },
        });
      }
    });

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
