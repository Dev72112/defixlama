import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import { Chain, SUPPORTED_CHAINS, ALL_CHAINS, getChainById, getFeaturedChain } from "@/lib/chains";

interface ChainContextType {
  selectedChain: Chain;
  setSelectedChain: (chain: Chain) => void;
  isAllChains: boolean;
  isXLayer: boolean;
  chains: Chain[];
  allChainsOption: Chain;
  isChainSwitching: boolean;
  chainSwitchKey: number;
}

const ChainContext = createContext<ChainContextType | undefined>(undefined);

const STORAGE_KEY = "defixlama-selected-chain";
const LEGACY_KEY = "xlayer-selected-chain";

// Migrate legacy key
try {
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy && !localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, legacy);
    localStorage.removeItem(LEGACY_KEY);
  }
} catch {}

export function ChainProvider({ children }: { children: ReactNode }) {
  const [selectedChain, setSelectedChainState] = useState<Chain>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const chain = getChainById(stored);
        if (chain) return chain;
      }
    } catch (e) {}
    return ALL_CHAINS;
  });

  const [isChainSwitching, setIsChainSwitching] = useState(false);
  const [chainSwitchKey, setChainSwitchKey] = useState(0);
  const switchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const setSelectedChain = useCallback((chain: Chain) => {
    if (chain.id === selectedChain.id) return;
    
    // Start transition
    setIsChainSwitching(true);
    setSelectedChainState(chain);
    setChainSwitchKey((k) => k + 1);
    
    try {
      localStorage.setItem(STORAGE_KEY, chain.id);
    } catch (e) {}

    // End transition after data has time to refetch
    if (switchTimeoutRef.current) clearTimeout(switchTimeoutRef.current);
    switchTimeoutRef.current = setTimeout(() => {
      setIsChainSwitching(false);
    }, 400);
  }, [selectedChain.id]);

  useEffect(() => {
    return () => {
      if (switchTimeoutRef.current) clearTimeout(switchTimeoutRef.current);
    };
  }, []);

  const value: ChainContextType = {
    selectedChain,
    setSelectedChain,
    isAllChains: selectedChain.id === "all",
    isXLayer: selectedChain.id === "xlayer",
    chains: SUPPORTED_CHAINS,
    allChainsOption: ALL_CHAINS,
    isChainSwitching,
    chainSwitchKey,
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

export { getFeaturedChain };
