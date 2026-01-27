import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { 
  DEFAULT_CHAIN, 
  FEATURED_CHAIN, 
  ALL_CHAINS_ID,
  SUPPORTED_CHAINS,
  getChainById,
  getChainByIndex,
  isXLayerChain,
  ChainConfig,
} from '@/lib/chains';

interface ChainContextType {
  // Current selected chain ID (e.g., 'xlayer', 'ethereum', 'all')
  selectedChain: string;
  // Set selected chain by ID
  setSelectedChain: (chainId: string) => void;
  // Current selected chain index for API calls (e.g., '196', '1')
  selectedChainIndex: string;
  // Set selected chain by index
  setSelectedChainByIndex: (index: string) => void;
  // Get current chain config (null if 'all' selected)
  currentChain: ChainConfig | null;
  // Check if X Layer is selected
  isXLayer: boolean;
  // Check if viewing all chains
  isAllChains: boolean;
  // Quick helper to check if a chain ID matches X Layer
  checkIsXLayer: (chainIdOrIndex: string) => boolean;
  // Get the featured chain config
  featuredChain: ChainConfig;
}

const ChainContext = createContext<ChainContextType | undefined>(undefined);

const STORAGE_KEY = 'defiXlama_selectedChain';

interface ChainProviderProps {
  children: ReactNode;
}

export function ChainProvider({ children }: ChainProviderProps) {
  // Initialize from localStorage or default to X Layer
  const [selectedChain, setSelectedChainState] = useState<string>(() => {
    if (typeof window === 'undefined') return DEFAULT_CHAIN;
    const stored = localStorage.getItem(STORAGE_KEY);
    // Validate stored value exists in supported chains
    if (stored && (stored === ALL_CHAINS_ID || SUPPORTED_CHAINS.some(c => c.id === stored))) {
      return stored;
    }
    return DEFAULT_CHAIN;
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, selectedChain);
  }, [selectedChain]);

  const setSelectedChain = useCallback((chainId: string) => {
    if (chainId === ALL_CHAINS_ID || SUPPORTED_CHAINS.some(c => c.id === chainId)) {
      setSelectedChainState(chainId);
    }
  }, []);

  const setSelectedChainByIndex = useCallback((index: string) => {
    const chain = getChainByIndex(index);
    if (chain) {
      setSelectedChainState(chain.id);
    }
  }, []);

  const currentChain = selectedChain === ALL_CHAINS_ID ? null : getChainById(selectedChain) || null;
  
  const selectedChainIndex = currentChain?.index || '196'; // Default to X Layer index for API calls

  const isXLayer = selectedChain === 'xlayer' || selectedChain === FEATURED_CHAIN;
  const isAllChains = selectedChain === ALL_CHAINS_ID;

  const checkIsXLayer = useCallback((chainIdOrIndex: string) => {
    return isXLayerChain(chainIdOrIndex);
  }, []);

  const featuredChain = SUPPORTED_CHAINS.find(c => c.id === FEATURED_CHAIN) || SUPPORTED_CHAINS[0];

  const value: ChainContextType = {
    selectedChain,
    setSelectedChain,
    selectedChainIndex,
    setSelectedChainByIndex,
    currentChain,
    isXLayer,
    isAllChains,
    checkIsXLayer,
    featuredChain,
  };

  return (
    <ChainContext.Provider value={value}>
      {children}
    </ChainContext.Provider>
  );
}

export function useChainContext() {
  const context = useContext(ChainContext);
  if (context === undefined) {
    throw new Error('useChainContext must be used within a ChainProvider');
  }
  return context;
}

// Optional hook that returns null if not in provider (for components that may be outside)
export function useOptionalChainContext() {
  return useContext(ChainContext);
}
