// 3-Tier Cache Configuration for React Query

export const CACHE_TIERS = {
  /** Rarely changes: protocols list, chain metadata (5-60 min) */
  STATIC: {
    staleTime: 5 * 60 * 1000,      // 5 min
    gcTime: 60 * 60 * 1000,         // 60 min
    refetchOnWindowFocus: false,
  },
  /** Changes periodically: TVL, volumes, yields (1-5 min) */
  SEMI_STATIC: {
    staleTime: 60 * 1000,           // 1 min
    gcTime: 15 * 60 * 1000,         // 15 min
    refetchOnWindowFocus: true,
  },
  /** Real-time feel: prices, gas (5-30 sec) */
  VOLATILE: {
    staleTime: 5 * 1000,            // 5 sec
    gcTime: 30 * 1000,              // 30 sec
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,     // auto-refresh every 30s
  },
} as const;

export type CacheTier = keyof typeof CACHE_TIERS;

export function getCacheConfig(tier: CacheTier) {
  return CACHE_TIERS[tier];
}
