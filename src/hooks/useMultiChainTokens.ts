// Multi-chain token data hooks using OKX API with DefiLlama fallback and localStorage caching
import { useQuery } from "@tanstack/react-query";
import { 
  fetchOkxTokenRanking, 
  fetchOkxTokenBasicInfo,
  fetchOkxTokenPriceInfo,
  fetchOkxTokenSearch,
  fetchOkxSupportedChains,
  OkxTokenRankingItem,
} from "@/lib/api/okx";
import { fetchDefiLlamaTokenPrices, fetchTopTokensByChain, fetchSingleTokenPrice } from "@/lib/api/defillama";
import { SUPPORTED_CHAINS, ALL_CHAINS_ID } from "@/lib/chains";

// Fallback chains if dynamic fetch fails
const FALLBACK_CHAINS = ['196', '1', '56', '42161', '8453', '10', '137'];

// Cache for successful token lookups
const tokenCache = new Map<string, { chainIndex: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// LocalStorage cache keys
const LS_CACHE_PREFIX = 'tokens-cache-';
const LS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes for localStorage

// Save to localStorage cache
function saveToLocalStorage(key: string, data: MultiChainToken[]) {
  try {
    localStorage.setItem(LS_CACHE_PREFIX + key, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch (e) {
    // Ignore quota errors
  }
}

// Load from localStorage cache
function loadFromLocalStorage(key: string): { data: MultiChainToken[]; timestamp: number } | null {
  try {
    const cached = localStorage.getItem(LS_CACHE_PREFIX + key);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < LS_CACHE_TTL) {
        return parsed;
      }
    }
  } catch (e) {
    // Ignore parse errors
  }
  return null;
}

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
  source?: 'okx' | 'defillama';
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
    source: 'okx',
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

// Shared request queue to prevent overwhelming the API
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 250; // 250ms between requests (reduced rate)

async function throttledRequest<T>(fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await delay(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
  }
  
  lastRequestTime = Date.now();
  return fn();
}

/**
 * Fetch tokens from multiple chains with rate limit handling and DefiLlama fallback
 */
async function fetchMultiChainTokens(
  chains: string[],
  sortBy: 'volume24h' | 'marketCap' | 'change24h',
  limitPerChain: number
): Promise<MultiChainToken[]> {
  const allTokens: MultiChainToken[] = [];
  
  // Fetch sequentially to avoid rate limits
  for (const chain of chains) {
    try {
      const data = await throttledRequest(() => 
        fetchOkxTokenRanking(chain, sortBy, 'desc', limitPerChain)
      );
      
      if (data && data.length > 0) {
        const normalized = data.map(normalizeOkxToken);
        allTokens.push(...normalized);
      }
    } catch (err) {
      console.warn(`Chain ${chain} fetch failed:`, err);
    }
  }
  
  return allTokens;
}

/**
 * Fetch tokens with DefiLlama fallback when OKX fails
 */
async function fetchTokensWithFallback(
  chainIndex: string,
  sortBy: 'volume24h' | 'marketCap' | 'change24h',
  limit: number
): Promise<MultiChainToken[]> {
  // Try OKX first
  try {
    const data = await fetchOkxTokenRanking(chainIndex, sortBy, 'desc', limit);
    if (data && data.length > 0) {
      return data.map(normalizeOkxToken);
    }
  } catch (err) {
    console.warn(`OKX fetch failed for chain ${chainIndex}:`, err);
  }
  
  // Fallback to DefiLlama
  try {
    const defiLlamaTokens = await fetchTopTokensByChain(chainIndex, limit);
    if (defiLlamaTokens.length > 0) {
      return defiLlamaTokens;
    }
  } catch (err) {
    console.warn(`DefiLlama fallback failed for chain ${chainIndex}:`, err);
  }
  
  return [];
}

/**
 * Hook to fetch token list for a specific chain or all chains
 * With localStorage caching and DefiLlama fallback
 */
export function useMultiChainTokens(
  chainIndex: string,
  sortBy: 'volume24h' | 'marketCap' | 'change24h' = 'volume24h',
  limit: number = 50
) {
  const isAllChains = chainIndex === ALL_CHAINS_ID;
  const { data: dynamicChains } = useOkxSupportedChains();
  const cacheKey = `${chainIndex}-${sortBy}-${limit}`;
  
  return useQuery<MultiChainToken[]>({
    queryKey: ['multi-chain-tokens', chainIndex, sortBy, limit, dynamicChains],
    queryFn: async () => {
      let tokens: MultiChainToken[] = [];
      
      if (isAllChains) {
        // Use dynamic chains or fallback
        const chainsToQuery = dynamicChains || FALLBACK_CHAINS;
        const tokensPerChain = Math.ceil(limit / chainsToQuery.length);
        
        tokens = await fetchMultiChainTokens(chainsToQuery.slice(0, 7), sortBy, tokensPerChain);
        
        // If OKX failed, try DefiLlama
        if (tokens.length === 0) {
          const defiLlamaTokens = await fetchTopTokensByChain('all', limit);
          if (defiLlamaTokens.length > 0) {
            tokens = defiLlamaTokens;
          }
        }
      } else {
        // Single chain fetch with fallback
        tokens = await fetchTokensWithFallback(chainIndex, sortBy, limit);
      }
      
      // Sort combined results
      if (tokens.length > 0) {
        if (sortBy === 'volume24h') {
          tokens.sort((a, b) => b.volume24h - a.volume24h);
        } else if (sortBy === 'marketCap') {
          tokens.sort((a, b) => b.marketCap - a.marketCap);
        } else if (sortBy === 'change24h') {
          tokens.sort((a, b) => b.priceChange24h - a.priceChange24h);
        }
        
        const result = tokens.slice(0, limit);
        
        // Save to localStorage for future fallback
        saveToLocalStorage(cacheKey, result);
        
        return result;
      }
      
      // If all API calls failed, try localStorage cache
      const cached = loadFromLocalStorage(cacheKey);
      if (cached && cached.data.length > 0) {
        console.log('Using cached token data');
        return cached.data;
      }
      
      return [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - increased for stability
    refetchInterval: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 15000),
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
      
      // Fallback to DefiLlama for price data
      const preferredChainForFallback = preferredChain || '196';
      try {
        const llamaPrice = await fetchSingleTokenPrice(preferredChainForFallback, address);
        if (llamaPrice) {
          const chain = SUPPORTED_CHAINS.find(c => c.index === preferredChainForFallback);
          return {
            chainIndex: preferredChainForFallback,
            chainName: chain?.name || `Chain ${preferredChainForFallback}`,
            basicInfo: null,
            priceInfo: {
              tokenSymbol: '???',
              tokenName: 'Unknown Token',
              price: String(llamaPrice.price),
              priceChange24h: String(llamaPrice.priceChange24h || 0),
            } as any,
            source: 'defillama' as const,
          };
        }
      } catch {
        // DefiLlama fallback also failed
      }

      return null;
    },
    enabled: !!contractAddress && contractAddress.length >= 10,
    staleTime: 30 * 1000,
    retry: 2,
  });
}
