// Multi-chain token data hooks using OKX API
import { useQuery } from "@tanstack/react-query";
import { 
  fetchOkxTokenRanking, 
  fetchOkxTokenBasicInfo,
  fetchOkxTokenPriceInfo,
  OkxTokenRankingItem,
  OkxTokenBasicInfo,
} from "@/lib/api/okx";
import { SUPPORTED_CHAINS, ALL_CHAINS_ID } from "@/lib/chains";

// Top chains for "All Chains" aggregate view
const AGGREGATE_CHAINS = ['196', '1', '56', '42161', '8453', '10', '137'];

export interface MultiChainToken {
  id: string;
  chainIndex: string;
  chainName: string;
  contractAddress: string;
  symbol: string;
  name: string;
  logo?: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  marketCap: number;
  holders: number;
}

// Convert OKX token to our unified format
function normalizeOkxToken(token: OkxTokenRankingItem): MultiChainToken {
  const chain = SUPPORTED_CHAINS.find(c => c.index === token.chainIndex);
  return {
    id: `${token.chainIndex}-${token.tokenContractAddress}`,
    chainIndex: token.chainIndex,
    chainName: chain?.name || `Chain ${token.chainIndex}`,
    contractAddress: token.tokenContractAddress,
    symbol: token.tokenSymbol,
    name: token.tokenName || token.tokenSymbol,
    logo: token.tokenLogo,
    price: parseFloat(token.price) || 0,
    priceChange24h: parseFloat(token.priceChange24h || '0') || 0,
    volume24h: parseFloat(token.volume24h || '0') || 0,
    liquidity: parseFloat(token.liquidity || '0') || 0,
    marketCap: parseFloat(token.marketCap || '0') || 0,
    holders: parseInt(token.holders || '0') || 0,
  };
}

/**
 * Hook to fetch token list for a specific chain or all chains
 */
export function useMultiChainTokens(
  chainIndex: string,
  sortBy: 'volume24h' | 'marketCap' | 'change24h' = 'volume24h',
  limit: number = 50
) {
  const isAllChains = chainIndex === ALL_CHAINS_ID;
  
  return useQuery<MultiChainToken[]>({
    queryKey: ['multi-chain-tokens', chainIndex, sortBy, limit],
    queryFn: async () => {
      if (isAllChains) {
        // Fetch from multiple chains in parallel
        const promises = AGGREGATE_CHAINS.map(chain => 
          fetchOkxTokenRanking(chain, sortBy, 'desc', Math.ceil(limit / AGGREGATE_CHAINS.length))
        );
        
        const results = await Promise.allSettled(promises);
        const allTokens: MultiChainToken[] = [];
        
        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            const normalized = result.value.map(normalizeOkxToken);
            allTokens.push(...normalized);
          }
        });
        
        // Sort combined results
        if (sortBy === 'volume24h') {
          allTokens.sort((a, b) => b.volume24h - a.volume24h);
        } else if (sortBy === 'marketCap') {
          allTokens.sort((a, b) => b.marketCap - a.marketCap);
        } else if (sortBy === 'change24h') {
          allTokens.sort((a, b) => b.priceChange24h - a.priceChange24h);
        }
        
        return allTokens.slice(0, limit);
      } else {
        // Single chain fetch
        const data = await fetchOkxTokenRanking(chainIndex, sortBy, 'desc', limit);
        return data.map(normalizeOkxToken);
      }
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000,
  });
}

/**
 * Hook to search tokens by name or address across chains
 * Uses token basic info endpoint which works with contract addresses
 */
