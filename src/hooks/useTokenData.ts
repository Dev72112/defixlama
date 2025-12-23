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
  fetchCommunityPricesByContracts,
  fetchCommunityTokenDetailsByContract,
} from "@/lib/api/coingecko";
import oklink from "@/lib/api/oklink";

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

      // Try OKLink first for community token prices (most reliable for XLayer)
      for (const ct of communityTokens) {
        try {
          const oklinkPrice = await oklink.fetchOklinkLivePrice(ct.contract);
          if (oklinkPrice && oklinkPrice.price > 0) {
            ct.price = oklinkPrice.price;
            ct.change24h = oklinkPrice.change24h;
            ct.volume24h = oklinkPrice.volume24h;
          }
        } catch (e) {
          // ignore
        }
      }

      // Try DefiLlama for tokens still missing prices
      const missingAfterOklink = communityTokens.filter((ct) => ct.price === 0).map((ct) => ct.contract);
      if (missingAfterOklink.length > 0) {
        try {
          const pricesData = await fetchCommunityPricesByContracts(missingAfterOklink);
          communityTokens.forEach((ct) => {
            if (ct.price === 0) {
              const key = `xlayer:${ct.contract}`;
              const coin = pricesData[key];
              if (coin) {
                const price = coin.price ?? (coin.price_usd ?? coin?.price?.usd ?? 0);
                ct.price = typeof price === 'number' ? price : Number(price) || 0;
                ct.change24h = coin.change24h ?? 0;
                ct.volume24h = coin.volume ?? 0;
                if (coin.logo) ct.logo = coin.logo;
              }
            }
          });
        } catch (err) {
          // ignore
        }
      }

      // Try DexScreener as final fallback for tokens still missing prices
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

      // Ensure we have logos where possible by querying DefiLlama coins endpoint
      try {
        const missingLogoContracts = communityTokens.filter((ct) => !ct.logo || ct.logo.includes('ui-avatars')).map((ct) => ct.contract);
        for (const contract of missingLogoContracts) {
          try {
            const details = await fetchCommunityTokenDetailsByContract(contract);
            if (details && details.image && details.image.large) {
              const ct = communityTokens.find((c) => c.contract === contract);
              if (ct) ct.logo = details.image.large;
            }
          } catch (e) {
            // ignore per-token failures
          }
        }
      } catch (e) {
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
        // Try DefiLlama coins endpoint for richer token details (logo, price, etc.)
        try {
          const dl = await fetchCommunityTokenDetailsByContract(communityMatch.contract);
          if (dl) {
            return {
              ...dl,
              id: communityMatch.contract,
              contract: communityMatch.contract,
              isCommunityToken: true,
            };
          }
        } catch (e) {
          // ignore dl failure and continue to other fallbacks
        }

        // Try DefiLlama current prices (coins.llama) as a lightweight fallback
        try {
          const prices = await fetchCommunityPricesByContracts([communityMatch.contract]);
          const key = `xlayer:${communityMatch.contract}`;
          const coin = prices[key] || prices[communityMatch.contract.toLowerCase()];
          if (coin) {
            return {
              id: communityMatch.contract,
              name: communityMatch.name,
              symbol: communityMatch.symbol,
              image: { large: communityMatch.logo, small: communityMatch.logo },
              contract: communityMatch.contract,
              market_data: {
                current_price: { usd: coin.price ?? coin.price_usd ?? 0 },
                price_change_percentage_24h: coin.change24h ?? 0,
                total_volume: { usd: coin.volume ?? 0 },
                market_cap: { usd: 0 },
              },
              description: { en: `${communityMatch.name} is a community token on the XLayer network.` },
              isCommunityToken: true,
            };
          }
        } catch (e) {
          // ignore
        }

        // Try to get data from DexScreener as a further fallback
        try {
          const dexData = await fetchDexScreenerPrices([communityMatch.contract]);
          const tokenData = dexData[communityMatch.contract.toLowerCase()];
          if (tokenData) {
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
          }
        } catch (e) {
          // continue to final fallback
        }

        // Final: return basic info with logo placeholder and zeroed market data
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
      
      // Try CoinGecko for standard tokens
      const cg = await fetchTokenDetails(id);
      if (cg) return cg;

      // Try OKLink for on-chain contract info as a fallback after CoinGecko
      try {
        // OKLink expects a contract/address; only attempt when `id` looks like one
        const lowerId = id.toLowerCase();
        if (/^0x[a-f0-9]{40}$/.test(lowerId)) {
          const ok = await oklink.fetchOklinkContractInfo(lowerId);
          if (ok) {
            return {
              id: lowerId,
              name: ok.name || ok.contractName || id,
              symbol: ok.symbol || "",
              image: { large: ok.logo || "", small: ok.logo || "" },
              contract: lowerId,
              market_data: {
                current_price: { usd: ok.price || 0 },
                price_change_percentage_24h: ok.change24h || 0,
                total_volume: { usd: ok.volume24h || 0 },
                market_cap: { usd: ok.marketCap || 0 },
              },
              description: { en: ok.description || "" },
            };
          }
        }
      } catch (e) {
        // ignore OKLink failures
      }

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
