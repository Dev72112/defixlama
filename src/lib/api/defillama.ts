// DefiLlama API service for XLayer chain data

const DEFILLAMA_BASE_URL = "https://api.llama.fi";
const DEFILLAMA_COINS_URL = "https://coins.llama.fi";
const DEFILLAMA_STABLECOINS_URL = "https://stablecoins.llama.fi";
const DEFILLAMA_YIELDS_URL = "https://yields.llama.fi";

// XLayer chain identifier in DefiLlama (uses "X Layer" with space)
export const XLAYER_CHAIN = "X Layer";
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

// Helpers to normalize dex payloads from various endpoints
function firstNumber(obj: any, keys: string[]): number | undefined {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "number" && !isNaN(v)) return v;
    if (typeof v === "string" && !isNaN(Number(v))) return Number(v);
  }
  return undefined;
}

function normalizeDexVolume(raw: any): DexVolume {
  if (!raw) return { name: "unknown" };
  const name = raw.displayName || raw.name || raw.id || "unknown";
  const displayName = raw.displayName || raw.name;
  const chains = raw.chains || raw.chain ? (Array.isArray(raw.chains) ? raw.chains : [raw.chain]) : [];

  const total24h = firstNumber(raw, ["total24h", "total_24h", "total24hUsd", "total24hVolume", "totalVolume24h", "totalVolume", "tvl"]);
  const total7d = firstNumber(raw, ["total7d", "total_7d", "total7dUsd", "total7dVolume", "totalVolume7d"]);
  const total30d = firstNumber(raw, ["total30d", "total_30d", "total30dUsd", "total30dVolume"]);
  const totalAllTime = firstNumber(raw, ["totalAllTime", "total_all_time", "totalAllTimeUsd", "totalVolumeAllTime", "totalVolume"]);

  const change_1d = firstNumber(raw, ["change_1d", "change1d", "change_24h"]);
  const change_7d = firstNumber(raw, ["change_7d", "change7d"]);

  const logo = raw.logo || raw.icon || raw.image;

  return {
    name,
    displayName,
    total24h,
    total7d,
    total30d,
    totalAllTime,
    change_1d,
    change_7d,
    logo,
    chains,
  };
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
  return fetchChainProtocols("xlayer");
}

// Fetch protocols filtered by chain name (or "all" for everything)
export async function fetchChainProtocols(chain: string): Promise<Protocol[]> {
  try {
    const protocols = await fetchProtocols();
    if (chain === "all") {
      // Cap at 500 sorted by TVL to prevent browser freeze
      return protocols.sort((a, b) => (b.tvl || 0) - (a.tvl || 0)).slice(0, 500);
    }
    const lower = chain.toLowerCase().replace(/[\s-]/g, "");
    return protocols.filter(
      (p) =>
        p.chains?.some((c) => c.toLowerCase().replace(/[\s-]/g, "") === lower) ||
        p.chain?.toLowerCase().replace(/[\s-]/g, "") === lower
    );
  } catch (error) {
    console.error(`Error fetching ${chain} protocols:`, error);
    return [];
  }
}

// Fetch global (all chains aggregated) TVL history
export async function fetchGlobalTVLHistory(): Promise<ChainTVL[]> {
  try {
    const response = await fetch(`${DEFILLAMA_BASE_URL}/v2/historicalChainTvl`);
    if (!response.ok) throw new Error("Failed to fetch global TVL history");
    const data: ChainTVL[] = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching global TVL history:", error);
    return [];
  }
}

// Fetch TVL history for a chain
export async function fetchChainTVLHistory(chain: string): Promise<ChainTVL[]> {
  try {
    const response = await fetch(`${DEFILLAMA_BASE_URL}/v2/historicalChainTvl/${encodeURIComponent(chain)}`);
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
  return fetchChainTVL("xlayer");
}

// Fetch TVL for a specific chain (or sum all for "all")
export async function fetchChainTVL(chain: string): Promise<ChainData | null> {
  try {
    const chains = await fetchChainsTVL();
    if (chain === "all") {
      const totalTvl = chains.reduce((acc, c) => acc + (c.tvl || 0), 0);
      return { name: "All Chains", tvl: totalTvl };
    }
    const lower = chain.toLowerCase().replace(/[\s-]/g, "");
    return chains.find((c) => c.name.toLowerCase().replace(/[\s-]/g, "") === lower) || null;
  } catch (error) {
    console.error(`Error fetching ${chain} TVL:`, error);
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
    if (!Array.isArray(protocols)) return [];
    return protocols.map(normalizeDexVolume);
  } catch (error) {
    console.error("Error fetching DEX volumes:", error);
    return [];
  }
}

// Fetch DEX volumes for XLayer
export async function fetchXLayerDexVolumes(): Promise<DexVolume[]> {
  return fetchChainDexVolumes("xlayer");
}

// Fetch DEX volumes filtered by chain (or "all" for everything)
export async function fetchChainDexVolumes(chain: string): Promise<DexVolume[]> {
  try {
    if (chain === "all") {
      return fetchDexVolumes();
    }
    const lower = chain.toLowerCase().replace(/[\s-]/g, "");
    // Try chain-specific endpoint
    let dexes: DexVolume[] = [];
    try {
      const response = await fetch(`https://api.llama.fi/overview/dexs/${encodeURIComponent(chain)}?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true&dataType=dailyVolume`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data?.protocols)) {
          dexes = data.protocols.map(normalizeDexVolume);
        }
      }
    } catch (e) {}
    // Fallback: filter from all
    if (dexes.length === 0) {
      const allDexes = await fetchDexVolumes();
      dexes = allDexes.filter((d) => d.chains?.some((c) => c.toLowerCase().replace(/[\s-]/g, "") === lower));
    }
    return dexes;
  } catch (error) {
    console.error(`Error fetching ${chain} DEX volumes:`, error);
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
  return fetchChainYieldPools("xlayer");
}

