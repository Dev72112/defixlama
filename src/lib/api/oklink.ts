// OKLink API helper for XLayer token data
// Uses OKX Explorer public endpoints for live token data

const OKLINK_BASE = "https://www.oklink.com/api";
const OKX_EXPLORER_BASE = "https://www.okx.com/api/v5/explorer";

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
}

async function tryFetch(url: string, options?: RequestInit) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

// Fetch token info from OKX Explorer for XLayer
export async function fetchOklinkTokenInfo(contract: string): Promise<OklinkTokenInfo | null> {
  const enc = encodeURIComponent(contract);
  
  // Try multiple OKX Explorer endpoints for XLayer (chainShortName: xlayer or xlayer-testnet)
  const endpoints = [
    `${OKX_EXPLORER_BASE}/xlayer/api?module=token&action=tokeninfo&contractaddress=${enc}`,
    `https://www.okx.com/explorer/xlayer/api/v1/token/${enc}`,
    `https://www.okx.com/api/explorer/v1/xlayer/address/${enc}/tokenInfo`,
  ];

  for (const url of endpoints) {
    const data = await tryFetch(url);
    if (data?.result || data?.data) {
      const info = data.result || data.data;
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
  }
  
  return null;
}

export async function fetchOklinkAddressTokens(address: string) {
  const enc = encodeURIComponent(address);
  const endpoints = [
    `${OKLINK_BASE}/explorer/v1/address/${enc}/token`,
    `${OKLINK_BASE}/explorer/v1/token/address/${enc}`,
    `https://www.okx.com/api/explorer/v1/xlayer/address/${enc}/token-balance`,
  ];

  for (const url of endpoints) {
    const data = await tryFetch(url);
    if (data) return data;
  }
  return null;
}

export async function fetchOklinkContractInfo(address: string): Promise<OklinkTokenInfo | null> {
  const enc = encodeURIComponent(address);
  
  // Try dedicated token info first
  const tokenInfo = await fetchOklinkTokenInfo(address);
  if (tokenInfo) return tokenInfo;
  
  // Fallback to contract endpoints
  const endpoints = [
    `${OKLINK_BASE}/explorer/v1/contract/${enc}`,
    `${OKLINK_BASE}/open/v1/contract/${enc}`,
    `https://www.okx.com/api/explorer/v1/xlayer/contract/${enc}`,
  ];
  
  for (const url of endpoints) {
    const data = await tryFetch(url);
    if (data?.result || data?.data) {
      const info = data.result || data.data;
      return {
        symbol: info.symbol,
        name: info.name || info.contractName,
        logo: info.logo,
        contractName: info.contractName,
        description: info.description,
        totalSupply: info.totalSupply,
        holders: info.holders,
      };
    }
  }
  return null;
}

export async function fetchOklinkTxsForAddress(address: string, page = 1, size = 10) {
  const enc = encodeURIComponent(address);
  const endpoints = [
    `${OKLINK_BASE}/explorer/v1/address/${enc}/txs?page=${page}&size=${size}`,
    `https://www.okx.com/api/explorer/v1/xlayer/address/${enc}/transactions?page=${page}&limit=${size}`,
  ];
  
  for (const url of endpoints) {
    const data = await tryFetch(url);
    if (data) return data;
  }
  return null;
}

// Fetch live price from OKX for XLayer tokens
export async function fetchOklinkLivePrice(contract: string): Promise<{ price: number; change24h: number; volume24h: number } | null> {
  const tokenInfo = await fetchOklinkTokenInfo(contract);
  if (tokenInfo && tokenInfo.price) {
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
