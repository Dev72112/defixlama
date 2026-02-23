/**
 * Cache Configuration Strategy
 * Different data types have different update frequencies
 * This file centralizes cache timing decisions
 */

/**
 * STATIC DATA - Changes rarely, safe to cache long
 * Examples: Protocol list, chain names, audit history
 */
export const CACHE_TIME = {
  // Protocol metadata that rarely changes
  PROTOCOL_LIST: 10 * 60 * 1000,      // 10 minutes
  PROTOCOL_DETAIL: 10 * 60 * 1000,   // 10 minutes
  PROTOCOL_HISTORY: 30 * 60 * 1000,  // 30 minutes

  // Token information (symbols, decimals, contracts)
  TOKEN_METADATA: 60 * 60 * 1000,     // 1 hour

  // Chain information (rarely changes)
  CHAINS: 60 * 60 * 1000,             // 1 hour

  // Audit and security info (doesn't change often)
  AUDITS: 24 * 60 * 60 * 1000,        // 24 hours
  SECURITY_DATA: 24 * 60 * 60 * 1000, // 24 hours
} as const;

/**
 * SEMI-STATIC DATA - Updates daily or less frequently
 * Examples: Total TVL, daily volume, APY averages
 */
export const CACHE_TIME_DAILY = {
  // Daily aggregated metrics
  DAILY_TVL: 5 * 60 * 1000,           // 5 minutes (refresh 5x per day)
  DAILY_VOLUME: 5 * 60 * 1000,        // 5 minutes
  DAILY_FEES: 5 * 60 * 1000,          // 5 minutes

  // Historical data (daily candles don't update constantly)
  HISTORICAL_PRICES: 60 * 60 * 1000,  // 1 hour
  HISTORICAL_TVL: 60 * 60 * 1000,     // 1 hour

  // Market structure snapshots
  TOP_PROTOCOLS: 10 * 60 * 1000,      // 10 minutes
  YIELD_OPPORTUNITIES: 15 * 60 * 1000, // 15 minutes
} as const;

/**
 * VOLATILE DATA - Updates frequently, refresh often
 * Examples: Live prices, current TVL, real-time metrics
 */
export const CACHE_TIME_VOLATILE = {
  // Prices update in real-time via exchanges
  LIVE_PRICES: 5 * 1000,              // 5 seconds
  LIVE_PRICE_CHARTS: 10 * 1000,       // 10 seconds (streaming updates)

  // Live metrics
  CURRENT_TVL: 30 * 1000,             // 30 seconds
  CURRENT_VOLUME: 30 * 1000,          // 30 seconds

  // User-specific (refreshed on demand)
  USER_PORTFOLIO: 2 * 1000,           // 2 seconds
  USER_ALERTS: 1 * 1000,              // 1 second

  // Real-time market data
  LIVE_SWAPS: 3 * 1000,               // 3 seconds
  MEMPOOL: 3 * 1000,                  // 3 seconds
} as const;

/**
 * STALE TIME - How long before data is considered stale
 * React Query will refetch in background when this expires
 */
export const STALE_TIME = {
  STATIC: CACHE_TIME.PROTOCOL_LIST,
  SEMI_STATIC: CACHE_TIME_DAILY.DAILY_TVL,
  VOLATILE: CACHE_TIME_VOLATILE.LIVE_PRICES,
} as const;

/**
 * GC TIME - How long to keep unused data in cache
 * Garbage collection removes unused queries after this time
 */
export const GC_TIME = {
  // Keep static data longer (low bandwidth cost)
  STATIC: 24 * 60 * 60 * 1000,        // 24 hours

  // Keep semi-static data reasonable duration
  SEMI_STATIC: 2 * 60 * 60 * 1000,    // 2 hours

  // Volatile data expires quicker
  VOLATILE: 10 * 60 * 1000,           // 10 minutes
} as const;

/**
 * RETRY STRATEGY - How many times to retry failed requests
 */
export const RETRY_CONFIG = {
  // One-time calls (mutations) retry more
  MUTATION: 3,

  // User-triggered queries retry less
  USER_QUERY: 2,

  // Background queries retry once
  BACKGROUND: 1,
} as const;

/**
 * Helper function to get cache config by data type
 */
export function getCacheConfig(dataType: keyof typeof CACHE_TIME | keyof typeof CACHE_TIME_DAILY | keyof typeof CACHE_TIME_VOLATILE) {
  // Check which category this belongs to
  if (dataType in CACHE_TIME) {
    return {
      staleTime: CACHE_TIME[dataType as keyof typeof CACHE_TIME],
      gcTime: GC_TIME.STATIC,
    };
  }
  if (dataType in CACHE_TIME_DAILY) {
    return {
      staleTime: CACHE_TIME_DAILY[dataType as keyof typeof CACHE_TIME_DAILY],
      gcTime: GC_TIME.SEMI_STATIC,
    };
  }
  if (dataType in CACHE_TIME_VOLATILE) {
    return {
      staleTime: CACHE_TIME_VOLATILE[dataType as keyof typeof CACHE_TIME_VOLATILE],
      gcTime: GC_TIME.VOLATILE,
    };
  }

  // Default to volatile if not found
  return {
    staleTime: CACHE_TIME_VOLATILE.CURRENT_TVL,
    gcTime: GC_TIME.VOLATILE,
  };
}

/**
 * Query client default options using cache strategy
 */
export const QUERY_CLIENT_DEFAULT_OPTIONS = {
  queries: {
    retry: RETRY_CONFIG.USER_QUERY,
    staleTime: CACHE_TIME_VOLATILE.CURRENT_TVL,  // Default to medium-volatile
    gcTime: GC_TIME.SEMI_STATIC,
    refetchOnWindowFocus: true,  // Refetch when user returns to tab
    refetchOnReconnect: true,    // Refetch when internet reconnects
  },
} as const;

/**
 * Usage Examples:
 *
 * // For a protocol list (static data)
 * const { data: protocols } = useQuery({
 *   queryKey: ['protocols'],
 *   queryFn: fetchProtocols,
 *   ...getCacheConfig('PROTOCOL_LIST'),
 * });
 *
 * // For live prices (volatile data)
 * const { data: prices } = useQuery({
 *   queryKey: ['prices'],
 *   queryFn: fetchPrices,
 *   ...getCacheConfig('LIVE_PRICES'),
 * });
 *
 * // For daily metrics (semi-static)
 * const { data: tvl } = useQuery({
 *   queryKey: ['tvl'],
 *   queryFn: fetchTVL,
 *   ...getCacheConfig('DAILY_TVL'),
 * });
 */
