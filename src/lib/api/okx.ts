// OKX API v5 client - calls our authenticated edge function proxy

import { supabase } from "@/integrations/supabase/client";

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

// Chain ID mapping for OKX
export const OKX_CHAIN_IDS: Record<string, string> = {
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
};

async function callOkxProxy(endpoint: string, params?: Record<string, any>, method = 'GET', body?: any) {
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

// Fetch all tokens on a chain
export async function fetchOkxChainTokens(chainId: string): Promise<OkxTokenPrice[]> {
  const data = await callOkxProxy('/api/v5/dex/aggregator/all-tokens', { chainId });
  
  if (data?.code === '0' && data?.data) {
    return data.data;
  }
  
  return [];
}

// Fetch ticker data for trading pairs
export async function fetchOkxTickers(instType = 'SPOT'): Promise<OkxTickerData[]> {
  const data = await callOkxProxy('/api/v5/market/tickers', { instType });
  
  if (data?.code === '0' && data?.data) {
    return data.data;
  }
  
  return [];
}

// Fetch single ticker
export async function fetchOkxTicker(instId: string): Promise<OkxTickerData | null> {
  const data = await callOkxProxy('/api/v5/market/ticker', { instId });
  
  if (data?.code === '0' && data?.data?.[0]) {
    return data.data[0];
  }
  
  return null;
}

// Fetch token price using DEX aggregator
export async function fetchOkxTokenPrice(
  chainId: string, 
  tokenAddress: string
): Promise<{ price: number; change24h: number } | null> {
  // For native tokens or wrapped versions, use market ticker
  if (tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' || 
      tokenAddress === '' || 
      tokenAddress === 'native') {
    // Map chain to trading pair
    const chainToInstId: Record<string, string> = {
      '1': 'ETH-USDT',
      '56': 'BNB-USDT',
      '137': 'MATIC-USDT',
      '501': 'SOL-USDT',
      '196': 'OKB-USDT', // XLayer uses OKB
      '43114': 'AVAX-USDT',
    };
    
    const instId = chainToInstId[chainId];
    if (instId) {
      const ticker = await fetchOkxTicker(instId);
      if (ticker) {
        const price = parseFloat(ticker.last);
        const open = parseFloat(ticker.open24h);
        const change24h = open > 0 ? ((price - open) / open) * 100 : 0;
        return { price, change24h };
      }
    }
  }
  
  // For ERC20 tokens, use the aggregator
  const tokens = await fetchOkxChainTokens(chainId);
  const token = tokens.find(t => 
    t.tokenContractAddress?.toLowerCase() === tokenAddress.toLowerCase()
  );
  
  if (token) {
    return {
      price: parseFloat(token.price) || 0,
      change24h: parseFloat(token.priceChange24h || '0'),
    };
  }
  
  return null;
}

// Get quote between two tokens
export async function fetchOkxQuote(
  chainId: string,
  fromToken: string,
  toToken: string,
  amount: string
): Promise<any> {
  const data = await callOkxProxy('/api/v5/dex/aggregator/quote', {
    chainId,
    fromTokenAddress: fromToken,
    toTokenAddress: toToken,
    amount,
  });
  
  if (data?.code === '0' && data?.data?.[0]) {
    return data.data[0];
  }
  
  return null;
}

// Map our chain names to OKX chain IDs
export function getOkxChainId(chain: string): string {
  const normalized = chain.toLowerCase().trim();
  return OKX_CHAIN_IDS[normalized] || '1'; // Default to Ethereum
}

// Batch fetch prices for multiple tokens
export async function fetchOkxBatchPrices(
  chainId: string,
  tokenAddresses: string[]
): Promise<Map<string, { price: number; change24h: number }>> {
  const results = new Map<string, { price: number; change24h: number }>();
  
  // Fetch all tokens on chain once
  const tokens = await fetchOkxChainTokens(chainId);
  
  for (const address of tokenAddresses) {
    const token = tokens.find(t => 
      t.tokenContractAddress?.toLowerCase() === address.toLowerCase()
    );
    
    if (token) {
      results.set(address.toLowerCase(), {
        price: parseFloat(token.price) || 0,
        change24h: parseFloat(token.priceChange24h || '0'),
      });
    }
  }
  
  return results;
}

export default {
  fetchOkxChainTokens,
  fetchOkxTickers,
  fetchOkxTicker,
  fetchOkxTokenPrice,
  fetchOkxQuote,
  getOkxChainId,
  fetchOkxBatchPrices,
  OKX_CHAIN_IDS,
};
