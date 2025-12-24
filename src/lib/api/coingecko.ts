// Token price API with DefiLlama as primary source, CoinGecko via edge function as fallback

const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";
const DEFILLAMA_COINS_URL = "https://coins.llama.fi";

// CoinGecko proxy via edge function (uses API key)
const COINGECKO_PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/coingecko-proxy`;

async function fetchFromCoinGeckoProxy(endpoint: string, params?: Record<string, string>) {
  try {
    const response = await fetch(COINGECKO_PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint, params }),
    });
    if (!response.ok) throw new Error(`CoinGecko proxy error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("CoinGecko proxy error:", error);
    return null;
  }
}

export interface TokenPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  total_volume: number;
  market_cap: number;
  image: string;
  sparkline_in_7d?: { price: number[] };
}

export interface TokenMarketData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

// Token IDs for major tokens on XLayer - bidirectional mapping
export const TOKEN_IDS: Record<string, string> = {
  OKB: "okb",
  WETH: "weth",
  WBTC: "wrapped-bitcoin",
  USDT: "tether",
  USDC: "usd-coin",
  DAI: "dai",
  LINK: "chainlink",
};

// Reverse mapping: CoinGecko ID -> Symbol
export const TOKEN_IDS_REVERSE: Record<string, string> = {
  okb: "OKB",
  weth: "WETH",
  "wrapped-bitcoin": "WBTC",
  tether: "USDT",
  "usd-coin": "USDC",
  dai: "DAI",
  chainlink: "LINK",
};

// Get CoinGecko ID from any identifier (symbol, id, or contract)
export function resolveToCoinGeckoId(identifier: string): string | null {
  const lower = identifier.toLowerCase();
  if (TOKEN_IDS_REVERSE[lower]) return lower;
  const upper = identifier.toUpperCase();
  if (TOKEN_IDS[upper]) return TOKEN_IDS[upper];
  return null;
}

// XLayer community tokens (now on CoinGecko with proper IDs!)
export const XLAYER_COMMUNITY_TOKENS = [
  { 
    symbol: "NIUMA", 
    name: "Niuma", 
    contract: "0x87669801a1fad6dad9db70d27ac752f452989667", 
    coingeckoId: "niuma",
    logo: "https://assets.coingecko.com/coins/images/69429/standard/photo_2025-09-15_18-40-45.jpg" 
  },
  { 
    symbol: "XDOG", 
    name: "XDOG", 
    contract: "0x0cc24c51bf89c00c5affbfcf5e856c25ecbdb48e", 
    coingeckoId: "xdog",
    logo: "https://assets.coingecko.com/coins/images/68279/standard/xdog_logo_.png" 
  },
  { 
    symbol: "DOG", 
    name: "DOG", 
    contract: "0x903358faf7c6304afbd560e9e29b12ab1b8fddc5", 
    coingeckoId: "dog-4",
    logo: "https://assets.coingecko.com/coins/images/69178/standard/1000071357.jpg" 
  },
  { 
    symbol: "XFROG", 
    name: "XFROG", 
    contract: "0x", 
    coingeckoId: "xfrog",
    logo: "https://assets.coingecko.com/coins/images/69230/standard/2025-09-14-135643-985-1.png" 
  },
  { 
    symbol: "OKAY", 
    name: "Okay.fun", 
    contract: "0x", 
    coingeckoId: "okay-fun",
    logo: "https://assets.coingecko.com/coins/images/68463/standard/okayfun.png" 
  },
  { 
    symbol: "WOKB", 
    name: "Wrapped OKB", 
    contract: "0x", 
    coingeckoId: "wrapped-okb",
    logo: "https://assets.coingecko.com/coins/images/37278/standard/okb.png" 
  },
  { 
    symbol: "XWAWA", 
    name: "Xwawa", 
    contract: "0x", 
    coingeckoId: "xwawa",
    logo: "https://assets.coingecko.com/coins/images/68280/standard/xwawa.png" 
  },
  { 
    symbol: "STARS", 
    name: "StarsMint", 
    contract: "0x", 
    coingeckoId: "starsmint",
    logo: "https://assets.coingecko.com/coins/images/69371/standard/2025-09-20_11.57.02.jpg" 
  },
];

export function findCommunityToken(identifier: string) {
  const lower = identifier.toLowerCase();
  return XLAYER_COMMUNITY_TOKENS.find(
    (t) => t.symbol.toLowerCase() === lower || t.contract.toLowerCase() === lower
  );
}

