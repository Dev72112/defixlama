import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { Chain, SUPPORTED_CHAINS, ALL_CHAINS, getChainById, getFeaturedChain } from "@/lib/chains";

interface ChainContextType {
  selectedChain: Chain;
  setSelectedChain: (chain: Chain) => void;
  isAllChains: boolean;
  isXLayer: boolean;
  chains: Chain[];
  allChainsOption: Chain;
}

const ChainContext = createContext<ChainContextType | undefined>(undefined);

const STORAGE_KEY = "xlayer-selected-chain";

export function ChainProvider({ children }: { children: ReactNode }) {
  const [selectedChain, setSelectedChainState] = useState<Chain>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const chain = getChainById(stored);
        if (chain) return chain;
      }
    } catch (e) {}
    // Default to All Chains for new users
    return ALL_CHAINS;
  });

  const setSelectedChain = useCallback((chain: Chain) => {
    setSelectedChainState(chain);
    try {
      localStorage.setItem(STORAGE_KEY, chain.id);
    } catch (e) {}
  }, []);

  // Persist selection changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, selectedChain.id);
    } catch (e) {}
  }, [selectedChain]);

  const value: ChainContextType = {
    selectedChain,
    setSelectedChain,
    isAllChains: selectedChain.id === "all",
    isXLayer: selectedChain.id === "xlayer",
    chains: SUPPORTED_CHAINS,
    allChainsOption: ALL_CHAINS,
  };

  return (
    <ChainContext.Provider value={value}>
      {children}
    </ChainContext.Provider>
  );
}

export function useChain() {
  const context = useContext(ChainContext);
  if (context === undefined) {
    throw new Error("useChain must be used within a ChainProvider");
  }
  return context;
}

// Export the featured chain for spotlights
export { getFeaturedChain };
