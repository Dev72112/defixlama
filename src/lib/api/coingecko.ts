// CoinGecko API for live token prices

const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";

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
      `${COINGECKO_BASE_URL}/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false`
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
      `${COINGECKO_BASE_URL}/coins/${id}/market_chart?vs_currency=usd&days=${days}`
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
