import { useState, useEffect, useCallback } from "react";
import { useTokenPrices } from "./useTokenData";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
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

function getLocalAlerts(): PriceAlert[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function setLocalAlerts(alerts: PriceAlert[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts)); } catch {}
}

export function usePriceAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<PriceAlert[]>(getLocalAlerts);
  const { data: tokenPrices = [] } = useTokenPrices();

  // Load from DB when authenticated
  useEffect(() => {
    if (!user) { setAlerts(getLocalAlerts()); return; }

    const load = async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "price")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setAlerts(data.map((d) => ({
          id: d.id,
          tokenId: d.symbol, // using symbol as tokenId for price alerts
          symbol: d.symbol,
          name: d.symbol,
          targetPrice: Number(d.threshold),
          condition: d.condition === "drops_below" ? "below" : "above",
          createdAt: new Date(d.created_at).getTime(),
          triggered: d.triggered,
        })));
      }
    };
    load();
  }, [user?.id]);

  // Persist to localStorage for guests
  useEffect(() => {
    if (!user) setLocalAlerts(alerts);
  }, [alerts, user]);

  // Check alerts against current prices
  useEffect(() => {
    if (tokenPrices.length === 0) return;

    const activeAlerts = alerts.filter((a) => !a.triggered);
    for (const alert of activeAlerts) {
      const token = tokenPrices.find((t) => t.symbol.toLowerCase() === alert.symbol.toLowerCase());
      if (!token || token.price === 0) continue;

      const isTriggered =
        (alert.condition === "above" && token.price >= alert.targetPrice) ||
        (alert.condition === "below" && token.price <= alert.targetPrice);

      if (isTriggered) {
        // Mark as triggered
        setAlerts((prev) => prev.map((a) => (a.id === alert.id ? { ...a, triggered: true } : a)));

        if (user) {
          supabase.from("alerts").update({ triggered: true, last_triggered_at: new Date().toISOString() }).eq("id", alert.id);
        }

        toast.success(`🔔 ${alert.symbol} Price Alert`, {
          description: `${alert.symbol} is now ${alert.condition} $${alert.targetPrice} (Current: $${token.price.toFixed(token.price >= 1 ? 2 : 6)})`,
          duration: 10000,
        });

        if (Notification.permission === "granted") {
          new Notification(`${alert.symbol} Price Alert`, {
            body: `${alert.symbol} is now ${alert.condition} $${alert.targetPrice}`,
            icon: token.logo || "/favicon.ico",
          });
        }
      }
    }
  }, [tokenPrices, alerts]);

  const addAlert = useCallback(async (alert: Omit<PriceAlert, "id" | "createdAt" | "triggered">) => {
    if (user) {
      const { data, error } = await supabase.from("alerts").insert({
        user_id: user.id,
        type: "price" as const,
        symbol: alert.symbol,
        condition: alert.condition === "below" ? "drops_below" : "rises_above",
        threshold: alert.targetPrice,
      }).select().single();

      if (!error && data) {
        setAlerts((prev) => [{
          id: data.id, tokenId: alert.tokenId, symbol: data.symbol,
          name: alert.name, targetPrice: Number(data.threshold),
          condition: alert.condition, createdAt: new Date(data.created_at).getTime(), triggered: false,
        }, ...prev]);
      }
    } else {
      const newAlert: PriceAlert = { ...alert, id: crypto.randomUUID(), createdAt: Date.now(), triggered: false };
      setAlerts((prev) => [newAlert, ...prev]);
    }

    toast.success("Price alert created", {
      description: `Alert when ${alert.symbol} goes ${alert.condition} $${alert.targetPrice}`,
    });
  }, [user]);

  const removeAlert = useCallback(async (id: string) => {
    if (user) {
      await supabase.from("alerts").delete().eq("id", id).eq("user_id", user.id);
    }
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, [user]);

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
