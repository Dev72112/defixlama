// React hooks for OKX Web3 API v6 data
import { useQuery } from "@tanstack/react-query";
import {
  fetchOkxTokenRanking,
  fetchOkxCandlesticks,
  fetchOkxHistoricalCandles,
  fetchOkxTokenPriceInfo,
  fetchOkxTokenBasicInfo,
  fetchOkxTopHolders,
  fetchOkxTrades,
  fetchOkxSupportedChains,
  fetchOkxTxHistory,
  fetchOkxIndexPrice,
  type OkxTokenRankingItem,
  type OkxCandlestick,
  type OkxTokenPriceInfo,
  type OkxTokenBasicInfo,
  type OkxTopHolder,
  type OkxTrade,
  type OkxChain,
  type OkxTransaction,
} from "@/lib/api/okx";

// Default chain index for X Layer
const DEFAULT_CHAIN_INDEX = '196';

/**
 * Hook to fetch token rankings
 */
export function useOkxTokenRanking(
  chainIndex: string = DEFAULT_CHAIN_INDEX,
  sortBy: 'change5m' | 'change1h' | 'change4h' | 'change24h' | 'volume24h' | 'marketCap' | 'liquidity' = 'volume24h',
  direction: 'asc' | 'desc' = 'desc',
  limit: number = 50,
  enabled: boolean = true
) {
  return useQuery<OkxTokenRankingItem[]>({
    queryKey: ['okx-token-ranking', chainIndex, sortBy, direction, limit],
    queryFn: () => fetchOkxTokenRanking(chainIndex, sortBy, direction, limit),
    enabled,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Slower refetch to avoid rate limits
  });
}

/**
 * Hook to fetch top gainers
 */