// Fetch yield pools filtered by chain (or "all" for everything, capped at 500)
export async function fetchChainYieldPools(chain: string): Promise<YieldPool[]> {
  try {
    const pools = await fetchYieldPools();
    if (chain === "all") {
      // Cap at 500 sorted by TVL to prevent browser freeze
      return pools.sort((a, b) => (b.tvlUsd || 0) - (a.tvlUsd || 0)).slice(0, 500);
    }
    const lower = chain.toLowerCase().replace(/[\s-]/g, "");
    return pools.filter(
      (p) => p.chain.toLowerCase().replace(/[\s-]/g, "") === lower
    );
  } catch (error) {
    console.error(`Error fetching ${chain} yield pools:`, error);
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
    const tokenStringEncoded = tokens.map((t) => encodeURIComponent(t)).join(',');
    const response = await fetch(`${DEFILLAMA_COINS_URL}/prices/current/${tokenStringEncoded}`);
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
    const response = await fetch(`${DEFILLAMA_BASE_URL}/protocol/${encodeURIComponent(slug)}`);
    if (!response.ok) throw new Error("Failed to fetch protocol TVL");
    const data = await response.json();
    const tvlArray = data.tvl || [];
    
    // Limit to 365 days max to prevent memory issues with huge datasets
    if (Array.isArray(tvlArray)) {
      return tvlArray.slice(-365);
    }
    return [];
  } catch (error) {
    console.error("Error fetching protocol TVL:", error);
    return [];
  }
}

// Fetch full protocol details from DefiLlama (used to enrich protocol detail pages)
export async function fetchProtocolDetails(slug: string): Promise<any | null> {
  try {
    const response = await fetch(`${DEFILLAMA_BASE_URL}/protocol/${encodeURIComponent(slug)}`);
    if (!response.ok) throw new Error("Failed to fetch protocol details");
    const data = await response.json();
    
    // Limit addresses to 100 max to prevent rendering crashes
    if (data?.addresses && Array.isArray(data.addresses)) {
      data.addresses = data.addresses.slice(0, 100);
    }
    
    return data || null;
  } catch (error) {
    console.error("Error fetching protocol details:", error);
    return null;
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

// Fetch fees data filtered by chain (or "all" for everything)
export async function fetchChainFees(chain: string): Promise<any[]> {
  try {
    if (chain === "all") return fetchFeesData();
    // DefiLlama supports chain-specific fees endpoint
    const response = await fetch(`https://api.llama.fi/overview/fees/${encodeURIComponent(chain)}?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true`);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data?.protocols)) return data.protocols;
    }
    // Fallback: filter from all fees
    const allFees = await fetchFeesData();
    const lower = chain.toLowerCase().replace(/[\s-]/g, "");
    return allFees.filter((f: any) =>
      f.chains?.some((c: string) => c.toLowerCase().replace(/[\s-]/g, "") === lower)
    );
  } catch (error) {
    console.error(`Error fetching ${chain} fees:`, error);
    return [];
  }
}

// Fetch full DEX details from DefiLlama (used to enrich DEX detail pages)
export async function fetchDexDetails(name: string): Promise<any | null> {
  try {
    // Try DEX-specific endpoint first
    const response = await fetch(`${DEFILLAMA_BASE_URL}/dexs/${encodeURIComponent(name)}`);
    if (response.ok) {
      const data = await response.json();
      return data || null;
    }
    return null;
  } catch (error) {
    console.error("Error fetching DEX details:", error);
    return null;
  }
}

// Format helpers
export function formatCurrency(value: number | undefined, decimals = 2): string {
  if (value === undefined || value === null) return "$0";
  const num = Number(value);
  if (isNaN(num)) return "$0";
  
  if (num >= 1e12) {
    return `$${(num / 1e12).toFixed(decimals)}T`;
  } else if (num >= 1e9) {
    return `$${(num / 1e9).toFixed(decimals)}B`;
  } else if (num >= 1e6) {
    return `$${(num / 1e6).toFixed(decimals)}M`;
  } else if (num >= 1e3) {
    return `$${(num / 1e3).toFixed(decimals)}K`;
  }
  return `$${num.toFixed(decimals)}`;
}

export function formatPercentage(value: number | undefined): string {
  if (value === undefined || value === null) return "0%";
  const num = Number(value);
  if (isNaN(num)) return "0%";
  const prefix = num >= 0 ? "+" : "";
  return `${prefix}${num.toFixed(2)}%`;
}

export function formatNumber(value: number | undefined): string {
  if (value === undefined || value === null) return "0";
  const num = Number(value);
  if (isNaN(num)) return "0";
  return new Intl.NumberFormat("en-US").format(num);
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
