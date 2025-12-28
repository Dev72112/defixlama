import { useQuery } from "@tanstack/react-query";
import {
  fetchXLayerProtocols,
  fetchXLayerTVL,
  fetchChainTVLHistory,
  fetchXLayerDexVolumes,
  fetchXLayerYieldPools,
  fetchProtocols,
  fetchChainsTVL,
  fetchDexVolumes,
  fetchStablecoins,
  fetchFeesData,
  fetchProtocolTVLHistory,
  fetchProtocolDetails,
  fetchDexDetails,
  Protocol,
  ChainTVL,
  ChainData,
  DexVolume,
  YieldPool,
  Stablecoin,
} from "@/lib/api/defillama";

// 5 second refresh for live data feel
const LIVE_REFRESH = 5 * 1000;
const STANDARD_REFRESH = 30 * 1000;

// Hook to fetch XLayer protocols
export function useXLayerProtocols() {
  return useQuery<Protocol[]>({
    queryKey: ["xlayer-protocols"],
    queryFn: async () => {
      const data = await fetchXLayerProtocols();
      return Array.isArray(data) ? data : [];
    },
    staleTime: LIVE_REFRESH,
    refetchInterval: LIVE_REFRESH,
  });
}

// Hook to fetch all protocols
export function useAllProtocols() {
  return useQuery<Protocol[]>({
    queryKey: ["all-protocols"],
    queryFn: async () => {
      const data = await fetchProtocols();
      return Array.isArray(data) ? data : [];
    },
    staleTime: STANDARD_REFRESH,
    refetchInterval: STANDARD_REFRESH,
  });
}

// Hook to fetch XLayer TVL
export function useXLayerTVL() {
  return useQuery<ChainData | null>({
    queryKey: ["xlayer-tvl"],
    queryFn: fetchXLayerTVL,
    staleTime: LIVE_REFRESH,
    refetchInterval: LIVE_REFRESH,
  });
}

// Hook to fetch all chains TVL
export function useChainsTVL() {
  return useQuery<ChainData[]>({
    queryKey: ["chains-tvl"],
    queryFn: async () => {
      const data = await fetchChainsTVL();
      return Array.isArray(data) ? data : [];
    },
    staleTime: LIVE_REFRESH,
    refetchInterval: LIVE_REFRESH,
  });
}

// Hook to fetch top 10 chains by TVL
export function useTop10Chains() {
  return useQuery<ChainData[]>({
    queryKey: ["top-10-chains"],
    queryFn: async () => {
      const data = await fetchChainsTVL();
      if (!Array.isArray(data)) return [];
      // Sort by TVL descending and return top 10
      return data.sort((a, b) => (b.tvl || 0) - (a.tvl || 0)).slice(0, 10);
    },
    staleTime: LIVE_REFRESH,
    refetchInterval: LIVE_REFRESH,
  });
}

// Hook to fetch XLayer TVL history
export function useXLayerTVLHistory() {
  return useQuery<ChainTVL[]>({
    queryKey: ["xlayer-tvl-history"],
    queryFn: async () => {
      // Use "X Layer" (with space) as that's the correct chain name in DefiLlama
      const data = await fetchChainTVLHistory("X Layer");
      return Array.isArray(data) ? data : [];
    },
    staleTime: LIVE_REFRESH,
    refetchInterval: LIVE_REFRESH,
  });
}

// Hook to fetch XLayer DEX volumes
export function useXLayerDexVolumes() {
  return useQuery<DexVolume[]>({
    queryKey: ["xlayer-dex-volumes"],
    queryFn: async () => {
      const data = await fetchXLayerDexVolumes();
      return Array.isArray(data) ? data : [];
    },
    staleTime: LIVE_REFRESH,
    refetchInterval: LIVE_REFRESH,
  });
}