export function useTokenSearch(
  query: string,
  chainIndex?: string,
  enabled: boolean = true
) {
  const isAddressSearch = /^0x[a-fA-F0-9]+$/i.test(query);
  const chainsToSearch = chainIndex && chainIndex !== ALL_CHAINS_ID 
    ? [chainIndex] 
    : AGGREGATE_CHAINS;
  
  return useQuery<MultiChainToken[]>({
    queryKey: ['token-search', query, chainIndex],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      
      // If it looks like an address, search by contract address directly
      if (isAddressSearch) {
        // Try to get token info from multiple chains in parallel
        const promises = chainsToSearch.map(async (chain) => {
          const basicInfo = await fetchOkxTokenBasicInfo(chain, query);
          const priceInfo = await fetchOkxTokenPriceInfo(chain, query);
          
          if (basicInfo) {
            const chainConfig = SUPPORTED_CHAINS.find(c => c.index === chain);
            return {
              id: `${chain}-${query}`,
              chainIndex: chain,
              chainName: chainConfig?.name || `Chain ${chain}`,
              contractAddress: basicInfo.tokenContractAddress || query,
              symbol: basicInfo.tokenSymbol,
              name: basicInfo.tokenName || basicInfo.tokenSymbol,
              logo: basicInfo.tokenLogo,
              price: priceInfo ? parseFloat(priceInfo.price) || 0 : 0,
              priceChange24h: priceInfo ? parseFloat(priceInfo.priceChange24h || '0') || 0 : 0,
              volume24h: priceInfo ? parseFloat(priceInfo.volume24h || '0') || 0 : 0,
              liquidity: priceInfo ? parseFloat(priceInfo.liquidity || '0') || 0 : 0,
              marketCap: priceInfo ? parseFloat(priceInfo.marketCap || '0') || 0 : 0,
              holders: priceInfo ? parseInt(priceInfo.holders || '0') || 0 : 0,
            } as MultiChainToken;
          }
          return null;
        });
        
        const results = await Promise.allSettled(promises);
        const tokens: MultiChainToken[] = [];
        
        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            tokens.push(result.value);
          }
        });
        
        return tokens;
      }
      
      // For name/symbol search, use ranking data and filter
      const lowerQuery = query.toLowerCase();
      const promises = chainsToSearch.map(chain => 
        fetchOkxTokenRanking(chain, 'volume24h', 'desc', 50)
      );
      
      const results = await Promise.allSettled(promises);
      const matchingTokens: MultiChainToken[] = [];
      
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          const matches = result.value
            .filter(token => 
              token.tokenSymbol.toLowerCase().includes(lowerQuery) ||
              (token.tokenName && token.tokenName.toLowerCase().includes(lowerQuery))
            )
            .map(normalizeOkxToken);
          matchingTokens.push(...matches);
        }
      });
      
      // Sort by relevance (exact matches first, then by volume)
      matchingTokens.sort((a, b) => {
        const aExact = a.symbol.toLowerCase() === lowerQuery || a.name.toLowerCase() === lowerQuery;
        const bExact = b.symbol.toLowerCase() === lowerQuery || b.name.toLowerCase() === lowerQuery;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return b.volume24h - a.volume24h;
      });
      
      return matchingTokens.slice(0, 20);
    },
    enabled: enabled && query.length >= 2,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to get aggregated stats across all chains
 */
export function useAllChainsStats() {
  return useQuery({
    queryKey: ['all-chains-stats'],
    queryFn: async () => {
      const promises = AGGREGATE_CHAINS.map(chain => 
        fetchOkxTokenRanking(chain, 'volume24h', 'desc', 10)
      );
      
      const results = await Promise.allSettled(promises);
      
      let totalVolume = 0;
      let totalMarketCap = 0;
      let tokenCount = 0;
      let topGainer: MultiChainToken | null = null;
      let topLoser: MultiChainToken | null = null;
      
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          result.value.forEach(token => {
            totalVolume += parseFloat(token.volume24h || '0') || 0;
            totalMarketCap += parseFloat(token.marketCap || '0') || 0;
            tokenCount++;
            
            const normalized = normalizeOkxToken(token);
            
            if (!topGainer || normalized.priceChange24h > topGainer.priceChange24h) {
              topGainer = normalized;
            }
            if (!topLoser || normalized.priceChange24h < topLoser.priceChange24h) {
              topLoser = normalized;
            }
          });
        }
      });
      
      return {
        totalVolume,
        totalMarketCap,
        tokenCount,
        chainCount: AGGREGATE_CHAINS.length,
        topGainer,
        topLoser,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 2 * 60 * 1000,
  });
}

/**
 * Hook to get token details by contract address (searches across chains)
 */
export function useTokenByAddress(contractAddress: string | null | undefined) {
  return useQuery({
    queryKey: ['token-by-address', contractAddress],
    queryFn: async () => {
      if (!contractAddress) return null;
      
      // Try all supported chains to find this token
      const promises = AGGREGATE_CHAINS.map(async (chainIndex) => {
        try {
          const [basicInfo, priceInfo] = await Promise.all([
            fetchOkxTokenBasicInfo(chainIndex, contractAddress),
            fetchOkxTokenPriceInfo(chainIndex, contractAddress),
          ]);
          
          if (basicInfo || priceInfo) {
            const chain = SUPPORTED_CHAINS.find(c => c.index === chainIndex);
            return {
              chainIndex,
              chainName: chain?.name || `Chain ${chainIndex}`,
              basicInfo,
              priceInfo,
            };
          }
        } catch {
          // Ignore errors for individual chains
        }
        return null;
      });
      
      const results = await Promise.allSettled(promises);
      
      // Return the first chain that has this token
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          return result.value;
        }
      }
      
      return null;
    },
    enabled: !!contractAddress && contractAddress.startsWith('0x'),
    staleTime: 30 * 1000,
    retry: 1,
  });
}
