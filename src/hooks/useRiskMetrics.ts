import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RiskMetrics {
  id: string;
  protocol_name: string;
  protocol_slug: string;
  chain: string;
  overall_risk_score: number;
  hack_count: number;
  hack_total_lost_usd: number;
  last_hack_date: string | null;
  audit_status: string;
  audit_firms: string[];
  governance_risk_score: number;
  governance_concentration_pct: number;
  dependency_count: number;
  contract_upgrade_risk: string;
  tvl_concentration_pct: number;
  created_at: string;
  updated_at: string;
}

export function useRiskMetrics(protocolSlug: string) {
  return useQuery({
    queryKey: ['risk-metrics', protocolSlug],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('protocol_risk_metrics' as any)
        .select('*')
        .eq('protocol_slug', protocolSlug)
        .single() as any);

      if (error) {
        console.warn(`No risk metrics found for ${protocolSlug}:`, error);
        return null;
      }

      return data as RiskMetrics;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useAllRiskMetrics(chain?: string) {
  return useQuery({
    queryKey: ['all-risk-metrics', chain],
    queryFn: async () => {
      let query: any = supabase.from('protocol_risk_metrics' as any).select('*');

      if (chain && chain !== 'all') {
        query = query.eq('chain', chain);
      }

      const { data, error } = await query.order('overall_risk_score', { ascending: false });

      if (error) throw error;
      return data as RiskMetrics[];
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

// Get risk score color
export function getRiskColor(score: number): string {
  if (score >= 70) return 'text-red-500'; // Critical
  if (score >= 50) return 'text-orange-500'; // High
  if (score >= 30) return 'text-amber-500'; // Medium
  return 'text-green-500'; // Low
}

export function getRiskBgColor(score: number): string {
  if (score >= 70) return 'bg-red-500/10 border-red-500/30';
  if (score >= 50) return 'bg-orange-500/10 border-orange-500/30';
  if (score >= 30) return 'bg-amber-500/10 border-amber-500/30';
  return 'bg-green-500/10 border-green-500/30';
}

export function getRiskLabel(score: number): string {
  if (score >= 70) return 'Critical Risk';
  if (score >= 50) return 'High Risk';
  if (score >= 30) return 'Medium Risk';
  return 'Low Risk';
}

// Breakdown: calc composite score from components
export function calculateCompositeRiskScore(metrics: Partial<RiskMetrics>): number {
  const weights = {
    hack: 0.25,
    audit: 0.20,
    governance: 0.20,
    dependency: 0.15,
    contractUpgrade: 0.10,
    tvlConcentration: 0.10,
  };

  let score = 0;

  // Hack risk: 0 hacks = 0, scale up to 100
  if (metrics.hack_count && metrics.hack_count > 0) {
    score += Math.min(100, metrics.hack_count * 15) * weights.hack;
  }

  // Audit risk
  if (metrics.audit_status) {
    const auditMap: Record<string, number> = {
      none: 60,
      pending: 50,
      passed: 10,
      failed: 100,
    };
    score += (auditMap[metrics.audit_status] || 0) * weights.audit;
  }

  // Governance risk (0-100 already)
  if (metrics.governance_risk_score) {
    score += metrics.governance_risk_score * weights.governance;
  } else if (metrics.governance_concentration_pct) {
    // If only concentration is available, use that
    const govRisk = Math.min(100, metrics.governance_concentration_pct * 1.5);
    score += govRisk * weights.governance;
  }

  // Dependency risk: count -> score
  if (metrics.dependency_count && metrics.dependency_count > 0) {
    score += Math.min(100, metrics.dependency_count * 10) * weights.dependency;
  }

  // Contract upgrade risk
  if (metrics.contract_upgrade_risk) {
    const upgradeMap: Record<string, number> = {
      low: 10,
      medium: 40,
      high: 80,
    };
    score += (upgradeMap[metrics.contract_upgrade_risk] || 0) * weights.contractUpgrade;
  }

  // TVL concentration
  if (metrics.tvl_concentration_pct) {
    score += Math.min(100, metrics.tvl_concentration_pct * 0.8) * weights.tvlConcentration;
  }

  return Math.round(Math.min(100, score));
}
