// DefiLlama API service for XLayer chain data

const DEFILLAMA_BASE_URL = "https://api.llama.fi";
const DEFILLAMA_COINS_URL = "https://coins.llama.fi";
const DEFILLAMA_STABLECOINS_URL = "https://stablecoins.llama.fi";
const DEFILLAMA_YIELDS_URL = "https://yields.llama.fi";

// XLayer chain identifier in DefiLlama
export const XLAYER_CHAIN = "xlayer";
export const XLAYER_CHAIN_ID = 196;

export interface Protocol {
  id: string;
  name: string;
  address?: string;
  symbol?: string;
  url?: string;
  description?: string;
  chain?: string;
  logo?: string;
  audits?: string;
  audit_note?: string;
  gecko_id?: string;
  cmcId?: string;
  category?: string;
  chains?: string[];
  module?: string;
  twitter?: string;
  forkedFrom?: string[];
  oracles?: string[];
  listedAt?: number;
  methodology?: string;
  slug?: string;
  tvl?: number;
  chainTvls?: Record<string, number>;
  change_1h?: number;
  change_1d?: number;
  change_7d?: number;
  mcap?: number;
  staking?: number;
  pool2?: number;
}

export interface ChainTVL {
  date: number;
  tvl: number;
}

export interface ChainData {
  gecko_id?: string;
  tvl: number;
  tokenSymbol?: string;
  cmcId?: string;
  name: string;
  chainId?: number;
}

export interface Token {
  id: string;
  symbol: string;
  name: string;
  price?: number;
  change24h?: number;
  volume24h?: number;
  mcap?: number;
  logo?: string;
}

export interface DexVolume {
  name: string;
  displayName?: string;
  total24h?: number;
  total7d?: number;
  total30d?: number;
  totalAllTime?: number;
  change_1d?: number;
  change_7d?: number;
  change_1m?: number;
  logo?: string;
  chains?: string[];
}

export interface YieldPool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apyBase?: number;
  apyReward?: number;
  apy?: number;
  pool: string;
  rewardTokens?: string[];
  underlyingTokens?: string[];
  poolMeta?: string;
}

export interface Stablecoin {
  id: string;
  name: string;
  symbol: string;
  gecko_id?: string;
  pegType: string;
  pegMechanism?: string;
  circulating?: Record<string, number>;
  price?: number;
  priceSource?: string;
  chains?: string[];
}

// Fetch all protocols
export async function fetchProtocols(): Promise<Protocol[]> {
  try {
    const response = await fetch(`${DEFILLAMA_BASE_URL}/protocols`);
    if (!response.ok) throw new Error("Failed to fetch protocols");
    const data: Protocol[] = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching protocols:", error);
    return [];
  }
}

// Fetch protocols for XLayer
export async function fetchXLayerProtocols(): Promise<Protocol[]> {
  try {
    const protocols = await fetchProtocols();
    return protocols.filter(
      (p) =>
        p.chains?.some(
          (c) => c.toLowerCase() === "xlayer" || c.toLowerCase() === "x layer"
        ) ||
        p.chain?.toLowerCase() === "xlayer" ||
        p.chain?.toLowerCase() === "x layer"
    );
  } catch (error) {
    console.error("Error fetching XLayer protocols:", error);
    return [];
  }
}

// Fetch TVL history for a chain
export async function fetchChainTVLHistory(chain: string): Promise<ChainTVL[]> {
  try {
    const response = await fetch(`${DEFILLAMA_BASE_URL}/v2/historicalChainTvl/${chain}`);
    if (!response.ok) throw new Error("Failed to fetch chain TVL history");
    const data: ChainTVL[] = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching chain TVL history:", error);
    return [];
  }
}

// Fetch current TVL for all chains
export async function fetchChainsTVL(): Promise<ChainData[]> {
  try {
    const response = await fetch(`${DEFILLAMA_BASE_URL}/v2/chains`);
    if (!response.ok) throw new Error("Failed to fetch chains TVL");
    const data: ChainData[] = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching chains TVL:", error);
    return [];
  }
}

// Fetch XLayer TVL
export async function fetchXLayerTVL(): Promise<ChainData | null> {
  try {
    const chains = await fetchChainsTVL();
    return (
      chains.find(
        (c) =>
          c.name.toLowerCase() === "xlayer" || c.name.toLowerCase() === "x layer"
      ) || null
    );
  } catch (error) {
    console.error("Error fetching XLayer TVL:", error);
    return null;
  }
}

// Fetch DEX volumes
export async function fetchDexVolumes(): Promise<DexVolume[]> {
  try {
    const response = await fetch("https://api.llama.fi/overview/dexs?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true&dataType=dailyVolume");
    if (!response.ok) throw new Error("Failed to fetch DEX volumes");
    const data = await response.json();
    const protocols = data?.protocols;
    return Array.isArray(protocols) ? protocols : [];
  } catch (error) {
    console.error("Error fetching DEX volumes:", error);
    return [];
  }
}

