// Centralized chain configuration for multi-chain support

export interface ChainConfig {
  id: string;
  name: string;
  index: string;
  shortName: string;
  featured: boolean;
  type: 'L1' | 'L2' | 'sidechain';
  explorer: string;
  color: string;
  logo?: string;
}

export const SUPPORTED_CHAINS: ChainConfig[] = [
  { 
    id: 'xlayer', 
    name: 'X Layer', 
    index: '196', 
    shortName: 'XLayer',
    featured: true, 
    type: 'L2',
    explorer: 'https://www.okx.com/explorer/xlayer',
    color: 'hsl(var(--primary))',
  },
  { 
    id: 'ethereum', 
    name: 'Ethereum', 
    index: '1', 
    shortName: 'ETH',
    featured: false, 
    type: 'L1',
    explorer: 'https://etherscan.io',
    color: '#627EEA',
  },
  { 
    id: 'bsc', 
    name: 'BNB Smart Chain', 
    index: '56', 
    shortName: 'BSC',
    featured: false, 
    type: 'L1',
    explorer: 'https://bscscan.com',
    color: '#F0B90B',
  },
  { 
    id: 'polygon', 
    name: 'Polygon', 
    index: '137', 
    shortName: 'MATIC',
    featured: false, 
    type: 'L2',
    explorer: 'https://polygonscan.com',
    color: '#8247E5',
  },
  { 
    id: 'arbitrum', 
    name: 'Arbitrum One', 
    index: '42161', 
    shortName: 'ARB',
    featured: false, 
    type: 'L2',
    explorer: 'https://arbiscan.io',
    color: '#28A0F0',
  },
  { 
    id: 'optimism', 
    name: 'Optimism', 
    index: '10', 
    shortName: 'OP',
    featured: false, 
    type: 'L2',
    explorer: 'https://optimistic.etherscan.io',
    color: '#FF0420',
  },
  { 
    id: 'base', 
    name: 'Base', 
    index: '8453', 
    shortName: 'BASE',
    featured: false, 
    type: 'L2',
    explorer: 'https://basescan.org',
    color: '#0052FF',
  },
  { 
    id: 'avalanche', 
    name: 'Avalanche C-Chain', 
    index: '43114', 
    shortName: 'AVAX',
    featured: false, 
    type: 'L1',
    explorer: 'https://snowtrace.io',
    color: '#E84142',
  },
  { 
    id: 'solana', 
    name: 'Solana', 
    index: '501', 
    shortName: 'SOL',
    featured: false, 
    type: 'L1',
    explorer: 'https://solscan.io',
    color: '#00FFA3',
  },
  { 
    id: 'zksync', 
    name: 'zkSync Era', 
    index: '324', 
    shortName: 'zkSync',
    featured: false, 
    type: 'L2',
    explorer: 'https://explorer.zksync.io',
    color: '#8C8DFC',
  },
  { 
    id: 'linea', 
    name: 'Linea', 
    index: '59144', 
    shortName: 'LINEA',
    featured: false, 
    type: 'L2',
    explorer: 'https://lineascan.build',
    color: '#121212',
  },
  { 
    id: 'scroll', 
    name: 'Scroll', 
    index: '534352', 
    shortName: 'SCROLL',
    featured: false, 
    type: 'L2',
    explorer: 'https://scrollscan.com',
    color: '#FFEEDA',
  },
  { 
    id: 'blast', 
    name: 'Blast', 
    index: '81457', 
    shortName: 'BLAST',
    featured: false, 
    type: 'L2',
    explorer: 'https://blastscan.io',
    color: '#FCFC03',
  },
  { 
    id: 'fantom', 
    name: 'Fantom', 
    index: '250', 
    shortName: 'FTM',
    featured: false, 
    type: 'L1',
    explorer: 'https://ftmscan.com',
    color: '#1969FF',
  },
];

export const DEFAULT_CHAIN = 'xlayer';
export const FEATURED_CHAIN = 'xlayer';
export const ALL_CHAINS_ID = 'all';

// Helper functions
export function getChainById(id: string): ChainConfig | undefined {
  return SUPPORTED_CHAINS.find(c => c.id === id);
}

export function getChainByIndex(index: string): ChainConfig | undefined {
  return SUPPORTED_CHAINS.find(c => c.index === index);
}

export function getChainExplorerUrl(chainId: string, address: string, type: 'address' | 'tx' = 'address'): string {
  const chain = getChainById(chainId);
  if (!chain) return '';
  return `${chain.explorer}/${type}/${address}`;
}

export function getChainExplorerUrlByIndex(index: string, address: string, type: 'address' | 'tx' = 'address'): string {
  const chain = getChainByIndex(index);
  if (!chain) return '';
  return `${chain.explorer}/${type}/${address}`;
}

export function isXLayerChain(chainIdOrIndex: string): boolean {
  return chainIdOrIndex === 'xlayer' || chainIdOrIndex === '196';
}

export function getFeaturedChain(): ChainConfig {
  return SUPPORTED_CHAINS.find(c => c.featured) || SUPPORTED_CHAINS[0];
}

// Get chains grouped by type
export function getChainsByType() {
  const l1 = SUPPORTED_CHAINS.filter(c => c.type === 'L1');
  const l2 = SUPPORTED_CHAINS.filter(c => c.type === 'L2');
  const sidechains = SUPPORTED_CHAINS.filter(c => c.type === 'sidechain');
  return { l1, l2, sidechains };
}

// DefiLlama chain name mapping (some differ from our IDs)
export const DEFILLAMA_CHAIN_NAMES: Record<string, string> = {
  xlayer: 'X Layer',
  ethereum: 'Ethereum',
  bsc: 'BSC',
  polygon: 'Polygon',
  arbitrum: 'Arbitrum',
  optimism: 'Optimism',
  base: 'Base',
  avalanche: 'Avalanche',
  solana: 'Solana',
  zksync: 'zkSync Era',
  linea: 'Linea',
  scroll: 'Scroll',
  blast: 'Blast',
  fantom: 'Fantom',
};

export function getDefiLlamaChainName(chainId: string): string {
  return DEFILLAMA_CHAIN_NAMES[chainId] || chainId;
}
