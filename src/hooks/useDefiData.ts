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
  Protocol,
  ChainTVL,
  ChainData,
  DexVolume,
  YieldPool,
  Stablecoin,
} from "@/lib/api/defillama";

// Hook to fetch XLayer protocols
export function useXLayerProtocols() {
  return useQuery<Protocol[]>({
    queryKey: ["xlayer-protocols"],
    queryFn: fetchXLayerProtocols,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000,
  });
}

// Hook to fetch all protocols
export function useAllProtocols() {
  return useQuery<Protocol[]>({
    queryKey: ["all-protocols"],
    queryFn: fetchProtocols,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

// Hook to fetch XLayer TVL
export function useXLayerTVL() {
  return useQuery<ChainData | null>({
    queryKey: ["xlayer-tvl"],
    queryFn: fetchXLayerTVL,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });
}

// Hook to fetch all chains TVL
export function useChainsTVL() {
  return useQuery<ChainData[]>({
    queryKey: ["chains-tvl"],
    queryFn: fetchChainsTVL,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });
}

// Hook to fetch XLayer TVL history
export function useXLayerTVLHistory() {
  return useQuery<ChainTVL[]>({
    queryKey: ["xlayer-tvl-history"],
    queryFn: () => fetchChainTVLHistory("xlayer"),
    staleTime: 10 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}

// Hook to fetch XLayer DEX volumes
export function useXLayerDexVolumes() {
  return useQuery<DexVolume[]>({
    queryKey: ["xlayer-dex-volumes"],
    queryFn: fetchXLayerDexVolumes,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

// Hook to fetch all DEX volumes
export function useAllDexVolumes() {
  return useQuery<DexVolume[]>({
    queryKey: ["all-dex-volumes"],
    queryFn: fetchDexVolumes,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

// Hook to fetch XLayer yield pools
export function useXLayerYieldPools() {
  return useQuery<YieldPool[]>({
    queryKey: ["xlayer-yield-pools"],
    queryFn: fetchXLayerYieldPools,
    staleTime: 10 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}

// Hook to fetch stablecoins
export function useStablecoins() {
  return useQuery<Stablecoin[]>({
    queryKey: ["stablecoins"],
    queryFn: fetchStablecoins,
    staleTime: 10 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}

// Hook to fetch fees data
export function useFeesData() {
  return useQuery<any[]>({
    queryKey: ["fees-data"],
    queryFn: fetchFeesData,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
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
