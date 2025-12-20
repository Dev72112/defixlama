// CoinGecko API for live token prices

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

// Token IDs for major tokens on XLayer
export const TOKEN_IDS: Record<string, string> = {
  OKB: "okb",
  WETH: "weth",
  WBTC: "wrapped-bitcoin",
  USDT: "tether",
  USDC: "usd-coin",
  DAI: "dai",
  LINK: "chainlink",
};

// XLayer community tokens (not on CoinGecko, we'll try to fetch from DEX)
export const XLAYER_COMMUNITY_TOKENS = [
  { symbol: "DOG", name: "DOG", contract: "0x903358faf7c6304afbd560e9e29b12ab1b8fddc5" },
  { symbol: "NIUMA", name: "NIUMA", contract: "0x87669801a1fad6dad9db70d27ac752f452989667" },
  { symbol: "XDOG", name: "XDOG", contract: "0x0cc24c51bf89c00c5affbfcf5e856c25ecbdb48e" },
];

// Fetch token prices from CoinGecko
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
    console.error("Error fetching token prices:", error);
    return [];
  }
}

// Fetch single token details
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

// Fetch token price history for charts
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
    symbol: token.symbol.toUpperCase(),
    name: token.name,
    price: token.current_price || 0,
    change24h: token.price_change_percentage_24h || 0,
    volume24h: token.total_volume || 0,
    mcap: token.market_cap || 0,
    logo: token.image,
    sparkline: token.sparkline_in_7d?.price || [],
    contract: null,
  };
}

// Fetch community token prices/details from DefiLlama coins API (fallback when not on CoinGecko)
export async function fetchCommunityPricesByContracts(contracts: string[]) {
  try {
    if (!contracts || contracts.length === 0) return {};
    const tokens = contracts.map((c) => encodeURIComponent(`xlayer:${c}`)).join(',');
    const response = await fetch(`${DEFILLAMA_COINS_URL}/prices/current/${tokens}`);
    if (!response.ok) throw new Error('Failed to fetch community token prices');
    const data = await response.json();
    // data.coins is expected to be a map like { 'xlayer:0x...': { price: number, symbol: string, timestamp } }
    return data.coins || {};
  } catch (error) {
    console.error('Error fetching community prices:', error);
    return {};
  }
}

export async function fetchCommunityTokenDetailsByContract(contract: string) {
  try {
    if (!contract) return null;
    // Try the coins endpoint for a single token
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
        // Normalize to a shape similar enough to CoinGecko for the UI to consume
        const normalized: any = {
          id: data.address || contract,
          name: data.name || data.coin || data.address || contract,
          symbol: (data.symbol || data.ticker || '').toUpperCase(),
          image: { large: data.logo || data.icon || null, small: data.logo || data.icon || null },
          contract,
          market_data: {
            current_price: { usd: data.price || data.market_price || (data.price && data.price.usd) || 0 },
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

        return normalized;
      } catch (err) {
        // ignore and try next
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching community token details:', error);
    return null;
  }
}
