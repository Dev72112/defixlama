// Token data hooks with multi-source fallback (DefiLlama -> OKLink -> DexScreener -> CoinGecko)
import { useQuery } from "@tanstack/react-query";
import {
  fetchTokenPrices,
  fetchTokenPricesFromDefiLlama,
  fetchTokenDetails,
  fetchTokenPriceHistory,
  mapTokenData,
  XLAYER_COMMUNITY_TOKENS,
  TokenPrice,
  TokenMarketData,
  fetchDexScreenerPrices,
  fetchCommunityPricesByContracts,
  fetchCommunityTokenDetailsByContract,
  fetchCommunityTokenPriceHistory,
  TOKEN_IDS,
  TOKEN_IDS_REVERSE,
} from "@/lib/api/coingecko";
import oklink from "@/lib/api/oklink";
import { toast } from "sonner";

// Track API failures for fallback logic
let apiFailures = { defillama: 0, coingecko: 0, oklink: 0, dexscreener: 0 };
const MAX_FAILURES = 3;

function resetFailureCount(api: keyof typeof apiFailures) {
  apiFailures[api] = 0;
}

function incrementFailure(api: keyof typeof apiFailures) {
  apiFailures[api]++;
  if (apiFailures[api] === MAX_FAILURES) {
    console.warn(`${api} API has failed ${MAX_FAILURES} times, switching to fallback`);
  }
}

