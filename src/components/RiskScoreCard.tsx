import { useRiskMetrics, getRiskColor, getRiskBgColor, getRiskLabel } from '@/hooks/useRiskMetrics';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, BadgeCheck, AlertCircle, Shield, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface RiskScoreCardProps {
  protocolSlug: string;
  showDetailed?: boolean;
}

export function RiskScoreCard({ protocolSlug, showDetailed = true }: RiskScoreCardProps) {
  const { data: metrics, isLoading } = useRiskMetrics(protocolSlug);

  if (isLoading) {
    return (
      <Card className="p-4 border-border">
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className="p-4 border-border">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">Risk Assessment</p>
            <p className="text-xs text-muted-foreground mt-1">Data not available yet</p>
          </div>
        </div>
      </Card>
    );
  }

  const scoreColor = getRiskColor(metrics.overall_risk_score);
  const bgColor = getRiskBgColor(metrics.overall_risk_score);
  const riskLabel = getRiskLabel(metrics.overall_risk_score);

  return (
    <Card className={cn('p-4 border', bgColor)}>
      <div className="space-y-4">
        {/* Main Score */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
              Overall Risk Score
            </p>
            <div className="flex items-baseline gap-2">
              <span className={cn('text-3xl font-bold', scoreColor)}>
                {metrics.overall_risk_score}
              </span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
          </div>
          <Badge className={scoreColor}>{riskLabel}</Badge>
        </div>

        {showDetailed && (
          <>
            {/* Risk Breakdown */}
            <div className="pt-3 border-t border-border/50 space-y-2">
              {/* Audit Status */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Audit Status</span>
                </div>
                <div className="flex items-center gap-1">
                  {metrics.audit_status === 'passed' ? (
                    <span className="text-green-500 font-medium">Passed</span>
                  ) : metrics.audit_status === 'failed' ? (
                    <span className="text-red-500 font-medium">Failed</span>
                  ) : metrics.audit_status === 'pending' ? (
                    <span className="text-amber-500 font-medium">Pending</span>
                  ) : (
                    <span className="text-muted-foreground">None</span>
                  )}
                  {metrics.audit_firms && metrics.audit_firms.length > 0 && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({metrics.audit_firms.length})
                    </span>
                  )}
                </div>
              </div>

              {/* Hack History */}
              {metrics.hack_count > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-muted-foreground">Hack History</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-red-500">{metrics.hack_count} incident</span>
                    {metrics.last_hack_date && (
                      <p className="text-xs text-muted-foreground">
                        Last: {new Date(metrics.last_hack_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Governance Risk */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Governance Risk</span>
                </div>
                <span className="font-medium">
                  {metrics.governance_risk_score > 60
                    ? 'High'
                    : metrics.governance_risk_score > 30
                      ? 'Medium'
                      : 'Low'}
                </span>
              </div>

              {/* TVL Concentration */}
              {metrics.tvl_concentration_pct > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Top Asset Concentration</span>
                  <span className="font-mono font-medium">{metrics.tvl_concentration_pct.toFixed(1)}%</span>
                </div>
              )}

              {/* Contract Upgrade Risk */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Upgrade Risk</span>
                </div>
                <span className={cn('font-medium capitalize', {
                  'text-red-500': metrics.contract_upgrade_risk === 'high',
                  'text-amber-500': metrics.contract_upgrade_risk === 'medium',
                  'text-green-500': metrics.contract_upgrade_risk === 'low',
                })}>
                  {metrics.contract_upgrade_risk}
                </span>
              </div>
            </div>

            {/* Footer Note */}
            <div className="pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                ⓘ Risk scores combine multiple factors. Always do your own research.
              </p>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