// ========== DefiLlama API (PRIMARY SOURCE) ==========

// Token logo mappings for reliable logos
const TOKEN_LOGOS: Record<string, string> = {
  okb: "https://assets.coingecko.com/coins/images/4463/large/okb_token.png",
  weth: "https://assets.coingecko.com/coins/images/2518/large/weth.png",
  "wrapped-bitcoin": "https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png",
  tether: "https://assets.coingecko.com/coins/images/325/large/Tether.png",
  "usd-coin": "https://assets.coingecko.com/coins/images/6319/large/usdc.png",
  dai: "https://assets.coingecko.com/coins/images/9956/large/Badge_Dai.png",
  chainlink: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png",
};

// Token names for proper display
const TOKEN_NAMES: Record<string, string> = {
  okb: "OKB",
  weth: "Wrapped Ether",
  "wrapped-bitcoin": "Wrapped Bitcoin",
  tether: "Tether",
  "usd-coin": "USD Coin",
  dai: "Dai",
  chainlink: "Chainlink",
};

// Fetch token prices from DefiLlama as PRIMARY source
export async function fetchTokenPricesFromDefiLlama(): Promise<TokenPrice[]> {
  try {
    // DefiLlama supports multiple chains - use coingecko: prefix for known tokens
    const coinGeckoTokens = Object.values(TOKEN_IDS).map(id => `coingecko:${id}`).join(',');
    
    const response = await fetch(`${DEFILLAMA_COINS_URL}/prices/current/${coinGeckoTokens}`);
    if (!response.ok) throw new Error("DefiLlama API failed");
    
    const data = await response.json();
    const coins = data.coins || {};
    
    const tokens: TokenPrice[] = [];
    
    for (const [key, value] of Object.entries(coins) as any) {
      const cgId = key.replace('coingecko:', '');
      const symbol = TOKEN_IDS_REVERSE[cgId] || cgId.toUpperCase();
      
      tokens.push({
        id: cgId,
        symbol: symbol,
        name: TOKEN_NAMES[cgId] || value.symbol || cgId,
        current_price: value.price || 0,
        price_change_percentage_24h: 0, // DefiLlama doesn't provide this in basic endpoint
        total_volume: 0,
        market_cap: 0,
        image: TOKEN_LOGOS[cgId] || `https://assets.coingecko.com/coins/images/1/large/${cgId}.png`,
        sparkline_in_7d: undefined,
      });
    }
    
    return tokens;
  } catch (error) {
    console.error("DefiLlama API error:", error);
    return [];
  }
}

// ========== DexScreener API ==========