// Hook to fetch live token prices with multi-source fallback
export function useTokenPrices() {
  return useQuery({
    queryKey: ["token-prices"],
    queryFn: async () => {
      let prices: TokenPrice[] = [];
      let source = "none";
      
      // Try DefiLlama first (primary source)
      if (apiFailures.defillama < MAX_FAILURES) {
        try {
          prices = await fetchTokenPricesFromDefiLlama();
          if (prices.length > 0) {
            source = "defillama";
            resetFailureCount("defillama");
          }
        } catch (e) {
          incrementFailure("defillama");
        }
      }
      
      // Try CoinGecko as fallback
      if (prices.length === 0 && apiFailures.coingecko < MAX_FAILURES) {
        try {
          prices = await fetchTokenPrices();
          if (prices.length > 0) {
            source = "coingecko";
            resetFailureCount("coingecko");
          }
        } catch (e) {
          incrementFailure("coingecko");
        }
      }
      
      // Map to our format
      const mapped = prices.map(mapTokenData);
      
      // Add community tokens - now fetch from CoinGecko since they're listed!
      const communityTokens = await Promise.all(
        XLAYER_COMMUNITY_TOKENS.map(async (t) => {
          let price = 0;
          let change24h = 0;
          let volume24h = 0;
          let mcap = 0;
          
          // Try CoinGecko via edge function (primary source - they're listed!)
          if (t.coingeckoId) {
            try {
              const cgData = await fetchTokenDetails(t.coingeckoId);
              if (cgData?.market_data) {
                price = cgData.market_data.current_price?.usd || 0;
                change24h = cgData.market_data.price_change_percentage_24h || 0;
                volume24h = cgData.market_data.total_volume?.usd || 0;
                mcap = cgData.market_data.market_cap?.usd || 0;
              }
            } catch (e) {
              console.log(`CoinGecko failed for ${t.symbol}, trying fallbacks`);
            }
          }
          
          // Fallback: Try OKLink
          if (price === 0) {
            try {
              const oklinkPrice = await oklink.fetchOklinkLivePrice(t.contract);
              if (oklinkPrice && oklinkPrice.price > 0) {
                price = oklinkPrice.price;
                change24h = oklinkPrice.change24h;
                volume24h = oklinkPrice.volume24h;
              }
            } catch (e) {}
          }
          
          // Fallback: Try DexScreener
          if (price === 0) {
            try {
              const dexPrices = await fetchDexScreenerPrices([t.contract]);
              const dexData = dexPrices[t.contract.toLowerCase()];
              if (dexData) {
                price = dexData.price || 0;
                change24h = dexData.change24h || 0;
                volume24h = dexData.volume24h || 0;
              }
            } catch (e) {}
          }
          
          return {
            id: t.coingeckoId || t.contract,
            symbol: t.symbol,
            name: t.name,
            price,
            change24h,
            volume24h,
            mcap,
            logo: t.logo,
            sparkline: [] as number[],
            contract: t.contract,
            isCommunityToken: true,
          };
        })
      );

      // Log data source for debugging
      if (source !== "none") {
        console.log(`Token prices loaded from: ${source}`);
      }

      return [...mapped, ...communityTokens];
    },
    staleTime: 5 * 1000,
    refetchInterval: 5 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

// Hook to fetch single token details with fallback
export function useTokenDetails(id: string | null) {
  return useQuery({
    queryKey: ["token-details", id],
    queryFn: async () => {
      if (!id) return null;
      
      const lower = id.toLowerCase();
      
      // Check if id matches a community token
      const communityMatch = XLAYER_COMMUNITY_TOKENS.find(
        (t) => t.symbol.toLowerCase() === lower || t.contract.toLowerCase() === lower
      );
      
      if (communityMatch) {
        // Try CoinGecko first (these tokens ARE listed now!)
        if (communityMatch.coingeckoId) {
          try {
            const cgData = await fetchTokenDetails(communityMatch.coingeckoId);
            if (cgData) {
              return {
                ...cgData,
                contract: communityMatch.contract,
                isCommunityToken: true,
                image: cgData.image || { large: communityMatch.logo, small: communityMatch.logo },
              };
            }
          } catch (e) {
            console.log(`CoinGecko failed for ${communityMatch.symbol}`);
          }
        }
        
        // Try OKLink as fallback
        try {
          const oklinkData = await oklink.fetchOklinkContractInfo(communityMatch.contract);
          if (oklinkData) {
            return {
              id: communityMatch.contract,
              name: oklinkData.name || communityMatch.name,
              symbol: oklinkData.symbol || communityMatch.symbol,
              image: { large: oklinkData.logo || communityMatch.logo, small: oklinkData.logo || communityMatch.logo },
              contract: communityMatch.contract,
              market_data: {
                current_price: { usd: oklinkData.price || 0 },
                price_change_percentage_24h: oklinkData.change24h || 0,
                total_volume: { usd: oklinkData.volume24h || 0 },
                market_cap: { usd: oklinkData.marketCap || 0 },
                total_supply: oklinkData.totalSupply ? parseFloat(oklinkData.totalSupply) : 0,
              },
              description: { en: oklinkData.description || `${communityMatch.name} is a community token on XLayer.` },
              holders: oklinkData.holders,
              isCommunityToken: true,
            };
          }
        } catch (e) {}

        // Try DexScreener as fallback
        try {
          const dexData = await fetchDexScreenerPrices([communityMatch.contract]);
          const tokenData = dexData[communityMatch.contract.toLowerCase()];
          if (tokenData) {
            return {
              id: communityMatch.contract,
              name: tokenData.name || communityMatch.name,
              symbol: tokenData.symbol || communityMatch.symbol,
              image: { large: communityMatch.logo, small: communityMatch.logo },
              contract: communityMatch.contract,
              market_data: {
                current_price: { usd: tokenData.price || 0 },
                price_change_percentage_24h: tokenData.change24h || 0,
                total_volume: { usd: tokenData.volume24h || 0 },
                market_cap: { usd: 0 },
              },
              description: { en: `${communityMatch.name} is a community token on XLayer.` },
              isCommunityToken: true,
            };
          }
        } catch (e) {}

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
          description: { en: `${communityMatch.name} is a community token on XLayer.` },
          isCommunityToken: true,
        };
      }
      
      // Check if it's a standard CoinGecko token
      const tokenIdEntry = Object.entries(TOKEN_IDS).find(
        ([symbol, cgId]) => cgId === lower || symbol.toLowerCase() === lower
      );
      
      if (tokenIdEntry) {
        const cgId = tokenIdEntry[1] as string;
        const cg = await fetchTokenDetails(cgId);
        if (cg) return cg;
      }
      
      // Try CoinGecko directly
      const cg = await fetchTokenDetails(id);
      if (cg) return cg;

      // Try OKLink for contract addresses
      const isAddress = /^0x[a-f0-9]{40}$/i.test(lower);
      if (isAddress) {
        try {
          const ok = await oklink.fetchOklinkContractInfo(lower);
          if (ok) {
            return {
              id: lower,
              name: ok.name || ok.contractName || id,
              symbol: ok.symbol || "",
              image: { large: ok.logo || "", small: ok.logo || "" },
              contract: lower,
              market_data: {
                current_price: { usd: ok.price || 0 },
                price_change_percentage_24h: ok.change24h || 0,
                total_volume: { usd: ok.volume24h || 0 },
                market_cap: { usd: ok.marketCap || 0 },
              },
              description: { en: ok.description || "" },
            };
          }
        } catch (e) {}

        const data = await fetchCommunityTokenDetailsByContract(lower);
        if (data) return data;
      }

      return null;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    retry: 2,
  });
}

// Hook to fetch token price history
export function useTokenPriceHistory(id: string | null, days: number = 7) {
  return useQuery<TokenMarketData | null>({
    queryKey: ["token-history", id, days],
    queryFn: async () => {
      if (!id) return null;
      
      const lower = id.toLowerCase();
      
      // Check if it's a community token (by contract address or symbol)
      const communityToken = XLAYER_COMMUNITY_TOKENS.find(
        (t) => t.contract.toLowerCase() === lower || t.symbol.toLowerCase() === lower
      );
      
      if (communityToken?.coingeckoId) {
        // Use CoinGecko since these tokens are now listed!
        const history = await fetchTokenPriceHistory(communityToken.coingeckoId, days);
        if (history) return history;
      }
      
      // Standard CoinGecko token
      return fetchTokenPriceHistory(id, days);
    },
    enabled: !!id,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}

// Fetch OKLink contract info
export function useOklinkContract(contract: string | null) {
  return useQuery({
    queryKey: ["oklink-contract", contract],
    queryFn: () => (contract ? oklink.fetchOklinkContractInfo(contract) : null),
    enabled: !!contract,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}
