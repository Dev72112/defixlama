// Chain configuration for multi-chain support
// All chains compatible with DefiLlama API

export interface Chain {
  id: string;
  name: string;
  slug: string; // DefiLlama chain identifier
  icon: string; // Emoji or icon identifier
  color: string; // HSL color for chain theming
  chainId?: number; // EVM chain ID if applicable
  isFeatured?: boolean; // X Layer is featured
}

export const SUPPORTED_CHAINS: Chain[] = [
  {
    id: "xlayer",
    name: "X Layer",
    slug: "X Layer",
    icon: "🔴",
    color: "348 83% 47%", // Crimson
    chainId: 196,
    isFeatured: true,
  },
  {
    id: "ethereum",
    name: "Ethereum",
    slug: "Ethereum",
    icon: "⟠",
    color: "230 60% 50%",
    chainId: 1,
  },
  {
    id: "arbitrum",
    name: "Arbitrum",
    slug: "Arbitrum",
    icon: "🔵",
    color: "210 80% 55%",
    chainId: 42161,
  },
  {
    id: "optimism",
    name: "Optimism",
    slug: "Optimism",
    icon: "🔴",
    color: "0 70% 55%",
    chainId: 10,
  },
  {
    id: "base",
    name: "Base",
    slug: "Base",
    icon: "🔵",
    color: "220 70% 50%",
    chainId: 8453,
  },
  {
    id: "polygon",
    name: "Polygon",
    slug: "Polygon",
    icon: "🟣",
    color: "270 70% 55%",
    chainId: 137,
  },
  {
    id: "avalanche",
    name: "Avalanche",
    slug: "Avalanche",
    icon: "🔺",
    color: "0 75% 50%",
    chainId: 43114,
  },
  {
    id: "bsc",
    name: "BNB Chain",
    slug: "BSC",
    icon: "🟡",
    color: "45 90% 50%",
    chainId: 56,
  },
  {
    id: "solana",
    name: "Solana",
    slug: "Solana",
    icon: "◎",
    color: "280 80% 60%",
  },
  {
    id: "sui",
    name: "Sui",
    slug: "Sui",
    icon: "💧",
    color: "200 80% 55%",
  },
  {
    id: "fantom",
    name: "Fantom",
    slug: "Fantom",
    icon: "👻",
    color: "220 70% 50%",
    chainId: 250,
  },
  {
    id: "zksync",
    name: "zkSync Era",
    slug: "zkSync Era",
    icon: "⚡",
    color: "260 70% 55%",
    chainId: 324,
  },
  {
    id: "linea",
    name: "Linea",
    slug: "Linea",
    icon: "📊",
    color: "0 0% 20%",
    chainId: 59144,
  },
  {
    id: "scroll",
    name: "Scroll",
    slug: "Scroll",
    icon: "📜",
    color: "35 80% 55%",
    chainId: 534352,
  },
];

// Special "All Chains" option
export const ALL_CHAINS: Chain = {
  id: "all",
  name: "All Chains",
  slug: "all",
  icon: "🌐",
  color: "142 90% 50%", // Neon green
};

// Helper functions
export function getChainById(id: string): Chain | undefined {
  if (id === "all") return ALL_CHAINS;
  return SUPPORTED_CHAINS.find((c) => c.id === id);
}

export function getChainBySlug(slug: string): Chain | undefined {
  if (slug === "all") return ALL_CHAINS;
  return SUPPORTED_CHAINS.find((c) => c.slug.toLowerCase() === slug.toLowerCase());
}

export function getFeaturedChain(): Chain {
  return SUPPORTED_CHAINS.find((c) => c.isFeatured) || SUPPORTED_CHAINS[0];
}

export function isXLayer(chain: Chain | null): boolean {
  return chain?.id === "xlayer";
}

export function isAllChains(chain: Chain | null): boolean {
  return chain?.id === "all";
}
