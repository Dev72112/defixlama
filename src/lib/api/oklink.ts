// Minimal OKLink API helper (best-effort, uses public endpoints where possible)
const OKLINK_BASE = "https://www.oklink.com/api";

async function tryFetch(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function fetchOklinkAddressTokens(address: string) {
  // Try a couple of plausible endpoints; OKLink docs: https://www.oklink.com/docs/en/#developer-tools
  const enc = encodeURIComponent(address);
  const endpoints = [
    `${OKLINK_BASE}/explorer/v1/address/${enc}/token`,
    `${OKLINK_BASE}/explorer/v1/token/address/${enc}`,
  ];

  for (const url of endpoints) {
    const data = await tryFetch(url);
    if (data) return data;
  }
  return null;
}

export async function fetchOklinkContractInfo(address: string) {
  const enc = encodeURIComponent(address);
  const endpoints = [
    `${OKLINK_BASE}/explorer/v1/contract/${enc}`,
    `${OKLINK_BASE}/open/v1/contract/${enc}`,
  ];
  for (const url of endpoints) {
    const data = await tryFetch(url);
    if (data) return data;
  }
  return null;
}

export async function fetchOklinkTxsForAddress(address: string, page = 1, size = 10) {
  const enc = encodeURIComponent(address);
  const url = `${OKLINK_BASE}/explorer/v1/address/${enc}/txs?page=${page}&size=${size}`;
  return await tryFetch(url);
}

export default {
  fetchOklinkAddressTokens,
  fetchOklinkContractInfo,
  fetchOklinkTxsForAddress,
};
