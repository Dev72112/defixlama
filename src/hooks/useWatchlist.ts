import { useState, useEffect, useCallback } from "react";

const WATCHLIST_KEY = "defi-xlama-watchlist";

export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  type: "token" | "protocol" | "dex";
  addedAt: number;
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    try {
      const stored = localStorage.getItem(WATCHLIST_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
    } catch (e) {
      console.error("Failed to save watchlist:", e);
    }
  }, [watchlist]);

  const addToWatchlist = useCallback((item: Omit<WatchlistItem, "addedAt">) => {
    setWatchlist((prev) => {
      if (prev.some((w) => w.id === item.id && w.type === item.type)) {
        return prev;
      }
      return [...prev, { ...item, addedAt: Date.now() }];
    });
  }, []);

  const removeFromWatchlist = useCallback((id: string, type: WatchlistItem["type"]) => {
    setWatchlist((prev) => prev.filter((w) => !(w.id === id && w.type === type)));
  }, []);

  const isInWatchlist = useCallback(
    (id: string, type: WatchlistItem["type"]) => {
      return watchlist.some((w) => w.id === id && w.type === type);
    },
    [watchlist]
  );

  const toggleWatchlist = useCallback(
    (item: Omit<WatchlistItem, "addedAt">) => {
      if (isInWatchlist(item.id, item.type)) {
        removeFromWatchlist(item.id, item.type);
      } else {
        addToWatchlist(item);
      }
    },
    [addToWatchlist, removeFromWatchlist, isInWatchlist]
  );

  const clearWatchlist = useCallback(() => {
    setWatchlist([]);
  }, []);

  return {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    toggleWatchlist,
    clearWatchlist,
  };
}
