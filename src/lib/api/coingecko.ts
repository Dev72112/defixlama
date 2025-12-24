// Token price API with DefiLlama as primary source, CoinGecko as fallback

const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";
const DEFILLAMA_COINS_URL = "https://coins.llama.fi";

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

// XLayer community tokens (not on CoinGecko)
export const XLAYER_COMMUNITY_TOKENS = [
  { symbol: "DOG", name: "DOG", contract: "0x903358faf7c6304afbd560e9e29b12ab1b8fddc5", logo: "https://ui-avatars.com/api/?name=DOG&background=f59e0b&color=fff&size=64" },
  { symbol: "NIUMA", name: "NIUMA", contract: "0x87669801a1fad6dad9db70d27ac752f452989667", logo: "https://ui-avatars.com/api/?name=NM&background=8b5cf6&color=fff&size=64" },
  { symbol: "XDOG", name: "XDOG", contract: "0x0cc24c51bf89c00c5affbfcf5e856c25ecbdb48e", logo: "https://ui-avatars.com/api/?name=XD&background=ec4899&color=fff&size=64" },
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
    const endpoints = [
      `${DEFILLAMA_COINS_URL}/coins/xlayer:${encodeURIComponent(contract)}`,
      `${DEFILLAMA_COINS_URL}/coins/xlayer/${encodeURIComponent(contract)}`,
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const data = await res.json();
        if (!data) continue;
        
        return {
          id: data.address || contract,
          name: data.name || data.coin || data.address || contract,
          symbol: (data.symbol || data.ticker || '').toUpperCase(),
          image: { large: data.logo || data.icon || null, small: data.logo || data.icon || null },
          contract,
          market_data: {
            current_price: { usd: data.price || data.market_price || 0 },
            price_change_percentage_24h: data.change24h || 0,
            total_volume: { usd: data.volume || data.total_volume || 0 },
            market_cap: { usd: data.marketCap || data.market_cap || 0 },
            ath: { usd: data.ath || 0 },
            high_24h: { usd: data.high_24h || 0 },
            low_24h: { usd: data.low_24h || 0 },
            atl: { usd: data.atl || 0 },
            circulating_supply: data.circulating || data.circulating_supply || 0,
            total_supply: data.total || data.total_supply || 0,
            max_supply: data.max || data.max_supply || null,
          },
          description: { en: data.description || data.about || '' },
        };
      } catch (err) {
        // try next endpoint
      }
    }
    return null;
  } catch (error) {
    console.error('Error fetching community token details:', error);
    return null;
  }
}
