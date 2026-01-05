// OKX Web3 API v6 Client - Analytics focused
// Calls our authenticated edge function proxy

import { supabase } from "@/integrations/supabase/client";

// ============ Types ============

export interface OkxChain {
  chainIndex: string;
  chainName: string;
  chainLogo?: string;
}

export interface OkxTokenBasicInfo {
  chainIndex: string;
  tokenContractAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenLogo?: string;
  decimals: string;
  totalSupply?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
}

export interface OkxTokenPriceInfo {
  chainIndex: string;
  tokenContractAddress: string;
  tokenSymbol: string;
  tokenName?: string;
  tokenLogo?: string;
  price: string;
  priceChange5m?: string;
  priceChange1h?: string;
  priceChange4h?: string;
  priceChange24h?: string;
  volume24h?: string;
  volumeBuy24h?: string;
  volumeSell24h?: string;
  buyCount24h?: string;
  sellCount24h?: string;
  holders?: string;
  liquidity?: string;
  marketCap?: string;
  circulatingSupply?: string;
}

export interface OkxTokenRankingItem {
  chainIndex: string;
  tokenContractAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenLogo?: string;
  price: string;
  priceChange5m?: string;
  priceChange1h?: string;
  priceChange4h?: string;
  priceChange24h?: string;
  volume24h?: string;
  liquidity?: string;
  holders?: string;
  marketCap?: string;
}

export interface OkxCandlestick {
  ts: string;        // Timestamp
  open: string;      // Open price
  high: string;      // High price
  low: string;       // Low price
  close: string;     // Close price
  volume?: string;   // Volume
  volumeCcy?: string; // Volume in currency
}

export interface OkxTrade {
  chainIndex: string;
  txHash: string;
  blockNumber: string;
  timestamp: string;
  tokenContractAddress: string;
  tokenSymbol: string;
  side: 'buy' | 'sell';
  amount: string;
  price: string;
  totalValue: string;
  maker?: string;
  taker?: string;
}

export interface OkxTopHolder {
  rank: number;
  address: string;
  balance: string;
  percentage: string;
  value?: string;
}

export interface OkxTransaction {
  chainIndex: string;
  txHash: string;
  blockNumber: string;
  timestamp: string;
  from: string;
  to: string;
  tokenContractAddress?: string;
  tokenSymbol?: string;
  amount?: string;
  value?: string;
  status: string;
  gasUsed?: string;
  gasPrice?: string;
}

// Chain ID mapping for OKX v6
export const OKX_CHAIN_INDEX: Record<string, string> = {
  ethereum: '1',
  eth: '1',
  bsc: '56',
  binance: '56',
  polygon: '137',
  matic: '137',
  arbitrum: '42161',
  optimism: '10',
  xlayer: '196',
  'x layer': '196',
  'x-layer': '196',
  solana: '501',
  sol: '501',
  base: '8453',
  avalanche: '43114',
  avax: '43114',
  fantom: '250',
  ftm: '250',
  cronos: '25',
  gnosis: '100',
  zksync: '324',
  linea: '59144',
  scroll: '534352',
  mantle: '5000',
  blast: '81457',
  sui: '784',
  ton: '607',
};

// ============ Core API Call Function ============

