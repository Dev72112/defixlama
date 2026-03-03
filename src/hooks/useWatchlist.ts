import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

const WATCHLIST_KEY = "defi-xlama-watchlist";

export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  type: "token" | "protocol" | "dex";
  addedAt: number;
}

function getLocalWatchlist(): WatchlistItem[] {
  try {
    const stored = localStorage.getItem(WATCHLIST_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function setLocalWatchlist(items: WatchlistItem[]) {
  try { localStorage.setItem(WATCHLIST_KEY, JSON.stringify(items)); } catch {}
}

export function useWatchlist() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(getLocalWatchlist);

  // Load from DB when authenticated
  useEffect(() => {
    if (!user) { setWatchlist(getLocalWatchlist()); return; }

    const load = async () => {
      const { data, error } = await supabase
        .from("watchlist")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setWatchlist(data.map((d) => ({
          id: d.item_id,
          symbol: d.symbol,
          name: d.name,
          type: d.type as WatchlistItem["type"],
          addedAt: new Date(d.created_at).getTime(),
        })));
      }
    };
    load();
  }, [user?.id]);

  // Persist to localStorage for guests
  useEffect(() => {
    if (!user) setLocalWatchlist(watchlist);
  }, [watchlist, user]);

  const addToWatchlist = useCallback(async (item: Omit<WatchlistItem, "addedAt">) => {
    if (watchlist.some((w) => w.id === item.id && w.type === item.type)) return;

    if (user) {
      await supabase.from("watchlist").insert({
        user_id: user.id,
        item_id: item.id,
        symbol: item.symbol,
        name: item.name,
        type: item.type,
      });
    }
    setWatchlist((prev) => [...prev, { ...item, addedAt: Date.now() }]);
  }, [user, watchlist]);

  const removeFromWatchlist = useCallback(async (id: string, type: WatchlistItem["type"]) => {
    if (user) {
      await supabase.from("watchlist").delete().eq("user_id", user.id).eq("item_id", id).eq("type", type);
    }
    setWatchlist((prev) => prev.filter((w) => !(w.id === id && w.type === type)));
  }, [user]);

  const isInWatchlist = useCallback(
    (id: string, type: WatchlistItem["type"]) => watchlist.some((w) => w.id === id && w.type === type),
    [watchlist]
  );

  const toggleWatchlist = useCallback(
    (item: Omit<WatchlistItem, "addedAt">) => {
      if (isInWatchlist(item.id, item.type)) removeFromWatchlist(item.id, item.type);
      else addToWatchlist(item);
    },
    [addToWatchlist, removeFromWatchlist, isInWatchlist]
  );

  const clearWatchlist = useCallback(async () => {
    if (user) {
      await supabase.from("watchlist").delete().eq("user_id", user.id);
    }
    setWatchlist([]);
  }, [user]);

  return { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist, toggleWatchlist, clearWatchlist };
}