// Fetch DEX volumes for XLayer
export async function fetchXLayerDexVolumes(): Promise<DexVolume[]> {
  try {
    const response = await fetch("https://api.llama.fi/overview/dexs/xlayer?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true&dataType=dailyVolume");
    if (!response.ok) {
      // Fallback: filter from all dexes
      const allDexes = await fetchDexVolumes();
      return Array.isArray(allDexes) ? allDexes.filter((d) =>
        d.chains?.some(
          (c) => c.toLowerCase() === "xlayer" || c.toLowerCase() === "x layer"
        )
      ) : [];
    }
    const data = await response.json();
    const protocols = data?.protocols;
    return Array.isArray(protocols) ? protocols : [];
  } catch (error) {
    console.error("Error fetching XLayer DEX volumes:", error);
    return [];
  }
}

// Fetch yield pools
export async function fetchYieldPools(): Promise<YieldPool[]> {
  try {
    const response = await fetch(`${DEFILLAMA_YIELDS_URL}/pools`);
    if (!response.ok) throw new Error("Failed to fetch yield pools");
    const data = await response.json();
    const pools = data?.data;
    return Array.isArray(pools) ? pools : [];
  } catch (error) {
    console.error("Error fetching yield pools:", error);
    return [];
  }
}

// Fetch XLayer yield pools
export async function fetchXLayerYieldPools(): Promise<YieldPool[]> {
  try {
    const pools = await fetchYieldPools();
    return pools.filter(
      (p) => p.chain.toLowerCase() === "xlayer" || p.chain.toLowerCase() === "x layer"
    );
  } catch (error) {
    console.error("Error fetching XLayer yield pools:", error);
    return [];
  }
}

// Fetch stablecoins
export async function fetchStablecoins(): Promise<Stablecoin[]> {
  try {
    const response = await fetch(`${DEFILLAMA_STABLECOINS_URL}/stablecoins?includePrices=true`);
    if (!response.ok) throw new Error("Failed to fetch stablecoins");
    const data = await response.json();
    const assets = data?.peggedAssets;
    return Array.isArray(assets) ? assets : [];
  } catch (error) {
    console.error("Error fetching stablecoins:", error);
    return [];
  }
}

// Fetch token prices
export async function fetchTokenPrices(tokens: string[]): Promise<Record<string, { price: number; symbol: string; timestamp: number }>> {
  try {
    const tokenString = tokens.join(",");
    const response = await fetch(`${DEFILLAMA_COINS_URL}/prices/current/${tokenString}`);
    if (!response.ok) throw new Error("Failed to fetch token prices");
    const data = await response.json();
    return data.coins || {};
  } catch (error) {
    console.error("Error fetching token prices:", error);
    return {};
  }
}

// Fetch protocol TVL history
export async function fetchProtocolTVLHistory(slug: string): Promise<{ date: number; totalLiquidityUSD: number }[]> {
  try {
    const response = await fetch(`${DEFILLAMA_BASE_URL}/protocol/${slug}`);
    if (!response.ok) throw new Error("Failed to fetch protocol TVL");
    const data = await response.json();
    return data.tvl || [];
  } catch (error) {
    console.error("Error fetching protocol TVL:", error);
    return [];
  }
}

// Fetch fees data
export async function fetchFeesData(): Promise<any[]> {
  try {
    const response = await fetch("https://api.llama.fi/overview/fees?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true");
    if (!response.ok) throw new Error("Failed to fetch fees data");
    const data = await response.json();
    const protocols = data?.protocols;
    return Array.isArray(protocols) ? protocols : [];
  } catch (error) {
    console.error("Error fetching fees data:", error);
    return [];
  }
}

// Format helpers
export function formatCurrency(value: number | undefined, decimals = 2): string {
  if (value === undefined || value === null || isNaN(value)) return "$0";
  
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(decimals)}T`;
  } else if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(decimals)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(decimals)}M`;
  } else if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(decimals)}K`;
  }
  return `$${value.toFixed(decimals)}`;
}

export function formatPercentage(value: number | undefined): string {
  if (value === undefined || value === null || isNaN(value)) return "0%";
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}${value.toFixed(2)}%`;
}

export function formatNumber(value: number | undefined): string {
  if (value === undefined || value === null || isNaN(value)) return "0";
  return new Intl.NumberFormat("en-US").format(value);
}

export function getChangeColor(value: number | undefined): string {
  if (value === undefined || value === null) return "text-muted-foreground";
  return value >= 0 ? "text-success" : "text-destructive";
}

export function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp * 1000) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
