import { useQuery } from "@tanstack/react-query";
import {
  fetchTokenPrices,
  fetchTokenDetails,
  fetchTokenPriceHistory,
  mapTokenData,
  XLAYER_COMMUNITY_TOKENS,
  TokenPrice,
  TokenMarketData,
  fetchDexScreenerPrices,
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
      
      // Add community tokens with their logos
      const communityTokens = XLAYER_COMMUNITY_TOKENS.map((t) => ({
        symbol: t.symbol,
        name: t.name,
        price: 0,
        change24h: 0,
        volume24h: 0,
        mcap: 0,
        logo: t.logo,
        sparkline: [],
        contract: t.contract,
        isCommunityToken: true,
      }));

      // Try multiple sources for community token prices
      const contracts = XLAYER_COMMUNITY_TOKENS.map((t) => t.contract);
      
      // Try DefiLlama first
      try {
        const pricesData = await fetchCommunityPricesByContracts(contracts);
        communityTokens.forEach((ct) => {
          const key = `xlayer:${ct.contract}`;
          const coin = pricesData[key];
          if (coin) {
            const price = coin.price ?? (coin.price_usd ?? coin?.price?.usd ?? 0);
            ct.price = typeof price === 'number' ? price : Number(price) || 0;
            ct.change24h = coin.change24h ?? 0;
            ct.volume24h = coin.volume ?? 0;
            if (coin.logo) ct.logo = coin.logo;
          }
        });
      } catch (err) {
        // ignore
      }

      // Try DexScreener as fallback for tokens still missing prices
      try {
        const missingContracts = communityTokens
          .filter((ct) => ct.price === 0)
          .map((ct) => ct.contract);
        
        if (missingContracts.length > 0) {
          const dexPrices = await fetchDexScreenerPrices(missingContracts);
          communityTokens.forEach((ct) => {
            if (ct.price === 0) {
              const dexData = dexPrices[ct.contract.toLowerCase()];
              if (dexData) {
                ct.price = dexData.price || 0;
                ct.change24h = dexData.change24h || 0;
                ct.volume24h = dexData.volume24h || 0;
              }
            }
          });
        }
      } catch (err) {
        // ignore
      }

      return [...mapped, ...communityTokens];
    },
    staleTime: 5 * 1000,
    refetchInterval: 5 * 1000,
  });
}

// Hook to fetch single token details
export function useTokenDetails(id: string | null) {
  return useQuery({
    queryKey: ["token-details", id],
    queryFn: async () => {
      if (!id) return null;
      
      const lower = id.toLowerCase();
      
      // Check if id matches a community token symbol first
      const communityMatch = XLAYER_COMMUNITY_TOKENS.find(
        (t) => t.symbol.toLowerCase() === lower || t.contract.toLowerCase() === lower
      );
      
      if (communityMatch) {
        // Try to get data from DexScreener
        try {
          const dexData = await fetchDexScreenerPrices([communityMatch.contract]);
          const tokenData = dexData[communityMatch.contract.toLowerCase()];
          
          return {
            id: communityMatch.contract,
            name: communityMatch.name,
            symbol: communityMatch.symbol,
            image: { large: communityMatch.logo, small: communityMatch.logo },
            contract: communityMatch.contract,
            market_data: {
              current_price: { usd: tokenData?.price || 0 },
              price_change_percentage_24h: tokenData?.change24h || 0,
              total_volume: { usd: tokenData?.volume24h || 0 },
              market_cap: { usd: 0 },
              ath: { usd: 0 },
              high_24h: { usd: 0 },
              low_24h: { usd: 0 },
              atl: { usd: 0 },
              circulating_supply: 0,
              total_supply: 0,
              max_supply: null,
            },
            description: { en: `${communityMatch.name} is a community token on the XLayer network.` },
            isCommunityToken: true,
          };
        } catch (e) {
          // Return basic info
          return {
            id: communityMatch.contract,
            name: communityMatch.name,
            symbol: communityMatch.symbol,
            image: { large: communityMatch.logo, small: communityMatch.logo },
            contract: communityMatch.contract,
            market_data: {
              current_price: { usd: 0 },
              price_change_percentage_24h: 0,
              total_volume: { usd: 0 },
              market_cap: { usd: 0 },
            },
            description: { en: `${communityMatch.name} is a community token on the XLayer network.` },
            isCommunityToken: true,
          };
        }
      }
      
      // Try CoinGecko for standard tokens
      const cg = await fetchTokenDetails(id);
      if (cg) return cg;

      // If looks like address
      const isAddress = /^0x[a-f0-9]{40}$/i.test(lower);
      if (isAddress) {
        const data = await fetchCommunityTokenDetailsByContract(lower);
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
