import { useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useChain } from '@/contexts/ChainContext';
import { usePredictions } from '@/hooks/usePredictions';
import { formatCurrency } from '@/lib/api/defillama';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Sparkles, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const PROTOCOLS = [
  { slug: 'aave', name: 'Aave', color: 'hsl(142, 76%, 46%)' },
  { slug: 'curve', name: 'Curve', color: 'hsl(45, 100%, 50%)' },
  { slug: 'lido', name: 'Lido', color: 'hsl(280, 80%, 60%)' },
  { slug: 'yearn', name: 'Yearn', color: 'hsl(180, 80%, 45%)' },
  { slug: 'balancer', name: 'Balancer', color: 'hsl(30, 90%, 55%)' },
];

export default function Predictions() {
  const { selectedChain } = useChain();

  // Fetch predictions for all protocols
  const predictionsQueries = PROTOCOLS.map((p) => usePredictions(p.slug));
  const isLoading = predictionsQueries.some((q) => q.isLoading);
  const allPredictions = predictionsQueries.flatMap((q) => q.data ?? []);

  // Prepare data for charts
  const tvlChartData = useMemo(() => {
    if (allPredictions.length === 0) return [];

    const grouped = new Map<string, Record<string, number>>();
    for (const pred of allPredictions) {
      if (!grouped.has(pred.prediction_date)) {
        grouped.set(pred.prediction_date, {});
      }
      const dateData = grouped.get(pred.prediction_date)!;
      dateData[pred.protocol_slug] = (pred.predicted_tvl ?? 0) / 1000000000; // Convert to billions
    }

    return Array.from(grouped.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({
        date,
        ...data,
      }));
  }, [allPredictions]);

  const apyChartData = useMemo(() => {
    if (allPredictions.length === 0) return [];

    const grouped = new Map<string, Record<string, number>>();
    for (const pred of allPredictions) {
      if (!grouped.has(pred.prediction_date)) {
        grouped.set(pred.prediction_date, {});
      }
      const dateData = grouped.get(pred.prediction_date)!;
      dateData[pred.protocol_slug] = pred.predicted_apy ?? 0;
    }

    return Array.from(grouped.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({
        date,
        ...data,
      }));
  }, [allPredictions]);

  // Protocol predictions table
  const protocolPredictions = useMemo(() => {
    const predictions: Record<string, any> = {};
    for (const pred of allPredictions) {
      if (!predictions[pred.protocol_slug]) {
        predictions[pred.protocol_slug] = {
          protocol: PROTOCOLS.find((p) => p.slug === pred.protocol_slug),
          predictions: [],
        };
      }
      predictions[pred.protocol_slug].predictions.push(pred);
    }
    return predictions;
  }, [allPredictions]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading predictions...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 page-enter">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-gradient-primary">Protocol Predictions</h1>
            <p className="text-muted-foreground text-sm mt-1">
              AI-powered forecasts for TVL and yield trends
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <Card className="p-4 border-primary/30 bg-primary/5 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">How Predictions Work</p>
            <p className="text-xs text-muted-foreground mt-1">
              We use ensemble models (linear regression + market sentiment) to forecast 30, 60, and 90-day trends.
              Confidence decreases with time horizon. Always validate with current on-chain data.
            </p>
          </div>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* TVL Forecast */}
          <Card className="p-4 border-border">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              TVL Forecast (Billions)
            </h3>
            {tvlChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={tvlChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => `$${(value as number).toFixed(2)}B`}
                  />
                  <Legend />
                  {PROTOCOLS.map((p) => (
                    <Line key={p.slug} type="monotone" dataKey={p.slug} stroke={p.color} strokeWidth={2} isAnimationActive={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground">No data</p>
              </div>
            )}
          </Card>

          {/* APY Forecast */}
          <Card className="p-4 border-border">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Yield Forecast (%)
            </h3>
            {apyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={apyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => `${(value as number).toFixed(2)}%`}
                  />
                  <Legend />
                  {PROTOCOLS.map((p) => (
                    <Bar key={p.slug} dataKey={p.slug} stackId="apy" fill={p.color} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground">No data</p>
              </div>
            )}
          </Card>
        </div>

        {/* Protocol Predictions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Protocol Forecasts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PROTOCOLS.map((protocol) => {
              const protoPred = protocolPredictions[protocol.slug];
              if (!protoPred) return null;

              const sortedPreds = protoPred.predictions.sort(
                (a: any, b: any) => new Date(a.prediction_date).getTime() - new Date(b.prediction_date).getTime()
              );

              return (
                <Card key={protocol.slug} className="p-4 border-border">
                  <h3 className="font-semibold text-foreground mb-3">{protocol.name}</h3>
                  <div className="space-y-2">
                    {sortedPreds.map((pred) => {
                      const daysAhead = Math.round(
                        (new Date(pred.prediction_date).getTime() - Date.now()) / 86400000
                      );

                      return (
                        <div key={pred.id} className="p-3 bg-muted/50 rounded border border-border/50">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                {daysAhead} days ahead ({pred.prediction_date})
                              </p>
                              <p className="text-sm font-semibold text-foreground mt-1">
                                TVL: {pred.predicted_tvl ? formatCurrency(pred.predicted_tvl) : '—'}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs',
                                pred.confidence_score > 80
                                  ? 'bg-green-500/10 text-green-600'
                                  : pred.confidence_score > 70
                                    ? 'bg-amber-500/10 text-amber-600'
                                    : 'bg-orange-500/10 text-orange-600'
                              )}
                            >
                              {pred.confidence_score}%
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Yield:</span>
                            <span className="font-mono font-semibold">
                              {pred.predicted_apy ? `${pred.predicted_apy.toFixed(2)}%` : '—'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Footer Note */}
        <Card className="p-4 border-border bg-card/50">
          <p className="text-xs text-muted-foreground">
            <strong>Disclaimer:</strong> These predictions are generated using statistical models and should not be considered
            investment advice. Always conduct your own research and verify data on-chain before making decisions.
          </p>
        </Card>
      </div>
    </Layout>
  );
}
