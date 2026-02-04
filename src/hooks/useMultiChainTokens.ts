// Multi-chain token data hooks using OKX API with improved resilience
import { useQuery } from "@tanstack/react-query";
import { 
  fetchOkxTokenRanking, 
  fetchOkxTokenBasicInfo,
  fetchOkxTokenPriceInfo,
  fetchOkxTokenSearch,
  fetchOkxSupportedChains,
  OkxTokenRankingItem,
  OkxTokenBasicInfo,
} from "@/lib/api/okx";
import { SUPPORTED_CHAINS, ALL_CHAINS_ID } from "@/lib/chains";

// Fallback chains if dynamic fetch fails
const FALLBACK_CHAINS = ['196', '1', '56', '42161', '8453', '10', '137'];

// Cache for successful token lookups
const tokenCache = new Map<string, { chainIndex: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
 * Hook to get OKX supported chains dynamically
 */
export function useOkxSupportedChains() {
  return useQuery({
    queryKey: ['okx-supported-chains'],
    queryFn: async () => {
      const chains = await fetchOkxSupportedChains();
      if (chains.length > 0) {
        return chains.map(c => c.chainIndex);
      }
      return FALLBACK_CHAINS;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Helper to delay between API calls
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch tokens from multiple chains with rate limit handling
 */
async function fetchMultiChainTokens(
  chains: string[],
  sortBy: 'volume24h' | 'marketCap' | 'change24h',
  limitPerChain: number
): Promise<MultiChainToken[]> {
  const allTokens: MultiChainToken[] = [];
  
  // Fetch in smaller batches to avoid rate limits
  const batchSize = 3;
  for (let i = 0; i < chains.length; i += batchSize) {
    const batch = chains.slice(i, i + batchSize);
    
    const promises = batch.map(chain => 
      fetchOkxTokenRanking(chain, sortBy, 'desc', limitPerChain)
        .catch(err => {
          console.warn(`Chain ${chain} fetch failed:`, err);
          return [];
        })
    );
    
    const results = await Promise.all(promises);
    
    results.forEach((data) => {
      if (data && data.length > 0) {
        const normalized = data.map(normalizeOkxToken);
        allTokens.push(...normalized);
      }
    });
    
    // Small delay between batches to avoid rate limits
    if (i + batchSize < chains.length) {
      await delay(100);
    }
  }
  
  return allTokens;
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
  const { data: dynamicChains } = useOkxSupportedChains();
  
  return useQuery<MultiChainToken[]>({
    queryKey: ['multi-chain-tokens', chainIndex, sortBy, limit, dynamicChains],
    queryFn: async () => {
      if (isAllChains) {
        // Use dynamic chains or fallback
        const chainsToQuery = dynamicChains || FALLBACK_CHAINS;
        const tokensPerChain = Math.ceil(limit / chainsToQuery.length);
        
        const allTokens = await fetchMultiChainTokens(chainsToQuery, sortBy, tokensPerChain);
        
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
    staleTime: 2 * 60 * 1000, // 2 minutes - increased for stability
    refetchInterval: 2 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

/**
 * Hook to search tokens by name, symbol, or address across chains
 * Uses OKX search endpoint as primary, with fallback to ranking data
 */
export function useTokenSearch(
  query: string,
  chainIndex?: string,
  enabled: boolean = true
) {
  // Detect if query is an address (supports various formats)
  const isAddressSearch = /^(0x)?[a-fA-F0-9]{40,}$/i.test(query.trim());
  const normalizedQuery = query.trim();
  
  const { data: dynamicChains } = useOkxSupportedChains();
  const chainsToSearch = chainIndex && chainIndex !== ALL_CHAINS_ID 
    ? [chainIndex] 
    : (dynamicChains || FALLBACK_CHAINS);
  
  return useQuery<MultiChainToken[]>({
    queryKey: ['token-search', normalizedQuery, chainIndex, chainsToSearch],
    queryFn: async () => {
      if (!normalizedQuery || normalizedQuery.length < 2) return [];
      
      // If it looks like an address, search by contract address
      if (isAddressSearch) {
        const address = normalizedQuery.startsWith('0x') ? normalizedQuery : `0x${normalizedQuery}`;
        
        // Check cache first
        const cached = tokenCache.get(address.toLowerCase());
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          // Prioritize cached chain
          const chainsOrdered = [cached.chainIndex, ...chainsToSearch.filter(c => c !== cached.chainIndex)];
          return searchAddressOnChains(address, chainsOrdered.slice(0, 5));
        }
        
        return searchAddressOnChains(address, chainsToSearch);
      }
      
      // Try OKX search endpoint first for name/symbol search
      try {
        const searchResults = await fetchOkxTokenSearch(normalizedQuery, chainIndex);
        if (searchResults.length > 0) {
          // Convert search results to our format
          const tokens: MultiChainToken[] = await Promise.all(
            searchResults.slice(0, 10).map(async (result) => {
              const chain = SUPPORTED_CHAINS.find(c => c.index === result.chainIndex);
              const priceInfo = await fetchOkxTokenPriceInfo(result.chainIndex, result.tokenContractAddress)
                .catch(() => null);
              
              return {
                id: `${result.chainIndex}-${result.tokenContractAddress}`,
                chainIndex: result.chainIndex,
                chainName: chain?.name || `Chain ${result.chainIndex}`,
                contractAddress: result.tokenContractAddress,
                symbol: result.tokenSymbol,
                name: result.tokenName || result.tokenSymbol,
                logo: result.tokenLogo,
                price: priceInfo ? parseFloat(priceInfo.price) || 0 : 0,
                priceChange24h: priceInfo ? parseFloat(priceInfo.priceChange24h || '0') : 0,
                volume24h: priceInfo ? parseFloat(priceInfo.volume24h || '0') : 0,
                liquidity: priceInfo ? parseFloat(priceInfo.liquidity || '0') : 0,
                marketCap: priceInfo ? parseFloat(priceInfo.marketCap || '0') : 0,
                holders: priceInfo ? parseInt(priceInfo.holders || '0') : 0,
              };
            })
          );
          
          return tokens.filter(t => t.symbol); // Filter out any failed lookups
        }
      } catch (err) {
        console.warn('OKX search endpoint failed, falling back to ranking filter:', err);
      }
      
      // Fallback: filter from ranking data
      const lowerQuery = normalizedQuery.toLowerCase();
      const allTokens = await fetchMultiChainTokens(chainsToSearch.slice(0, 5), 'volume24h', 50);
      
      const matchingTokens = allTokens.filter(token => 
        token.symbol.toLowerCase().includes(lowerQuery) ||
        token.name.toLowerCase().includes(lowerQuery)
      );
      
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
    enabled: enabled && normalizedQuery.length >= 2,
    staleTime: 30 * 1000,
    retry: 1,
  });
}

/**
 * Search for a token address across multiple chains
 */
async function searchAddressOnChains(address: string, chains: string[]): Promise<MultiChainToken[]> {
  const tokens: MultiChainToken[] = [];
  
  // Try chains in parallel with small batches
  const batchSize = 4;
  for (let i = 0; i < chains.length; i += batchSize) {
    const batch = chains.slice(i, i + batchSize);
    
    const results = await Promise.all(
      batch.map(async (chain) => {
        try {
          const [basicInfo, priceInfo] = await Promise.all([
            fetchOkxTokenBasicInfo(chain, address),
            fetchOkxTokenPriceInfo(chain, address),
          ]);
          
          if (basicInfo || priceInfo) {
            const chainConfig = SUPPORTED_CHAINS.find(c => c.index === chain);
            
            // Cache successful lookup
            tokenCache.set(address.toLowerCase(), { chainIndex: chain, timestamp: Date.now() });
            
            return {
              id: `${chain}-${address}`,
              chainIndex: chain,
              chainName: chainConfig?.name || `Chain ${chain}`,
              contractAddress: basicInfo?.tokenContractAddress || address,
              symbol: basicInfo?.tokenSymbol || priceInfo?.tokenSymbol || '???',
              name: basicInfo?.tokenName || priceInfo?.tokenName || 'Unknown Token',
              logo: basicInfo?.tokenLogo || priceInfo?.tokenLogo,
              price: priceInfo ? parseFloat(priceInfo.price) || 0 : 0,
              priceChange24h: priceInfo ? parseFloat(priceInfo.priceChange24h || '0') : 0,
              volume24h: priceInfo ? parseFloat(priceInfo.volume24h || '0') : 0,
              liquidity: priceInfo ? parseFloat(priceInfo.liquidity || '0') : 0,
              marketCap: priceInfo ? parseFloat(priceInfo.marketCap || '0') : 0,
              holders: priceInfo ? parseInt(priceInfo.holders || '0') : 0,
            } as MultiChainToken;
          }
        } catch {
          // Ignore errors for individual chains
        }
        return null;
      })
    );
    
    results.forEach(r => {
      if (r) tokens.push(r);
    });
    
    // If we found tokens, we can stop early
    if (tokens.length > 0) break;
  }
  
  return tokens;
}

/**
 * Hook to get aggregated stats across all chains
 */
export function useAllChainsStats() {
  const { data: dynamicChains } = useOkxSupportedChains();
  
  return useQuery({
    queryKey: ['all-chains-stats', dynamicChains],
    queryFn: async () => {
      const chains = dynamicChains || FALLBACK_CHAINS;
      const allTokens = await fetchMultiChainTokens(chains, 'volume24h', 10);
      
      let totalVolume = 0;
      let totalMarketCap = 0;
      let topGainer: MultiChainToken | null = null;
      let topLoser: MultiChainToken | null = null;
      
      allTokens.forEach(token => {
        totalVolume += token.volume24h;
        totalMarketCap += token.marketCap;
        
        if (!topGainer || token.priceChange24h > topGainer.priceChange24h) {
          topGainer = token;
        }
        if (!topLoser || token.priceChange24h < topLoser.priceChange24h) {
          topLoser = token;
        }
      });
      
      return {
        totalVolume,
        totalMarketCap,
        tokenCount: allTokens.length,
        chainCount: chains.length,
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
 * With improved fallback and caching
 */
export function useTokenByAddress(
  contractAddress: string | null | undefined,
  preferredChain?: string
) {
  const { data: dynamicChains } = useOkxSupportedChains();
  
  return useQuery({
    queryKey: ['token-by-address', contractAddress, preferredChain, dynamicChains],
    queryFn: async () => {
      if (!contractAddress) return null;
      
      // Normalize address
      const address = contractAddress.startsWith('0x') ? contractAddress : `0x${contractAddress}`;
      
      // Build chain priority list
      const chains: string[] = [];
      
      // 1. Preferred chain from URL param
      if (preferredChain) chains.push(preferredChain);
      
      // 2. Check cache
      const cached = tokenCache.get(address.toLowerCase());
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        if (!chains.includes(cached.chainIndex)) {
          chains.push(cached.chainIndex);
        }
      }
      
      // 3. X Layer as featured chain
      if (!chains.includes('196')) chains.push('196');
      
      // 4. Dynamic chains
      const otherChains = (dynamicChains || FALLBACK_CHAINS).filter(c => !chains.includes(c));
      chains.push(...otherChains);
      
      // Try to find the token
      for (const chainIndex of chains.slice(0, 10)) {
        try {
          const [basicInfo, priceInfo] = await Promise.all([
            fetchOkxTokenBasicInfo(chainIndex, address),
            fetchOkxTokenPriceInfo(chainIndex, address),
          ]);
          
          if (basicInfo || priceInfo) {
            const chain = SUPPORTED_CHAINS.find(c => c.index === chainIndex);
            
            // Cache successful lookup
            tokenCache.set(address.toLowerCase(), { chainIndex, timestamp: Date.now() });
            
            return {
              chainIndex,
              chainName: chain?.name || `Chain ${chainIndex}`,
              basicInfo,
              priceInfo,
            };
          }
        } catch {
          // Continue to next chain
        }
      }
      
      return null;
    },
    enabled: !!contractAddress && contractAddress.length >= 10,
    staleTime: 30 * 1000,
    retry: 2,
  });
}
