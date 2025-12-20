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
import oklink from "@/lib/api/oklink";
import { fetchCommunityPricesByContracts, fetchCommunityTokenDetailsByContract } from "@/lib/api/coingecko";

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

      // Try to fetch live prices for community tokens via DefiLlama coins API
      try {
        const contracts = XLAYER_COMMUNITY_TOKENS.map((t) => t.contract);
        const pricesData = await fetchCommunityPricesByContracts(contracts);
        communityTokens.forEach((ct) => {
          const key = `xlayer:${ct.contract}`;
          const coin = pricesData[key];
          if (coin) {
            // coin may have a `price` field
            const price = coin.price ?? (coin.price_usd ?? coin?.price?.usd ?? 0);
            ct.price = typeof price === 'number' ? price : Number(price) || 0;
            ct.change24h = coin.change24h ?? 0;
            ct.volume24h = coin.volume ?? 0;
            ct.logo = coin.logo || ct.logo;
          }
        });
      } catch (err) {
        // fallback silently to placeholder data
      }

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
    queryFn: async () => {
      if (!id) return null;
      // Try CoinGecko first
      const cg = await fetchTokenDetails(id);
      if (cg) return cg;

      // If not found on CoinGecko, check if id looks like a contract or a community symbol
      const lower = id.toLowerCase();
      // If looks like address
      const isAddress = /^0x[a-f0-9]{40}$/.test(lower);
      if (isAddress) {
        const data = await fetchCommunityTokenDetailsByContract(lower);
        if (data) return data;
      }

      // Try by symbol lookup in community tokens
      const match = XLAYER_COMMUNITY_TOKENS.find((t) => t.symbol.toLowerCase() === lower);
      if (match) {
        const data = await fetchCommunityTokenDetailsByContract(match.contract);
        if (data) return data;
      }

      return null;
    },
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

// Fetch OKLink contract info for on-chain enrichment
export function useOklinkContract(contract: string | null) {
  return useQuery({
    queryKey: ["oklink-contract", contract],
    queryFn: () => (contract ? oklink.fetchOklinkContractInfo(contract) : null),
    enabled: !!contract,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}
