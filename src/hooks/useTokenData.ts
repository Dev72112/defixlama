import { useQuery } from "@tanstack/react-query";
import {
  fetchTokenPrices,
  fetchTokenDetails,
  fetchTokenPriceHistory,
  mapTokenData,
  XLAYER_COMMUNITY_TOKENS,
  TokenPrice,
  TokenMarketData,
} from "@/lib/api/coingecko";

// Hook to fetch live token prices with 5s refresh
export function useTokenPrices() {
  return useQuery({
    queryKey: ["token-prices"],
    queryFn: async () => {
      const prices = await fetchTokenPrices();
      const mapped = prices.map(mapTokenData);
      
      // Add community tokens with placeholder data
      const communityTokens = XLAYER_COMMUNITY_TOKENS.map((t) => ({
        symbol: t.symbol,
        name: t.name,
        price: 0,
        change24h: 0,
        volume24h: 0,
        mcap: 0,
        logo: null,
        sparkline: [],
        contract: t.contract,
      }));
      
      return [...mapped, ...communityTokens];
    },
    staleTime: 5 * 1000, // 5 seconds
    refetchInterval: 5 * 1000, // 5 seconds refresh
  });
}

// Hook to fetch single token details
export function useTokenDetails(id: string | null) {
  return useQuery({
    queryKey: ["token-details", id],
    queryFn: () => (id ? fetchTokenDetails(id) : null),
    enabled: !!id,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}

// Hook to fetch token price history
export function useTokenPriceHistory(id: string | null, days: number = 7) {
  return useQuery<TokenMarketData | null>({
    queryKey: ["token-history", id, days],
    queryFn: () => (id ? fetchTokenPriceHistory(id, days) : null),
    enabled: !!id,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}
