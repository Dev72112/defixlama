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
  const endpoints = [
    `${OKLINK_BASE}/explorer/v1/address/${address}/token`,
    `${OKLINK_BASE}/explorer/v1/token/address/${address}`,
  ];

  for (const url of endpoints) {
    const data = await tryFetch(url);
    if (data) return data;
  }
  return null;
}

export async function fetchOklinkContractInfo(address: string) {
  const endpoints = [
    `${OKLINK_BASE}/explorer/v1/contract/${address}`,
    `${OKLINK_BASE}/open/v1/contract/${address}`,
  ];
  for (const url of endpoints) {
    const data = await tryFetch(url);
    if (data) return data;
  }
  return null;
}

export async function fetchOklinkTxsForAddress(address: string, page = 1, size = 10) {
  const url = `${OKLINK_BASE}/explorer/v1/address/${address}/txs?page=${page}&size=${size}`;
  return await tryFetch(url);
}

export default {
  fetchOklinkAddressTokens,
  fetchOklinkContractInfo,
  fetchOklinkTxsForAddress,
};
