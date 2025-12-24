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
  TOKEN_IDS,
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
      
      // Check if id matches a community token symbol or contract
      const communityMatch = XLAYER_COMMUNITY_TOKENS.find(
        (t) => t.symbol.toLowerCase() === lower || t.contract.toLowerCase() === lower
      );
      
      if (communityMatch) {
        // Try OKLink first for XLayer native tokens
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
              description: { en: oklinkData.description || `${communityMatch.name} is a community token on the XLayer network.` },
              holders: oklinkData.holders,
              isCommunityToken: true,
            };
          }
        } catch (e) {
          // Continue to other sources
        }

        // Try DefiLlama coins endpoint
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
          // Continue
        }

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
              description: { en: `${communityMatch.name} is a community token on the XLayer network.` },
              isCommunityToken: true,
            };
          }
        } catch (e) {
          // Continue to final fallback
        }

        // Final: return basic info
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
      
      // Check if it's a standard CoinGecko token ID
      const tokenIdEntry = Object.entries(TOKEN_IDS).find(
        ([symbol, cgId]) => cgId === lower || symbol.toLowerCase() === lower
      );
      
      if (tokenIdEntry) {
        const cgId = tokenIdEntry[1] as string;
        const cg = await fetchTokenDetails(cgId);
        if (cg) return cg;
      }
      
      // Try CoinGecko directly with the id
      const cg = await fetchTokenDetails(id);
      if (cg) return cg;

      // Try OKLink for on-chain contract info as a fallback
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
        } catch (e) {
          // Ignore
        }

        // Try DefiLlama for address
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
