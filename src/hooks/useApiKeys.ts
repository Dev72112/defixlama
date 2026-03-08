import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  dailyLimit: number;
  permissions: string[];
  createdAt: string;
  revokedAt: string | null;
}

export interface ApiUsageDay {
  date: string;
  requests: number;
}

export function useApiKeys() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [usage, setUsage] = useState<ApiUsageDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadKeys = useCallback(async () => {
    if (!user) { setKeys([]); setLoading(false); return; }
    const { data } = await supabase
      .from("api_keys")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      setKeys(data.map((k) => ({
        id: k.id,
        name: k.name,
        keyPrefix: k.key_hash.slice(0, 12) + "…",
        dailyLimit: k.daily_limit,
        permissions: k.permissions || ["read"],
        createdAt: k.created_at,
        revokedAt: k.revoked_at,
      })));
    }
    setLoading(false);
  }, [user?.id]);

  const loadUsage = useCallback(async () => {
    if (!user) { setUsage([]); return; }

    // Get all key IDs for user
    const { data: keyData } = await supabase
      .from("api_keys")
      .select("id")
      .eq("user_id", user.id);

    if (!keyData || keyData.length === 0) { setUsage([]); return; }

    const keyIds = keyData.map((k) => k.id);
    const { data: usageData } = await supabase
      .from("api_usage")
      .select("*")
      .in("key_id", keyIds)
      .order("date", { ascending: true });

    if (usageData) {
      // Aggregate by date
      const byDate = new Map<string, number>();
      for (const row of usageData) {
        byDate.set(row.date, (byDate.get(row.date) || 0) + row.request_count);
      }

      // Build 30-day array
      const days: ApiUsageDay[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        days.push({
          date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          requests: byDate.get(dateStr) || 0,
        });
      }
      setUsage(days);
    }
  }, [user?.id]);

  useEffect(() => {
    loadKeys();
    loadUsage();
  }, [loadKeys, loadUsage]);

  const generateKey = useCallback(async (name = "Default") => {
    if (!user) return null;
    setGenerating(true);

    // Generate a random key
    const rawKey = `dxl_live_${crypto.randomUUID().replace(/-/g, "")}`;

    // Hash it with SHA-256 for storage
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(rawKey));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    const { data, error } = await supabase
      .from("api_keys")
      .insert({ user_id: user.id, key_hash: keyHash, name })
      .select()
      .single();

    setGenerating(false);

    if (error || !data) return null;

    await loadKeys();
    // Return the raw key only once — it can never be retrieved again
    return rawKey;
  }, [user?.id, loadKeys]);

  const revokeKey = useCallback(async (keyId: string) => {
    if (!user) return;
    await supabase
      .from("api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", keyId)
      .eq("user_id", user.id);
    await loadKeys();
  }, [user?.id, loadKeys]);

  const totalRequests = usage.reduce((s, d) => s + d.requests, 0);
  const activeKeys = keys.filter((k) => !k.revokedAt);

  return {
    keys,
    activeKeys,
    usage,
    loading,
    generating,
    totalRequests,
    generateKey,
    revokeKey,
    refresh: loadKeys,
  };
}