async function callOkxProxy(
  endpoint: string, 
  params?: Record<string, any>, 
  method = 'GET', 
  body?: any
): Promise<any> {
  try {
    const { data, error } = await supabase.functions.invoke('okx-proxy', {
      body: { endpoint, params, method, body }
    });
    
    if (error) {
      console.error('OKX proxy error:', error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('OKX API call failed:', err);
    return null;
  }
}

// ============ Market Price API (v6) ============

/**
 * Get latest token price
 */
export async function fetchOkxPrice(
  chainIndex: string, 
  tokenAddress: string
): Promise<{ price: number; timestamp: number } | null> {
  const data = await callOkxProxy('/api/v6/dex/market/price', {
    chainIndex,
    tokenContractAddress: tokenAddress,
  });
  
  if (data?.code === '0' && data?.data?.[0]) {
    return {
      price: parseFloat(data.data[0].price) || 0,
      timestamp: parseInt(data.data[0].ts) || Date.now(),
    };
  }
  
  return null;
}

/**
 * Get candlestick/OHLC data
 * @param bar - Candlestick interval: 1s, 1m, 5m, 15m, 30m, 1H, 4H, 1D, 1W, 1M
 * @param limit - Number of candles (max 300)
 */
export async function fetchOkxCandlesticks(
  chainIndex: string,
  tokenAddress: string,
  bar: string = '1H',
  limit: number = 100
): Promise<OkxCandlestick[]> {
  const data = await callOkxProxy('/api/v6/dex/market/candles', {
    chainIndex,
    tokenContractAddress: tokenAddress,
    bar,
    limit: String(limit),
  });
  
  if (data?.code === '0' && data?.data) {
    return data.data.map((candle: any) => ({
      ts: candle[0],
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: candle[5],
      volumeCcy: candle[6],
    }));
  }
  
  return [];
}

/**
 * Get historical candlestick data
 */
export async function fetchOkxHistoricalCandles(
  chainIndex: string,
  tokenAddress: string,
  bar: string = '1D',
  after?: string,
  before?: string,
  limit: number = 100
): Promise<OkxCandlestick[]> {
  const params: Record<string, string> = {
    chainIndex,
    tokenContractAddress: tokenAddress,
    bar,
    limit: String(limit),
  };
  if (after) params.after = after;
  if (before) params.before = before;
  
  const data = await callOkxProxy('/api/v6/dex/market/historical-candles', params);
  
  if (data?.code === '0' && data?.data) {
    return data.data.map((candle: any) => ({
      ts: candle[0],
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: candle[5],
      volumeCcy: candle[6],
    }));
  }
  
  return [];
}

/**
 * Get recent trades for a token
 */
export async function fetchOkxTrades(
  chainIndex: string,
  tokenAddress: string,
  limit: number = 50
): Promise<OkxTrade[]> {
  const data = await callOkxProxy('/api/v6/dex/market/trades', {
    chainIndex,
    tokenContractAddress: tokenAddress,
    limit: String(limit),
  });
  
  if (data?.code === '0' && data?.data) {
    return data.data;
  }
  
  return [];
}

/**
 * Get supported chains
 */
export async function fetchOkxSupportedChains(): Promise<OkxChain[]> {
  const data = await callOkxProxy('/api/v6/dex/market/supported-chains');
  
  if (data?.code === '0' && data?.data) {
    return data.data;
  }
  
  return [];
}

// ============ Token API (v6) ============

/**
 * Search tokens by keyword
 */
export async function fetchOkxTokenSearch(
  keyword: string,
  chainIndex?: string
): Promise<OkxTokenBasicInfo[]> {
  const params: Record<string, string> = { keyword };
  if (chainIndex) params.chainIndex = chainIndex;
  
  const data = await callOkxProxy('/api/v6/dex/token/search', params);
  
  if (data?.code === '0' && data?.data) {
    return data.data;
  }
  
  return [];
}

/**
 * Get token basic info (name, symbol, socials, etc.)
 */
export async function fetchOkxTokenBasicInfo(
  chainIndex: string,
  tokenAddress: string
): Promise<OkxTokenBasicInfo | null> {
  const data = await callOkxProxy('/api/v6/dex/token/basic-info', {
    chainIndex,
    tokenContractAddress: tokenAddress,
  });
  
  if (data?.code === '0' && data?.data?.[0]) {
    return data.data[0];
  }
  
  return null;
}

/**
 * Get rich token price info (price, changes, volume, holders, liquidity)
 */
export async function fetchOkxTokenPriceInfo(
  chainIndex: string,
  tokenAddress: string
): Promise<OkxTokenPriceInfo | null> {
  const data = await callOkxProxy('/api/v6/dex/token/price-info', {
    chainIndex,
    tokenContractAddress: tokenAddress,
  });
  
  if (data?.code === '0' && data?.data?.[0]) {
    return data.data[0];
  }
  
  return null;
}

/**
 * Get token rankings
 *
 * NOTE: OKX Wallet Market API uses this endpoint (per docs):
 * GET https://web3.okx.com/api/v6/dex/market/token/toplist
 *
 * Params:
 * - chains: comma-separated chainIndex list
 * - sortBy: 2=price change, 5=volume, 6=market cap
 * - timeFrame: 1=5m, 2=1h, 3=4h, 4=24h
 */
export async function fetchOkxTokenRanking(
  chainIndex: string,
  sortBy:
    | 'change5m'
    | 'change1h'
    | 'change4h'
    | 'change24h'
    | 'volume24h'
    | 'marketCap'
    | 'liquidity' = 'volume24h',
  direction: 'asc' | 'desc' = 'desc',
  limit: number = 50
): Promise<OkxTokenRankingItem[]> {
  const sortByMap: Record<string, { sortBy: string; timeFrame: string }> = {
    change5m: { sortBy: '2', timeFrame: '1' },
    change1h: { sortBy: '2', timeFrame: '2' },
    change4h: { sortBy: '2', timeFrame: '3' },
    change24h: { sortBy: '2', timeFrame: '4' },
    volume24h: { sortBy: '5', timeFrame: '4' },
    marketCap: { sortBy: '6', timeFrame: '4' },
    // Not supported in this endpoint; fall back to volume
    liquidity: { sortBy: '5', timeFrame: '4' },
  };

  const mapped = sortByMap[sortBy] ?? sortByMap.volume24h;

  const data = await callOkxProxy('/api/v6/dex/market/token/toplist', {
    chains: chainIndex,
    sortBy: mapped.sortBy,
    timeFrame: mapped.timeFrame,
  });

  if (data?.code !== '0' || !Array.isArray(data?.data)) return [];

  const normalized: OkxTokenRankingItem[] = data.data
    .slice(0, Math.min(limit, 100))
    .map((item: any) => {
      const change = item.change ?? '0';

      return {
        chainIndex: item.chainIndex ?? chainIndex,
        tokenContractAddress: item.tokenContractAddress,
        tokenSymbol: item.tokenSymbol,
        tokenName: item.tokenName ?? item.tokenSymbol,
        tokenLogo: item.tokenLogoUrl,
        price: item.price,
        // This API returns a single 'change' for the selected timeFrame.
        priceChange5m: mapped.timeFrame === '1' ? change : undefined,
        priceChange1h: mapped.timeFrame === '2' ? change : undefined,
        priceChange4h: mapped.timeFrame === '3' ? change : undefined,
        priceChange24h: mapped.timeFrame === '4' ? change : undefined,
        volume24h: item.volume,
        liquidity: item.liquidity,
        holders: item.holders,
        marketCap: item.marketCap,
      };
    });

  // Endpoint is desc-only; emulate asc for the UI when needed.
  return direction === 'asc' ? normalized.reverse() : normalized;
}

/**
 * Get top token holders
 */
export async function fetchOkxTopHolders(
  chainIndex: string,
  tokenAddress: string
): Promise<OkxTopHolder[]> {
  const data = await callOkxProxy('/api/v6/dex/token/top-holders', {
    chainIndex,
    tokenContractAddress: tokenAddress,
  });
  
  if (data?.code === '0' && data?.data) {
    return data.data.map((holder: any, index: number) => ({
      rank: index + 1,
      address: holder.address,
      balance: holder.balance,
      percentage: holder.percentage,
      value: holder.value,
    }));
  }
  
  return [];
}

// ============ Index Price API (v6) ============

/**
 * Get index price for native tokens
 */
export async function fetchOkxIndexPrice(
  chainIndex: string
): Promise<{ price: number; symbol: string } | null> {
  const data = await callOkxProxy('/api/v6/dex/index/price', { chainIndex });
  
  if (data?.code === '0' && data?.data?.[0]) {
    return {
      price: parseFloat(data.data[0].price) || 0,
      symbol: data.data[0].symbol || '',
    };
  }
  
  return null;
}

// ============ Transaction History API (v6) ============

/**
 * Get transaction history for an address
 */
export async function fetchOkxTxHistory(
  chainIndex: string,
  address: string,
  limit: number = 50
): Promise<OkxTransaction[]> {
  const data = await callOkxProxy('/api/v6/dex/tx/history', {
    chainIndex,
    address,
    limit: String(limit),
  });
  
  if (data?.code === '0' && data?.data) {
    return data.data;
  }
  
  return [];
}

/**
 * Get transaction details by hash
 */
export async function fetchOkxTxDetail(
  chainIndex: string,
  txHash: string
): Promise<OkxTransaction | null> {
  const data = await callOkxProxy('/api/v6/dex/tx/detail', {
    chainIndex,
    txHash,
  });
  
  if (data?.code === '0' && data?.data?.[0]) {
    return data.data[0];
  }
  
  return null;
}

// ============ Legacy v5 Endpoints (backward compatibility) ============

export interface OkxTokenPrice {
  tokenContractAddress: string;
  tokenSymbol: string;
  tokenName?: string;
  tokenLogo?: string;
  price: string;
  priceChange24h?: string;
  volume24h?: string;
  marketCap?: string;
  liquidity?: string;
  holdingAmount?: string;
}

export interface OkxTickerData {
  instId: string;
  last: string;
  lastSz: string;
  askPx: string;
  askSz: string;
  bidPx: string;
  bidSz: string;
  open24h: string;
  high24h: string;
  low24h: string;
  vol24h: string;
  volCcy24h: string;
  ts: string;
}

/**
 * Legacy: Fetch all tokens on a chain (v5)
 */
export async function fetchOkxChainTokens(chainId: string): Promise<OkxTokenPrice[]> {
  const data = await callOkxProxy('/api/v5/dex/aggregator/all-tokens', { chainId });
  
  if (data?.code === '0' && data?.data) {
    return data.data;
  }
  
  return [];
}

/**
 * Legacy: Fetch ticker data (v5)
 */
export async function fetchOkxTickers(instType = 'SPOT'): Promise<OkxTickerData[]> {
  const data = await callOkxProxy('/api/v5/market/tickers', { instType });
  
  if (data?.code === '0' && data?.data) {
    return data.data;
  }
  
  return [];
}

/**
 * Legacy: Fetch single ticker (v5)
 */
export async function fetchOkxTicker(instId: string): Promise<OkxTickerData | null> {
  const data = await callOkxProxy('/api/v5/market/ticker', { instId });
  
  if (data?.code === '0' && data?.data?.[0]) {
    return data.data[0];
  }
  
  return null;
}

// ============ Utility Functions ============

/**
 * Map chain name to OKX chain index
 */
export function getOkxChainIndex(chain: string): string {
  const normalized = chain.toLowerCase().trim();
  return OKX_CHAIN_INDEX[normalized] || '1'; // Default to Ethereum
}

/**
 * Get chain name from index
 */
export function getChainNameFromIndex(chainIndex: string): string {
  const entry = Object.entries(OKX_CHAIN_INDEX).find(([_, idx]) => idx === chainIndex);
  return entry ? entry[0] : 'ethereum';
}

/**
 * Batch fetch token prices using v6 API
 */
export async function fetchOkxBatchTokenPrices(
  chainIndex: string,
  tokenAddresses: string[]
): Promise<Map<string, OkxTokenPriceInfo>> {
  const results = new Map<string, OkxTokenPriceInfo>();
  
  // Fetch in parallel batches of 10
  const batchSize = 10;
  for (let i = 0; i < tokenAddresses.length; i += batchSize) {
    const batch = tokenAddresses.slice(i, i + batchSize);
    const promises = batch.map(addr => fetchOkxTokenPriceInfo(chainIndex, addr));
    const batchResults = await Promise.all(promises);
    
    batchResults.forEach((result, index) => {
      if (result) {
        results.set(batch[index].toLowerCase(), result);
      }
    });
  }
  
  return results;
}

// ============ Export Default ============

export default {
  // v6 Market API
  fetchOkxPrice,
  fetchOkxCandlesticks,
  fetchOkxHistoricalCandles,
  fetchOkxTrades,
  fetchOkxSupportedChains,
  
  // v6 Token API
  fetchOkxTokenSearch,
  fetchOkxTokenBasicInfo,
  fetchOkxTokenPriceInfo,
  fetchOkxTokenRanking,
  fetchOkxTopHolders,
  
  // v6 Index API
  fetchOkxIndexPrice,
  
  // v6 Transaction API
  fetchOkxTxHistory,
  fetchOkxTxDetail,
  
  // Legacy v5
  fetchOkxChainTokens,
  fetchOkxTickers,
  fetchOkxTicker,
  
  // Utilities
  getOkxChainIndex,
  getChainNameFromIndex,
  fetchOkxBatchTokenPrices,
  OKX_CHAIN_INDEX,
};
