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
    if (!Array.isArray(protocols)) return [];
    return protocols.map(normalizeDexVolume);
  } catch (error) {
    console.error("Error fetching DEX volumes:", error);
    return [];
  }
}

// Fetch DEX volumes for XLayer
export async function fetchXLayerDexVolumes(): Promise<DexVolume[]> {
  try {
    // Attempt DEX-specific endpoint first
    let dexes: DexVolume[] = [];
    try {
      const response = await fetch("https://api.llama.fi/overview/dexs/xlayer?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true&dataType=dailyVolume");
      if (response.ok) {
        const data = await response.json();
        const protocols = data?.protocols;
        if (Array.isArray(protocols)) {
          dexes = protocols.map(normalizeDexVolume);
        }
      }
    } catch (e) {
      console.warn("DefiLlama XLayer DEX endpoint failed, falling back to aggregated DEX list");
    }

    // Fallback: filter from the general DEX list
    if (dexes.length === 0) {
      const allDexes = await fetchDexVolumes();
      dexes = Array.isArray(allDexes)
        ? allDexes.filter((d) => d.chains?.some((c) => c.toLowerCase().includes("xlayer")))
        : [];
    }

    // Enrich with any protocols that look like DEXs but are missing from the DEX endpoint
    try {
      const protocols = await fetchProtocols();
      const existingNames = new Set(dexes.map((d) => (d.displayName || d.name || "").toLowerCase()));

      const dexCandidates = protocols.filter((p) => {
        const name = (p.name || "").toLowerCase();
        const isDexLike = p.module === "dex" || name.includes("dex") || name.includes("swap");
        const chains = p.chains || (p.chain ? [p.chain] : []);
        const onXLayer = Array.isArray(chains) && chains.some((c) => String(c).toLowerCase().includes("xlayer"));
        return isDexLike && onXLayer;
      });

      for (const p of dexCandidates) {
        const key = (p.name || "").toLowerCase();
        if (existingNames.has(key)) continue;
        existingNames.add(key);
        dexes.push(normalizeDexVolume(p));
      }

      // Also include DEX-like protocols discovered by fetchXLayerProtocols (some may not have chains populated)
      try {
        const xlayerProtocols = await fetchXLayerProtocols();
        for (const p of xlayerProtocols) {
          const nameLower = (p.name || "").toLowerCase();
          const isDexLike = p.module === "dex" || nameLower.includes("dex") || nameLower.includes("swap") || nameLower.includes("amm");
          if (!isDexLike) continue;
          const key = (p.name || "").toLowerCase();
          if (existingNames.has(key)) continue;
          existingNames.add(key);
          dexes.push(normalizeDexVolume(p));
        }
      } catch (e) {
        // non-fatal
      }
    } catch (e) {
      console.warn("Failed to enrich DEX data from protocols", e);
    }

    // final dedupe by display/name
    const seen = new Set<string>();
    return dexes.filter((d) => {
      const key = (d.displayName || d.name || "").toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
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

// Fetch single token price with fallback
export async function fetchDefiLlamaTokenPrices(
  chain: string, 
  address: string
): Promise<{ price: number; priceChange24h?: number } | null> {
  try {
    // Map chain index to DefiLlama chain name
    const chainMap: Record<string, string> = {
      '1': 'ethereum',
      '56': 'bsc',
      '137': 'polygon',
      '42161': 'arbitrum',
      '10': 'optimism',
      '8453': 'base',
      '196': 'xlayer',
      '324': 'zksync',
      '43114': 'avax',
      '250': 'fantom',
    };
    
    const chainName = chainMap[chain] || 'ethereum';
    const tokenKey = `${chainName}:${address}`;
    
    const response = await fetch(`${DEFILLAMA_COINS_URL}/prices/current/${encodeURIComponent(tokenKey)}?searchWidth=4h`);
    if (!response.ok) return null;
    
    const data = await response.json();
    const coinData = data.coins?.[tokenKey];
    
    if (coinData?.price) {
      return {
        price: coinData.price,
        priceChange24h: coinData.change24h,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching DefiLlama token price:", error);
    return null;
  }
}

// Fetch top tokens by chain using DefiLlama
export interface DefiLlamaToken {
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
  source: 'defillama';
}

export async function fetchTopTokensByChain(
  chainIndex: string,
  limit: number = 50
): Promise<DefiLlamaToken[]> {
  try {
    // Map chain index to DefiLlama chain name
    const chainMap: Record<string, string> = {
      '1': 'ethereum',
      '56': 'bsc',
      '137': 'polygon',
      '42161': 'arbitrum',
      '10': 'optimism',
      '8453': 'base',
      '196': 'xlayer',
      'all': 'all',
    };
    
    const chainName = chainMap[chainIndex] || 'ethereum';
    
    // Use the protocols endpoint and filter for relevant tokens
    const response = await fetch(`${DEFILLAMA_BASE_URL}/protocols`);
    if (!response.ok) return [];
    
    const protocols: Protocol[] = await response.json();
    
    // Filter protocols that are on the target chain and have TVL
    let filtered = protocols.filter(p => {
      if (chainIndex === 'all') return p.tvl && p.tvl > 0;
      const chains = p.chains || (p.chain ? [p.chain] : []);
      return chains.some((c: string) => 
        c.toLowerCase() === chainName.toLowerCase() || 
        c.toLowerCase().includes(chainName.toLowerCase())
      ) && p.tvl && p.tvl > 0;
    });
    
    // Sort by TVL
    filtered.sort((a, b) => (b.tvl || 0) - (a.tvl || 0));
    
    // Convert to token format
    const tokens: DefiLlamaToken[] = filtered.slice(0, limit).map((p, i) => ({
      id: `defillama-${p.id || p.slug || i}`,
      chainIndex,
      chainName: chainName === 'all' ? 'Multi-Chain' : chainName,
      contractAddress: p.address || p.id || '',
      symbol: p.symbol || p.name.substring(0, 4).toUpperCase(),
      name: p.name,
      logo: p.logo,
      price: 0, // DefiLlama protocols don't have direct price
      priceChange24h: p.change_1d || 0,
      volume24h: 0,
      liquidity: p.tvl || 0,
      marketCap: p.mcap || 0,
      holders: 0,
      source: 'defillama' as const,
    }));
    
    return tokens;
  } catch (error) {
    console.error("Error fetching DefiLlama tokens:", error);
    return [];
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
