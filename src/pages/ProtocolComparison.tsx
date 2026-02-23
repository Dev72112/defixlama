import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useProtocolComparison, compareMetrics } from '@/hooks/useProtocolComparison';
import { formatCurrency, formatPercentage } from '@/lib/api/defillama';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Legend as RechartLegend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  TrendingUp,
  Zap,
  Shield,
  GitCompare,
  Search,
  Filter,
  Download,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProtocolComparison() {
  const { data: protocols, isLoading } = useProtocolComparison();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProtocols, setSelectedProtocols] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'tvl' | 'apy' | 'risk' | 'efficiency'>('tvl');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'lending' | 'dex' | 'yield' | 'staking'>('all');

  const categoryMap: Record<string, string[]> = {
    lending: ['aave', 'compound'],
    dex: ['curve', 'balancer'],
    yield: ['yearn'],
    staking: ['lido'],
  };

  const filteredProtocols = useMemo(() => {
    let result = protocols || [];

    // Filter by search
    if (searchTerm) {
      result = result.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      const categoryProtocols = categoryMap[categoryFilter] || [];
      result = result.filter((p) => categoryProtocols.includes(p.slug));
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'tvl':
          return b.tvl - a.tvl;
        case 'apy':
          return b.apy - a.apy;
        case 'risk':
          return a.risk_score - b.risk_score;
        case 'efficiency':
          return b.liquidity_efficiency - a.liquidity_efficiency;
        default:
          return 0;
      }
    });

    return result;
  }, [protocols, searchTerm, categoryFilter, sortBy]);

  const selectedData = useMemo(() => {
    if (!protocols || selectedProtocols.length === 0) return [];
    return protocols.filter((p) => selectedProtocols.includes(p.slug));
  }, [protocols, selectedProtocols]);

  const radarData = useMemo(() => {
    if (selectedData.length === 0 || !protocols) return [];

    const metrics = ['TVL', 'APY', 'Efficiency', 'Safety', 'Market Share'];
    return metrics.map((metric) => {
      const dataPoint: any = { metric };
      selectedData.forEach((p) => {
        const percentiles = compareMetrics(p, protocols.filter((x) => x.slug !== p.slug));
        switch (metric) {
          case 'TVL':
            dataPoint[p.name] = percentiles.tvl_percentile;
            break;
          case 'APY':
            dataPoint[p.name] = percentiles.apy_percentile;
            break;
          case 'Efficiency':
            dataPoint[p.name] = percentiles.efficiency_percentile;
            break;
          case 'Safety':
            dataPoint[p.name] = percentiles.risk_percentile;
            break;
          case 'Market Share':
            dataPoint[p.name] = p.market_share;
            break;
        }
      });
      return dataPoint;
    });
  }, [selectedData, protocols]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading protocols...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 page-enter">
        {/* Header */}
        <div className="flex items-center gap-3">
          <GitCompare className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-gradient-primary">Protocol Intelligence</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Compare protocols side-by-side: TVL, yields, risk metrics, and market efficiency
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4 border-border bg-card/50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-2">Search</label>
              <input
                type="text"
                placeholder="Search protocols..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded bg-background text-foreground text-sm placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-2">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-border rounded bg-background text-foreground text-sm"
              >
                <option value="all">All Categories</option>
                <option value="lending">Lending</option>
                <option value="dex">DEX</option>
                <option value="yield">Yield</option>
                <option value="staking">Staking</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-border rounded bg-background text-foreground text-sm"
              >
                <option value="tvl">TVL</option>
                <option value="apy">APY</option>
                <option value="risk">Safety</option>
                <option value="efficiency">Efficiency</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => setSelectedProtocols([])}
                variant="outline"
                className="w-full"
                size="sm"
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </Card>

        {/* Radar Chart - Only show when protocols are selected */}
        {selectedData.length > 0 && radarData.length > 0 && (
          <Card className="p-4 border-border">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Protocol Comparison Radar
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <PolarRadiusAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                {selectedData.map((p, i) => (
                  <Radar
                    key={p.slug}
                    name={p.name}
                    dataKey={p.name}
                    stroke={['hsl(142, 76%, 46%)', 'hsl(45, 100%, 50%)', 'hsl(280, 80%, 60%)', 'hsl(180, 80%, 45%)'][i]}
                    fill={['hsl(142, 76%, 46%)', 'hsl(45, 100%, 50%)', 'hsl(280, 80%, 60%)', 'hsl(180, 80%, 45%)'][i]}
                    fillOpacity={0.25}
                  />
                ))}
                <RechartLegend />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Protocol List */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">All Protocols</h2>
          <div className="grid grid-cols-1 gap-3">
            {filteredProtocols.map((protocol) => {
              const isSelected = selectedProtocols.includes(protocol.slug);
              const comparison = protocols ? compareMetrics(protocol, protocols.filter((p) => p.slug !== protocol.slug)) : null;

              return (
                <Card
                  key={protocol.slug}
                  className={cn(
                    'p-4 border-border cursor-pointer transition-all',
                    isSelected && 'ring-2 ring-primary bg-primary/5'
                  )}
                  onClick={() => {
                    setSelectedProtocols((prev) =>
                      prev.includes(protocol.slug)
                        ? prev.filter((s) => s !== protocol.slug)
                        : [...prev, protocol.slug]
                    );
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                    {/* Name & Audit */}
                    <div className="col-span-1 md:col-span-1">
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            setSelectedProtocols((prev) =>
                              prev.includes(protocol.slug)
                                ? prev.filter((s) => s !== protocol.slug)
                                : [...prev, protocol.slug]
                            );
                          }}
                          className="mt-1"
                        />
                        <div>
                          <p className="font-semibold text-foreground">{protocol.name}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {protocol.audit_status === 'audited' ? (
                              <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Audited
                              </Badge>
                            ) : protocol.audit_status === 'partial' ? (
                              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Partial
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-600">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Not Audited
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* TVL & Market Share */}
                    <div>
                      <p className="text-xs text-muted-foreground">TVL</p>
                      <p className="font-mono font-semibold text-foreground">{formatCurrency(protocol.tvl, 0)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{protocol.market_share}% share</p>
                    </div>

                    {/* APY */}
                    <div>
                      <p className="text-xs text-muted-foreground">Current APY</p>
                      <p className="font-mono font-semibold text-green-600">{protocol.apy.toFixed(2)}%</p>
                      {comparison && <p className="text-xs text-amber-600">Top {comparison.apy_percentile}%</p>}
                    </div>

                    {/* Efficiency */}
                    <div>
                      <p className="text-xs text-muted-foreground">Efficiency</p>
                      <p className="font-mono font-semibold text-foreground">{(protocol.liquidity_efficiency / 1000).toFixed(1)}k</p>
                      {comparison && <p className="text-xs text-blue-600">Top {comparison.efficiency_percentile}%</p>}
                    </div>

                    {/* Risk */}
                    <div>
                      <p className="text-xs text-muted-foreground">Risk Score</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full',
                                protocol.risk_score < 25
                                  ? 'bg-green-500'
                                  : protocol.risk_score < 50
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                              )}
                              style={{ width: `${Math.min(protocol.risk_score * 2, 100)}%` }}
                            />
                          </div>
                        </div>
                        <span className="font-mono text-sm font-semibold">{protocol.risk_score}</span>
                      </div>
                    </div>

                    {/* Hacks */}
                    <div>
                      <p className="text-xs text-muted-foreground">Historical Hacks</p>
                      <p className="font-mono font-semibold text-foreground">{protocol.hack_count}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {protocol.hack_count === 0 ? 'Clean record' : 'Has incidents'}
                      </p>
                    </div>

                    {/* Fee */}
                    <div>
                      <p className="text-xs text-muted-foreground">Fee</p>
                      <p className="font-mono font-semibold text-foreground">{(protocol.fee * 100).toFixed(2)}%</p>
                      <p className="text-xs text-muted-foreground mt-1">Protocol fee</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <Card className="p-4 border-border bg-card/50">
          <p className="text-xs text-muted-foreground">
            <strong>Selection Tip:</strong> Select 2-4 protocols above to compare them in the radar chart. The chart shows
            percentile rankings for each metric (higher is better). Efficiency = TVL / Annual Fees. Risk = Weighted score
            including hack history, audit status, and governance concentration.
          </p>
        </Card>
      </div>
    </Layout>
  );
}
