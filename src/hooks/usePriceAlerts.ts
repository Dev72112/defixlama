import { useState, useEffect, useCallback } from "react";
import { useTokenPrices } from "./useTokenData";
import { toast } from "sonner";

export interface PriceAlert {
  id: string;
  tokenId: string;
  symbol: string;
  name: string;
  targetPrice: number;
  condition: "above" | "below";
  createdAt: number;
  triggered: boolean;
}

const STORAGE_KEY = "xlayer-price-alerts";

export function usePriceAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const { data: tokenPrices = [] } = useTokenPrices();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  }, [alerts]);

  // Check alerts against current prices
  useEffect(() => {
    if (tokenPrices.length === 0) return;

    const activeAlerts = alerts.filter((a) => !a.triggered);
    
    for (const alert of activeAlerts) {
      const token = tokenPrices.find(
        (t) => t.symbol.toLowerCase() === alert.symbol.toLowerCase()
      );
      if (!token || token.price === 0) continue;

      const isTriggered =
        (alert.condition === "above" && token.price >= alert.targetPrice) ||
        (alert.condition === "below" && token.price <= alert.targetPrice);

      if (isTriggered) {
        // Mark as triggered
        setAlerts((prev) =>
          prev.map((a) => (a.id === alert.id ? { ...a, triggered: true } : a))
        );

        // Show toast
        toast.success(`🔔 ${alert.symbol} Price Alert`, {
          description: `${alert.symbol} is now ${alert.condition} $${alert.targetPrice} (Current: $${token.price.toFixed(token.price >= 1 ? 2 : 6)})`,
          duration: 10000,
        });

        // Browser notification
        if (Notification.permission === "granted") {
          new Notification(`${alert.symbol} Price Alert`, {
            body: `${alert.symbol} is now ${alert.condition} $${alert.targetPrice}`,
            icon: token.logo || "/favicon.ico",
          });
        }
      }
    }
  }, [tokenPrices, alerts]);

  const addAlert = useCallback((alert: Omit<PriceAlert, "id" | "createdAt" | "triggered">) => {
    const newAlert: PriceAlert = {
      ...alert,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      triggered: false,
    };
    setAlerts((prev) => [...prev, newAlert]);
    toast.success("Price alert created", {
      description: `Alert when ${alert.symbol} goes ${alert.condition} $${alert.targetPrice}`,
    });
  }, []);

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    const result = await Notification.requestPermission();
    return result === "granted";
  }, []);

  return {
    alerts,
    activeAlerts: alerts.filter((a) => !a.triggered),
    triggeredAlerts: alerts.filter((a) => a.triggered),
    addAlert,
    removeAlert,
    requestNotificationPermission,
  };
}
