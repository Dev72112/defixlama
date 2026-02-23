// OKLink API helper for XLayer token data
// Uses OKX Explorer public endpoints for live token data
// Leverages unified API client for error handling and retries

import { ApiClient } from './client';

const OKLINK_BASE = "https://www.oklink.com/api";
const OKX_EXPLORER_BASE = "https://www.okx.com/api/v5/explorer";

const oklinkClient = new ApiClient({
  baseUrl: OKLINK_BASE,
  timeout: 8000,
  maxRetries: 2,
  retryDelay: 500,
});

const okxExplorerClient = new ApiClient({
  baseUrl: OKX_EXPLORER_BASE,
  timeout: 8000,
  maxRetries: 2,
  retryDelay: 500,
});

interface OklinkTokenInfo {
  symbol?: string;
  name?: string;
  logo?: string;
  contractLogo?: string;
  description?: string;
  contractName?: string;
  totalSupply?: string;
  holders?: number;
  price?: number;
  priceUsd?: string;
  change24h?: number;
  volume24h?: number;
  marketCap?: number;
  error?: string;
}

/**
 * Parse token info from various API response formats
 */
function parseTokenInfo(data: any): OklinkTokenInfo | null {
  if (!data) return null;

  const info = data.result || data.data;
  if (!info) return null;

  return {
    symbol: info.symbol || info.tokenSymbol,
    name: info.name || info.tokenName || info.contractName,
    logo: info.logo || info.image || info.tokenLogo,
    contractLogo: info.contractLogo,
    description: info.description,
    contractName: info.contractName,
    totalSupply: info.totalSupply,
    holders: info.holders || info.holderCount,
    price: parseFloat(info.price || info.priceUsd) || 0,
    priceUsd: info.priceUsd,
    change24h: parseFloat(info.priceChange24h || info.change24h) || 0,
    volume24h: parseFloat(info.volume24h || info.tradingVolume) || 0,
    marketCap: parseFloat(info.marketCap) || 0,
  };
}

// Fetch token info from OKX Explorer for XLayer
export async function fetchOklinkTokenInfo(contract: string): Promise<OklinkTokenInfo | null> {
  const enc = encodeURIComponent(contract);

  // Try multiple OKX Explorer endpoints for XLayer
  const endpoints = [
    `/xlayer/api?module=token&action=tokeninfo&contractaddress=${enc}`,
  ];

  for (const path of endpoints) {
    const response = await oklinkClient.get<any>(path);
    if (response.success && response.data) {
      const tokenInfo = parseTokenInfo(response.data);
      if (tokenInfo) return tokenInfo;
    }
  }

  // Fallback to OKX Explorer service
  const okxResponse = await okxExplorerClient.get<any>(
    `/xlayer/api?module=token&action=tokeninfo&contractaddress=${enc}`
  );
  if (okxResponse.success && okxResponse.data) {
    const tokenInfo = parseTokenInfo(okxResponse.data);
    if (tokenInfo) return tokenInfo;
  }

  return null;
}

export async function fetchOklinkAddressTokens(address: string) {
  const enc = encodeURIComponent(address);

  const response = await oklinkClient.get<any>(
    `/explorer/v1/address/${enc}/token`
  );

  if (response.success && response.data) {
    return response.data;
  }

  return null;
}

export async function fetchOklinkContractInfo(address: string): Promise<OklinkTokenInfo | null> {
  // Try dedicated token info first
  const tokenInfo = await fetchOklinkTokenInfo(address);
  if (tokenInfo && tokenInfo.name) return tokenInfo;

  const enc = encodeURIComponent(address);
  const response = await oklinkClient.get<any>(`/explorer/v1/contract/${enc}`);

  if (response.success && response.data) {
    const info = parseTokenInfo(response.data);
    if (info) return info;
  }

  return null;
}

export async function fetchOklinkTxsForAddress(address: string, page = 1, size = 10) {
  const enc = encodeURIComponent(address);

  const response = await oklinkClient.get<any>(
    `/explorer/v1/address/${enc}/txs`,
    { params: { page, size } }
  );

  if (response.success && response.data) {
    return response.data;
  }

  return null;
}

// Fetch live price from OKX for XLayer tokens
export async function fetchOklinkLivePrice(contract: string): Promise<{ price: number; change24h: number; volume24h: number } | null> {
  const tokenInfo = await fetchOklinkTokenInfo(contract);
  if (tokenInfo && tokenInfo.price && tokenInfo.price > 0) {
    return {
      price: tokenInfo.price,
      change24h: tokenInfo.change24h || 0,
      volume24h: tokenInfo.volume24h || 0,
    };
  }
  return null;
}

export default {
  fetchOklinkAddressTokens,
  fetchOklinkContractInfo,
  fetchOklinkTxsForAddress,
  fetchOklinkTokenInfo,
  fetchOklinkLivePrice,
};