export async function fetchDexScreenerPrices(contracts: string[]) {
  try {
    if (!contracts || contracts.length === 0) return {};
    const results: Record<string, any> = {};
    
    for (const contract of contracts) {
      try {
        const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${contract}`);
        if (!res.ok) continue;
        const data = await res.json();
        if (data.pairs && data.pairs.length > 0) {
          const pair = data.pairs[0];
          results[contract.toLowerCase()] = {
            price: parseFloat(pair.priceUsd) || 0,
            change24h: pair.priceChange?.h24 || 0,
            volume24h: pair.volume?.h24 || 0,
            liquidity: pair.liquidity?.usd || 0,
            symbol: pair.baseToken?.symbol || '',
            name: pair.baseToken?.name || '',
          };
        }
      } catch (e) {
        // ignore individual failures
      }
    }
    return results;
  } catch (error) {
    console.error('Error fetching DexScreener prices:', error);
    return {};
  }
}

// ========== CoinGecko API (FALLBACK) ==========

export async function fetchTokenPrices(): Promise<TokenPrice[]> {
  try {
    const ids = Object.values(TOKEN_IDS).join(",");
    const response = await fetch(
      `${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=true&price_change_percentage=24h`
    );
    if (!response.ok) throw new Error("Failed to fetch token prices");
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("CoinGecko API error:", error);
    return [];
  }
}

export async function fetchTokenDetails(id: string): Promise<any> {
  try {
    // Try edge function first (has API key)
    const proxyData = await fetchFromCoinGeckoProxy(`/coins/${encodeURIComponent(id)}`, {
      localization: "false",
      tickers: "false",
      community_data: "false",
      developer_data: "false",
    });
    if (proxyData && !proxyData.error) return proxyData;
    
    // Fallback to direct API
    const response = await fetch(
      `${COINGECKO_BASE_URL}/coins/${encodeURIComponent(id)}?localization=false&tickers=false&community_data=false&developer_data=false`
    );
    if (!response.ok) throw new Error("Failed to fetch token details");
    return await response.json();
  } catch (error) {
    console.error("Error fetching token details:", error);
    return null;
  }
}

export async function fetchTokenPriceHistory(id: string, days: number = 7): Promise<TokenMarketData | null> {
  try {
    // Try edge function first (has API key)
    const proxyData = await fetchFromCoinGeckoProxy(`/coins/${encodeURIComponent(id)}/market_chart`, {
      vs_currency: "usd",
      days: String(days),
    });
    if (proxyData && proxyData.prices) return proxyData;
    
    // Fallback to direct API
    const response = await fetch(
      `${COINGECKO_BASE_URL}/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=${encodeURIComponent(String(days))}`
    );
    if (!response.ok) throw new Error("Failed to fetch price history");
    return await response.json();
  } catch (error) {
    console.error("Error fetching token price history:", error);
    return null;
  }
}

// Map CoinGecko data to our token format
export function mapTokenData(token: TokenPrice) {
  return {
    id: token.id,
    symbol: token.symbol.toUpperCase(),
    name: token.name,
    price: token.current_price || 0,
    change24h: token.price_change_percentage_24h || 0,
    volume24h: token.total_volume || 0,
    mcap: token.market_cap || 0,
    logo: token.image,
    sparkline: token.sparkline_in_7d?.price || [],
    contract: null as string | null,
    isCommunityToken: false,
  };
}

// Fetch community token prices from DefiLlama coins API
export async function fetchCommunityPricesByContracts(contracts: string[]) {
  try {
    if (!contracts || contracts.length === 0) return {};
    const tokens = contracts.map((c) => encodeURIComponent(`xlayer:${c}`)).join(',');
    const response = await fetch(`${DEFILLAMA_COINS_URL}/prices/current/${tokens}`);
    if (!response.ok) throw new Error('Failed to fetch community token prices');
    const data = await response.json();
    return data.coins || {};
  } catch (error) {
    console.error('Error fetching community prices:', error);
    return {};
  }
}

export async function fetchCommunityTokenDetailsByContract(contract: string) {
  try {
    if (!contract) return null;
    
    // Use the correct DefiLlama prices endpoint
    const tokenKey = `xlayer:${contract}`;
    const response = await fetch(`${DEFILLAMA_COINS_URL}/prices/current/${encodeURIComponent(tokenKey)}`);
    
    if (!response.ok) return null;
    const data = await response.json();
    
    if (!data.coins || !data.coins[tokenKey]) return null;
    
    const coin = data.coins[tokenKey];
    const communityToken = findCommunityToken(contract);
    
    return {
      id: contract,
      name: communityToken?.name || coin.symbol || contract,
      symbol: (coin.symbol || communityToken?.symbol || '').toUpperCase(),
      image: { 
        large: communityToken?.logo || null, 
        small: communityToken?.logo || null 
      },
      contract,
      market_data: {
        current_price: { usd: coin.price || 0 },
        price_change_percentage_24h: coin.change24h || 0,
        price_change_percentage_7d: 0,
        total_volume: { usd: coin.volume || 0 },
        market_cap: { usd: coin.mcap || 0 },
        circulating_supply: 0,
        total_supply: 0,
        max_supply: null,
      },
      description: { en: `${communityToken?.name || coin.symbol} is a community token on XLayer.` },
    };
  } catch (error) {
    console.error('Error fetching community token details:', error);
    return null;
  }
}

// Fetch community token price history from DefiLlama chart endpoint
export async function fetchCommunityTokenPriceHistory(contract: string, days: number = 7): Promise<TokenMarketData | null> {
  try {
    if (!contract) return null;
    
    const tokenKey = `xlayer:${contract}`;
    const response = await fetch(`${DEFILLAMA_COINS_URL}/chart/${encodeURIComponent(tokenKey)}?span=${days}`);
    
    if (!response.ok) return null;
    const data = await response.json();
    
    if (!data.coins || !data.coins[tokenKey] || !data.coins[tokenKey].prices) return null;
    
    const prices: [number, number][] = data.coins[tokenKey].prices.map((p: any) => [
      p.timestamp * 1000, // Convert to milliseconds
      p.price,
    ]);
    
    return {
      prices,
      market_caps: [],
      total_volumes: [],
    };
  } catch (error) {
    console.error('Error fetching community token price history:', error);
    return null;
  }
}
