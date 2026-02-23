import { useMemo, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useChain } from '@/contexts/ChainContext';
import { useAuth } from '@/hooks/useAuth';
import { useAllRiskMetrics, getRiskColor, getRiskBgColor, getRiskLabel } from '@/hooks/useRiskMetrics';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { canAccessFeature } from '@/lib/subscriptionHelper';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Shield, AlertTriangle, TrendingDown, ArrowUpRight, Search, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ScatterChart, Scatter, Legend } from 'recharts';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const CHART_COLORS = [
  'hsl(0, 70%, 55%)', // red for critical
  'hsl(30, 90%, 55%)', // orange for high
  'hsl(45, 100%, 50%)', // yellow for medium
  'hsl(142, 76%, 46%)', // green for low
];

export default function RiskDashboard() {
  const { selectedChain } = useChain();
  const { subscription_tier } = useAuth();
  const { data: allMetrics, isLoading } = useAllRiskMetrics(selectedChain.id === 'all' ? undefined : selectedChain.id);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'risk' | 'hacks' | 'governance'>('risk');

  // Check if user can access risk dashboard
  if (!canAccessFeature(subscription_tier, 'risk_dashboard')) {
    return (
      <Layout>
        <UpgradePrompt
          feature="Risk Dashboard"
          currentTier={subscription_tier}
          requiredTier="pro"
          description="Monitor protocol risks, audit histories, governance concentration, and more. Available in Pro and Enterprise plans."
        />
      </Layout>
    );
  }

  const filteredMetrics = useMemo(() => {
    if (!allMetrics) return [];

    let filtered = allMetrics.filter(
      (m) =>
        m.protocol_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.protocol_slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'risk':
          return b.overall_risk_score - a.overall_risk_score;
        case 'hacks':
          return (b.hack_count || 0) - (a.hack_count || 0);
        case 'governance':
          return (b.governance_risk_score || 0) - (a.governance_risk_score || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [allMetrics, searchTerm, sortBy]);

  // Risk distribution chart data
  const riskDistribution = useMemo(() => {
    if (!filteredMetrics.length) return [];

    const critical = filteredMetrics.filter((m) => m.overall_risk_score >= 70).length;
    const high = filteredMetrics.filter((m) => m.overall_risk_score >= 50 && m.overall_risk_score < 70).length;
    const medium = filteredMetrics.filter((m) => m.overall_risk_score >= 30 && m.overall_risk_score < 50).length;
    const low = filteredMetrics.filter((m) => m.overall_risk_score < 30).length;

    return [
      { name: 'Critical', value: critical, fill: CHART_COLORS[0] },
      { name: 'High', value: high, fill: CHART_COLORS[1] },
      { name: 'Medium', value: medium, fill: CHART_COLORS[2] },
      { name: 'Low', value: low, fill: CHART_COLORS[3] },
    ];
  }, [filteredMetrics]);

  // Top risks scatter data
  const scatterData = useMemo(() => {
    return (filteredMetrics || []).slice(0, 30).map((m) => ({
      name: m.protocol_name,
      risk: m.overall_risk_score,
      hacks: m.hack_count || 0,
    }));
  }, [filteredMetrics]);

  // KPIs
  const kpis = useMemo(() => {
    if (!filteredMetrics.length) return null;

    const avgRisk = filteredMetrics.reduce((sum, m) => sum + m.overall_risk_score, 0) / filteredMetrics.length;
    const hackCount = filteredMetrics.reduce((sum, m) => sum + (m.hack_count || 0), 0);
    const auditedCount = filteredMetrics.filter((m) => m.audit_status === 'passed').length;

    return {
      avgRisk: avgRisk.toFixed(1),
      hackCount,
      auditedCount,
      percentAudited: ((auditedCount / filteredMetrics.length) * 100).toFixed(1),
    };
  }, [filteredMetrics]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 page-enter">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-gradient-primary">Risk Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Comprehensive risk analysis across protocols {selectedChain.id !== 'all' && `on ${selectedChain.name}`}
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        {kpis && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-4 border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Average Risk</p>
              <p className="text-2xl font-bold text-primary">{kpis.avgRisk}</p>
              <p className="text-xs text-muted-foreground mt-2">/ 100</p>
            </Card>
            <Card className="p-4 border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Hacks</p>
              <p className="text-2xl font-bold text-red-500">{kpis.hackCount}</p>
              <p className="text-xs text-muted-foreground mt-2">incidents</p>
            </Card>
            <Card className="p-4 border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Audited</p>
              <p className="text-2xl font-bold text-green-500">{kpis.auditedCount}</p>
              <p className="text-xs text-muted-foreground mt-2">{kpis.percentAudited}% passed</p>
            </Card>
            <Card className="p-4 border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Protocols</p>
              <p className="text-2xl font-bold text-primary">{filteredMetrics.length}</p>
              <p className="text-xs text-muted-foreground mt-2">analyzed</p>
            </Card>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Risk Distribution */}
          <Card className="p-4 border-border">
            <p className="text-sm font-semibold text-foreground mb-4">Risk Level Distribution</p>
            {riskDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={riskDistribution}>
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {riskDistribution.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground">No data available</p>
              </div>
            )}
          </Card>

          {/* Risk vs Hack History */}
          <Card className="p-4 border-border">
            <p className="text-sm font-semibold text-foreground mb-4">Risk vs Hack History</p>
            {scatterData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <XAxis
                    type="number"
                    dataKey="risk"
                    name="Risk Score"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    domain={[0, 100]}
                  />
                  <YAxis
                    type="number"
                    dataKey="hacks"
                    name="Hack Incidents"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => value && Math.round(value as number)}
                  />
                  <Scatter name="Protocols" data={scatterData} fill="hsl(280, 80%, 60%)" />
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground">No data available</p>
              </div>
            )}
          </Card>
        </div>

        {/* Search & Filter */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search protocols..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-md border border-border bg-card text-sm"
            >
              <option value="risk">Sort by Risk</option>
              <option value="hacks">Sort by Hacks</option>
              <option value="governance">Sort by Governance</option>
            </select>
          </div>
        </div>

        {/* Protocol List */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Protocol Risk Analysis</h2>
          <div className="space-y-2">
            {filteredMetrics.length > 0 ? (
              filteredMetrics.map((metric) => (
                <Card key={metric.id} className="p-4 border-border hover:bg-card/80 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground">{metric.protocol_name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {metric.chain}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Audit</span>
                          <p className="font-medium capitalize">
                            {metric.audit_status === 'passed' ? (
                              <span className="text-green-500">Passed</span>
                            ) : metric.audit_status === 'failed' ? (
                              <span className="text-red-500">Failed</span>
                            ) : (
                              metric.audit_status
                            )}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Hacks</span>
                          <p className="font-medium">{metric.hack_count || 0}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Governance Risk</span>
                          <p className="font-medium">
                            {metric.governance_risk_score > 60
                              ? 'High'
                              : metric.governance_risk_score > 30
                                ? 'Medium'
                                : 'Low'}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Upgrade Risk</span>
                          <p className={cn('font-medium capitalize', {
                            'text-red-500': metric.contract_upgrade_risk === 'high',
                            'text-amber-500': metric.contract_upgrade_risk === 'medium',
                            'text-green-500': metric.contract_upgrade_risk === 'low',
                          })}>
                            {metric.contract_upgrade_risk}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-center">
                        <div className={cn('text-3xl font-bold', getRiskColor(metric.overall_risk_score))}>
                          {metric.overall_risk_score}
                        </div>
                        <Badge className={`mt-2 ${getRiskBgColor(metric.overall_risk_score)}`}>
                          {getRiskLabel(metric.overall_risk_score)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 border-border text-center">
                <p className="text-muted-foreground">No protocols found</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