export function useOkxTopGainers(chainIndex: string = DEFAULT_CHAIN_INDEX, limit: number = 10, enabled: boolean = true) {
  return useQuery<OkxTokenRankingItem[]>({
    queryKey: ['okx-top-gainers', chainIndex, limit],
    queryFn: () => fetchOkxTokenRanking(chainIndex, 'change24h', 'desc', limit),
    enabled,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}

/**
 * Hook to fetch top losers
 */
export function useOkxTopLosers(chainIndex: string = DEFAULT_CHAIN_INDEX, limit: number = 10, enabled: boolean = true) {
  return useQuery<OkxTokenRankingItem[]>({
    queryKey: ['okx-top-losers', chainIndex, limit],
    queryFn: () => fetchOkxTokenRanking(chainIndex, 'change24h', 'asc', limit),
    enabled,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}

/**
 * Hook to fetch top volume tokens
 */
export function useOkxTopVolume(chainIndex: string = DEFAULT_CHAIN_INDEX, limit: number = 10, enabled: boolean = true) {
  return useQuery<OkxTokenRankingItem[]>({
    queryKey: ['okx-top-volume', chainIndex, limit],
    queryFn: () => fetchOkxTokenRanking(chainIndex, 'volume24h', 'desc', limit),
    enabled,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}

/**
 * Hook to fetch candlestick data
 */
export function useOkxCandlesticks(
  chainIndex: string,
  tokenAddress: string | null,
  interval: string = '1H',
  limit: number = 100
) {
  return useQuery<OkxCandlestick[]>({
    queryKey: ['okx-candlesticks', chainIndex, tokenAddress, interval, limit],
    queryFn: () => fetchOkxCandlesticks(chainIndex, tokenAddress!, interval, limit),
    enabled: !!tokenAddress,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000,
  });
}

/**
 * Hook to fetch historical candlestick data
 */
export function useOkxHistoricalCandles(
  chainIndex: string,
  tokenAddress: string | null,
  interval: string = '1D',
  limit: number = 100
) {
  return useQuery<OkxCandlestick[]>({
    queryKey: ['okx-historical-candles', chainIndex, tokenAddress, interval, limit],
    queryFn: () => fetchOkxHistoricalCandles(chainIndex, tokenAddress!, interval, undefined, undefined, limit),
    enabled: !!tokenAddress,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch rich token price info
 */
export function useOkxTokenPriceInfo(
  chainIndex: string,
  tokenAddress: string | null
) {
  return useQuery<OkxTokenPriceInfo | null>({
    queryKey: ['okx-token-price-info', chainIndex, tokenAddress],
    queryFn: () => fetchOkxTokenPriceInfo(chainIndex, tokenAddress!),
    enabled: !!tokenAddress,
    staleTime: 5 * 1000, // 5 seconds
    refetchInterval: 5 * 1000,
  });
}

/**
 * Hook to fetch token basic info
 */
export function useOkxTokenBasicInfo(
  chainIndex: string,
  tokenAddress: string | null
) {
  return useQuery<OkxTokenBasicInfo | null>({
    queryKey: ['okx-token-basic-info', chainIndex, tokenAddress],
    queryFn: () => fetchOkxTokenBasicInfo(chainIndex, tokenAddress!),
    enabled: !!tokenAddress,
    staleTime: 5 * 60 * 1000, // 5 minutes (basic info doesn't change often)
  });
}

/**
 * Hook to fetch top holders
 */
export function useOkxTopHolders(
  chainIndex: string,
  tokenAddress: string | null
) {
  return useQuery<OkxTopHolder[]>({
    queryKey: ['okx-top-holders', chainIndex, tokenAddress],
    queryFn: () => fetchOkxTopHolders(chainIndex, tokenAddress!),
    enabled: !!tokenAddress,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch recent trades
 */
export function useOkxTrades(
  chainIndex: string,
  tokenAddress: string | null,
  limit: number = 50
) {
  return useQuery<OkxTrade[]>({
    queryKey: ['okx-trades', chainIndex, tokenAddress, limit],
    queryFn: () => fetchOkxTrades(chainIndex, tokenAddress!, limit),
    enabled: !!tokenAddress,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 10 * 1000,
  });
}

/**
 * Hook to fetch supported chains
 */
export function useOkxSupportedChains() {
  return useQuery<OkxChain[]>({
    queryKey: ['okx-supported-chains'],
    queryFn: fetchOkxSupportedChains,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours (chains don't change often)
  });
}

/**
 * Hook to fetch transaction history for an address
 */
export function useOkxTxHistory(
  chainIndex: string,
  address: string | null,
  limit: number = 50
) {
  return useQuery<OkxTransaction[]>({
    queryKey: ['okx-tx-history', chainIndex, address, limit],
    queryFn: () => fetchOkxTxHistory(chainIndex, address!, limit),
    enabled: !!address,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}

/**
 * Hook to fetch native token index price
 */
export function useOkxIndexPrice(chainIndex: string) {
  return useQuery<{ price: number; symbol: string } | null>({
    queryKey: ['okx-index-price', chainIndex],
    queryFn: () => fetchOkxIndexPrice(chainIndex),
    staleTime: 5 * 1000,
    refetchInterval: 5 * 1000,
  });
}

/**
 * Combined hook to fetch both gainers and losers
 */
export function useOkxGainersAndLosers(chainIndex: string = DEFAULT_CHAIN_INDEX, limit: number = 5) {
  const gainers = useOkxTopGainers(chainIndex, limit);
  const losers = useOkxTopLosers(chainIndex, limit);
  
  return {
    gainers: gainers.data || [],
    losers: losers.data || [],
    isLoading: gainers.isLoading || losers.isLoading,
    error: gainers.error || losers.error,
    refetch: () => {
      gainers.refetch();
      losers.refetch();
    },
  };
}

/**
 * Hook to get full token details (basic + price info combined)
 */
export function useOkxFullTokenInfo(
  chainIndex: string,
  tokenAddress: string | null
) {
  const basicInfo = useOkxTokenBasicInfo(chainIndex, tokenAddress);
  const priceInfo = useOkxTokenPriceInfo(chainIndex, tokenAddress);
  
  return {
    basicInfo: basicInfo.data,
    priceInfo: priceInfo.data,
    isLoading: basicInfo.isLoading || priceInfo.isLoading,
    error: basicInfo.error || priceInfo.error,
    refetch: () => {
      basicInfo.refetch();
      priceInfo.refetch();
    },
  };
}
