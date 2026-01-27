// Multi-chain token data hooks using OKX API
import { useQuery } from "@tanstack/react-query";
import { 
  fetchOkxTokenRanking, 
  fetchOkxTokenSearch,
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
        
        results.forEach((result, index) => {
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
 * Hook to search tokens by name or address
 */
export function useTokenSearch(
  query: string,
  chainIndex?: string,
  enabled: boolean = true
) {
  const isAddressSearch = /^0x[a-fA-F0-9]{40}$/.test(query);
  
  return useQuery<MultiChainToken[]>({
    queryKey: ['token-search', query, chainIndex],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      
      // Search via OKX API
      const searchResults = await fetchOkxTokenSearch(
        query,
        chainIndex === ALL_CHAINS_ID ? undefined : chainIndex
      );
      
      // Convert to our format
      return searchResults.map((token: OkxTokenBasicInfo): MultiChainToken => {
        const chain = SUPPORTED_CHAINS.find(c => c.index === token.chainIndex);
        return {
          id: `${token.chainIndex}-${token.tokenContractAddress}`,
          chainIndex: token.chainIndex,
          chainName: chain?.name || `Chain ${token.chainIndex}`,
          contractAddress: token.tokenContractAddress,
          symbol: token.tokenSymbol,
          name: token.tokenName || token.tokenSymbol,
          logo: token.tokenLogo,
          price: 0, // Search endpoint doesn't return price
          priceChange24h: 0,
          volume24h: 0,
          liquidity: 0,
          marketCap: 0,
          holders: 0,
        };
      });
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
