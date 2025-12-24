import { useQuery } from "@tanstack/react-query";

export const DONATION_ADDRESS = "0xde0bcf388d7b1604a2ba30c06ea2fe6e8f4d3662";

// Token contracts on XLayer
const TOKEN_CONTRACTS = {
  OKB: "0x0000000000000000000000000000000000000000", // Native token
  USDT: "0x1e4a5963abfd975d8c9021ce480b42188849d41d",
  USDG: "0x9e8d1c7a9b7e5d4f7f8a9c1e2b3d4a5f6e7c8b9a",
};

export interface DonationTransaction {
  address: string;
  fullAddress: string;
  amount: number;
  token: string;
  timestamp: number;
  txHash: string;
}

export interface DonationStats {
  totalDonations: number;
  donorCount: number;
  growthRate: number;
}

export interface LeaderboardEntry {
  address: string;
  fullAddress: string;
  totalAmount: number;
  donationCount: number;
  lastDonation: number;
  badge: "whale" | "supporter" | "contributor";
}

async function fetchAllDonations(): Promise<DonationTransaction[]> {
  const donations: DonationTransaction[] = [];
  
  try {
    const endpoints = [
      `https://www.okx.com/api/explorer/v1/xlayer/address/${DONATION_ADDRESS}/token-transfers`,
      `https://www.oklink.com/api/explorer/v1/xlayer/address/${DONATION_ADDRESS}/token-transfers`,
    ];
    
    for (const url of endpoints) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const data = await res.json();
        
        if (data?.data?.list || data?.result) {
          const list = data.data?.list || data.result || [];
          
          for (const tx of list) {
            if (tx.to?.toLowerCase() === DONATION_ADDRESS.toLowerCase()) {
              const tokenSymbol = tx.tokenSymbol || tx.symbol || "Unknown";
              
              if (["OKB", "USDT", "USDG"].includes(tokenSymbol.toUpperCase())) {
                donations.push({
                  address: `${tx.from?.slice(0, 6)}...${tx.from?.slice(-4)}`,
                  fullAddress: tx.from || "",
                  amount: parseFloat(tx.value || tx.amount || "0") / Math.pow(10, tx.decimals || 18),
                  token: tokenSymbol.toUpperCase(),
                  timestamp: (tx.timestamp || tx.blockTime || Date.now() / 1000) * 1000,
                  txHash: tx.hash || tx.txHash || "",
                });
              }
            }
          }
          
          if (donations.length > 0) break;
        }
      } catch (e) {
        console.log("Endpoint failed, trying next...", e);
      }
    }
    
    // Fetch native OKB transfers
    try {
      const nativeRes = await fetch(
        `https://www.okx.com/api/explorer/v1/xlayer/address/${DONATION_ADDRESS}/transactions`
      );
      if (nativeRes.ok) {
        const nativeData = await nativeRes.json();
        const txList = nativeData?.data?.list || nativeData?.result || [];
        
        for (const tx of txList) {
          if (tx.to?.toLowerCase() === DONATION_ADDRESS.toLowerCase() && parseFloat(tx.value || "0") > 0) {
            donations.push({
              address: `${tx.from?.slice(0, 6)}...${tx.from?.slice(-4)}`,
              fullAddress: tx.from || "",
              amount: parseFloat(tx.value) / 1e18,
              token: "OKB",
              timestamp: (tx.timestamp || tx.blockTime || Date.now() / 1000) * 1000,
              txHash: tx.hash || tx.txHash || "",
            });
          }
        }
      }
    } catch (e) {
      console.log("Native transfer fetch failed", e);
    }
    
  } catch (error) {
    console.error("Failed to fetch donation transactions:", error);
  }
  
  return donations.sort((a, b) => b.timestamp - a.timestamp);
}

function calculateStats(donations: DonationTransaction[]): DonationStats {
  const uniqueDonors = new Set(donations.map(d => d.fullAddress.toLowerCase()));
  const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
  
  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;
  
  const thisWeek = donations.filter(d => d.timestamp > oneWeekAgo);
  const lastWeek = donations.filter(d => d.timestamp > twoWeeksAgo && d.timestamp <= oneWeekAgo);
  
  const thisWeekTotal = thisWeek.reduce((sum, d) => sum + d.amount, 0);
  const lastWeekTotal = lastWeek.reduce((sum, d) => sum + d.amount, 0);
  
  const growthRate = lastWeekTotal > 0 
    ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100)
    : 0;
  
  return {
    totalDonations: totalAmount,
    donorCount: uniqueDonors.size,
    growthRate,
  };
}

function calculateLeaderboard(donations: DonationTransaction[]): LeaderboardEntry[] {
  const donorMap = new Map<string, { total: number; count: number; lastDonation: number }>();
  
  for (const donation of donations) {
    const addr = donation.fullAddress.toLowerCase();
    const existing = donorMap.get(addr) || { total: 0, count: 0, lastDonation: 0 };
    existing.total += donation.amount;
    existing.count += 1;
    existing.lastDonation = Math.max(existing.lastDonation, donation.timestamp);
    donorMap.set(addr, existing);
  }
  
  const leaderboard: LeaderboardEntry[] = [];
  
  for (const [fullAddress, data] of donorMap.entries()) {
    let badge: "whale" | "supporter" | "contributor" = "contributor";
    if (data.total >= 1000) badge = "whale";
    else if (data.total >= 100) badge = "supporter";
    
    leaderboard.push({
      address: `${fullAddress.slice(0, 6)}...${fullAddress.slice(-4)}`,
      fullAddress,
      totalAmount: data.total,
      donationCount: data.count,
      lastDonation: data.lastDonation,
      badge,
    });
  }
  
  return leaderboard.sort((a, b) => b.totalAmount - a.totalAmount);
}

export function useDonations() {
  return useQuery({
    queryKey: ["donations", DONATION_ADDRESS],
    queryFn: fetchAllDonations,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000, // Poll every minute for real-time updates
  });
}

export function useRecentDonations(limit: number = 10) {
  const { data: donations = [], ...rest } = useDonations();
  return {
    ...rest,
    data: donations.slice(0, limit),
  };
}

export function useDonationStats() {
  const { data: donations = [], ...rest } = useDonations();
  return {
    ...rest,
    data: calculateStats(donations),
  };
}

export function useDonationLeaderboard() {
  const { data: donations = [], ...rest } = useDonations();
  return {
    ...rest,
    data: calculateLeaderboard(donations),
  };
}

// Generate explorer link for a transaction
export function getExplorerTxLink(txHash: string): string {
  return `https://www.okx.com/explorer/xlayer/tx/${txHash}`;
}

export function getExplorerAddressLink(address: string): string {
  return `https://www.okx.com/explorer/xlayer/address/${address}`;
}