// Hook to fetch all DEX volumes
export function useAllDexVolumes() {
  return useQuery<DexVolume[]>({
    queryKey: ["all-dex-volumes"],
    queryFn: async () => {
      const data = await fetchDexVolumes();
      return Array.isArray(data) ? data : [];
    },
    staleTime: LIVE_REFRESH,
    refetchInterval: LIVE_REFRESH,
  });
}

// Hook to fetch XLayer yield pools
export function useXLayerYieldPools() {
  return useQuery<YieldPool[]>({
    queryKey: ["xlayer-yield-pools"],
    queryFn: async () => {
      const data = await fetchXLayerYieldPools();
      return Array.isArray(data) ? data : [];
    },
    staleTime: LIVE_REFRESH,
    refetchInterval: LIVE_REFRESH,
  });
}

// Hook to fetch stablecoins
export function useStablecoins() {
  return useQuery<Stablecoin[]>({
    queryKey: ["stablecoins"],
    queryFn: async () => {
      const data = await fetchStablecoins();
      return Array.isArray(data) ? data : [];
    },
    staleTime: LIVE_REFRESH,
    refetchInterval: LIVE_REFRESH,
  });
}

// Hook to fetch fees data
export function useFeesData() {
  return useQuery<any[]>({
    queryKey: ["fees-data"],
    queryFn: async () => {
      const data = await fetchFeesData();
      return Array.isArray(data) ? data : [];
    },
    staleTime: LIVE_REFRESH,
    refetchInterval: LIVE_REFRESH,
  });
}

// Hook to fetch protocol TVL history for detail pages
export function useProtocolTVLHistory(slug: string | null) {
  return useQuery({
    queryKey: ["protocol-tvl-history", slug],
    queryFn: async () => {
      if (!slug) return [];
      const data = await fetchProtocolTVLHistory(slug);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 min stale
    refetchInterval: false, // Disable auto-refetch on detail pages to prevent crashes
  });
}

// Hook to fetch full protocol details
export function useProtocolDetails(slug: string | null) {
  return useQuery({
    queryKey: ["protocol-details", slug],
    queryFn: async () => {
      if (!slug) return null;
      const data = await fetchProtocolDetails(slug);
      return data || null;
    },
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 min stale
    refetchInterval: false, // Disable auto-refetch on detail pages to prevent crashes
  });
}

// Hook to fetch full DEX details
export function useDexDetails(name: string | null) {
  return useQuery({
    queryKey: ["dex-details", name],
    queryFn: async () => {
      if (!name) return null;
      const data = await fetchDexDetails(name);
      return data || null;
    },
    enabled: !!name,
    staleTime: 10 * 60 * 1000, // 10 min stale
    refetchInterval: false, // Disable auto-refetch on detail pages to prevent crashes
  });
}

// Generic chain TVL history hook for any chain name
export function useChainTVLHistory(chain: string | null) {
  return useQuery<ChainTVL[]>({
    queryKey: ["chain-tvl-history", chain],
    queryFn: async () => {
      if (!chain) return [];
      const data = await fetchChainTVLHistory(chain);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!chain,
    staleTime: STANDARD_REFRESH,
    refetchInterval: STANDARD_REFRESH,
  });
}

// Combined hook for dashboard overview
export function useDashboardData() {
  const protocols = useXLayerProtocols();
  const tvl = useXLayerTVL();
  const tvlHistory = useXLayerTVLHistory();
  const dexVolumes = useXLayerDexVolumes();
  const yieldPools = useXLayerYieldPools();

  return {
    protocols,
    tvl,
    tvlHistory,
    dexVolumes,
    yieldPools,
    isLoading:
      protocols.isLoading ||
      tvl.isLoading ||
      tvlHistory.isLoading ||
      dexVolumes.isLoading ||
      yieldPools.isLoading,
    isError:
      protocols.isError ||
      tvl.isError ||
      tvlHistory.isError ||
      dexVolumes.isError ||
      yieldPools.isError,
  };
}
