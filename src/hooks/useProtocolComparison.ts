import { useQuery } from '@tanstack/react-query';

export interface ProtocolComparison {
  slug: string;
  name: string;
  tvl: number;
  fee: number;
  audit_status: 'audited' | 'partial' | 'none';
  hack_count: number;
  apy: number;
  governance: boolean;
  liquidity_efficiency: number; // TVL / total_fees
  risk_score: number;
  market_share: number; // % of category
}

const PROTOCOL_DATA: ProtocolComparison[] = [
  {
    slug: 'aave',
    name: 'Aave',
    tvl: 12500000000,
    fee: 0.09,
    audit_status: 'audited',
    hack_count: 0,
    apy: 8.2,
    governance: true,
    liquidity_efficiency: 138888,
    risk_score: 15,
    market_share: 35,
  },
  {
    slug: 'curve',
    name: 'Curve Finance',
    tvl: 8200000000,
    fee: 0.04,
    audit_status: 'audited',
    hack_count: 1,
    apy: 12.5,
    governance: true,
    liquidity_efficiency: 205000,
    risk_score: 22,
    market_share: 28,
  },
  {
    slug: 'lido',
    name: 'Lido',
    tvl: 35000000000,
    fee: 0.1,
    audit_status: 'audited',
    hack_count: 0,
    apy: 3.5,
    governance: true,
    liquidity_efficiency: 350000,
    risk_score: 18,
    market_share: 52,
  },
  {
    slug: 'yearn',
    name: 'Yearn Finance',
    tvl: 6800000000,
    fee: 0.2,
    audit_status: 'audited',
    hack_count: 1,
    apy: 15.3,
    governance: true,
    liquidity_efficiency: 34000,
    risk_score: 25,
    market_share: 22,
  },
  {
    slug: 'balancer',
    name: 'Balancer',
    tvl: 3200000000,
    fee: 0.3,
    audit_status: 'partial',
    hack_count: 2,
    apy: 18.9,
    governance: true,
    liquidity_efficiency: 10666,
    risk_score: 38,
    market_share: 12,
  },
  {
    slug: 'compound',
    name: 'Compound',
    tvl: 4500000000,
    fee: 0.08,
    audit_status: 'audited',
    hack_count: 0,
    apy: 6.2,
    governance: true,
    liquidity_efficiency: 56250,
    risk_score: 20,
    market_share: 18,
  },
];

export function useProtocolComparison() {
  return useQuery({
    queryKey: ['protocol-comparison'],
    queryFn: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));
      return PROTOCOL_DATA;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useProtocolCategory(category: string) {
  return useQuery({
    queryKey: ['protocol-category', category],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const categories: Record<string, string[]> = {
        lending: ['aave', 'compound'],
        dex: ['curve', 'balancer'],
        'liquid-staking': ['lido'],
        yield: ['yearn'],
      };
      return PROTOCOL_DATA.filter((p) => categories[category]?.includes(p.slug) || false);
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function compareMetrics(
  protocol: ProtocolComparison,
  others: ProtocolComparison[]
): {
  tvl_percentile: number;
  apy_percentile: number;
  efficiency_percentile: number;
  risk_percentile: number;
  audit_advantage: boolean;
} {
  const allProtocols = [protocol, ...others];

  const tvlSorted = allProtocols.sort((a, b) => b.tvl - a.tvl);
  const apySorted = allProtocols.sort((a, b) => b.apy - a.apy);
  const effSorted = allProtocols.sort((a, b) => b.liquidity_efficiency - a.liquidity_efficiency);
  const riskSorted = allProtocols.sort((a, b) => a.risk_score - b.risk_score); // Lower is better

  return {
    tvl_percentile: Math.round(((tvlSorted.length - tvlSorted.indexOf(protocol)) / tvlSorted.length) * 100),
    apy_percentile: Math.round(((apySorted.length - apySorted.indexOf(protocol)) / apySorted.length) * 100),
    efficiency_percentile: Math.round(
      ((effSorted.length - effSorted.indexOf(protocol)) / effSorted.length) * 100
    ),
    risk_percentile: Math.round(((riskSorted.length - riskSorted.indexOf(protocol)) / riskSorted.length) * 100),
    audit_advantage: protocol.audit_status === 'audited',
  };
}
