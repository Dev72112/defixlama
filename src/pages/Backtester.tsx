import { useState, useMemo, useEffect, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useBacktesting } from '@/hooks/useBacktesting';
import { useChain } from '@/contexts/ChainContext';
import { useChainProtocols } from '@/hooks/useDefiData';
import { useAuth } from '@/hooks/useAuth';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { canAccessFeature } from '@/lib/subscriptionHelper';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, LineChart, Line } from 'recharts';
import { Plus, Trash2, TrendingUp, Calendar, DollarSign, Zap, Target, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { BacktestConfig } from '@/lib/backtesting/engine';

export default function Backtester() {
  const { runBacktest, saveBacktest, deleteBacktest, lastResults, isRunning, isSaving } = useBacktesting();
  const { selectedChain } = useChain();
  const { subscription_tier } = useAuth();
  const protocolsData = useChainProtocols(selectedChain?.id || 'all');

  // Check if user can access backtester
  if (!canAccessFeature(subscription_tier, 'backtester')) {
    return (
      <Layout>
        <UpgradePrompt
          feature="Yield Farming Backtester"
          currentTier={subscription_tier}
          requiredTier="pro"
          description="Simulate and optimize your yield farming strategies with our advanced backtesting engine. Available in Pro and Enterprise plans."
        />
      </Layout>
    );
  }

  // Convert API protocols to usable format
  const protocolsList = useMemo(() => {
    if (!protocolsData?.data) return [];
    return protocolsData.data.map((p: any) => ({
      slug: p.slug || p.id,
      name: p.name,
      baseAPY: p.apy || p.tvlPct || Math.random() * 10, // Fallback APY estimation
    })).filter((p: any) => p.slug && p.name).slice(0, 50); // Limit to top 50 for UI performance
  }, [protocolsData?.data]);

  // Show top protocols by default
  const defaultProtocols = useMemo(() => {
    const defaults: Record<string, number> = {};
    protocolsList.slice(0, 5).forEach((p) => {
      defaults[p.slug] = 20; // Equal distribution among top 5
    });
    return defaults;
  }, [protocolsList]);

  // Form state
  const [selectedProtocols, setSelectedProtocols] = useState<Record<string, number>>({});

  // Initialize with default protocols when data loads
  useEffect(() => {
    if (defaultProtocols && Object.keys(defaultProtocols).length > 0 && Object.keys(selectedProtocols).length === 0) {
      setSelectedProtocols(defaultProtocols);
    }
  }, [defaultProtocols]);
  const [startDate, setStartDate] = useState('2025-08-22');
  const [endDate, setEndDate] = useState('2026-02-22');
  const [initialCapital, setInitialCapital] = useState('10000');
  const [strategyName, setStrategyName] = useState('');

  const handleProtocolWeightChange = (slug: string, weight: number) => {
    setSelectedProtocols((prev) => ({
      ...prev,
      [slug]: weight,
    }));
  };

  // Auto-calculate backtest when inputs change (debounced)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Only auto-run if at least one protocol has weight > 0
    const hasProtocols = Object.values(selectedProtocols).some((weight) => weight > 0);
    if (!hasProtocols || isRunning) {
      return;
    }

    // Set debounced auto-run (300ms delay while user is adjusting sliders)
    debounceTimerRef.current = setTimeout(() => {
      const protocolsArray = Object.entries(selectedProtocols)
        .filter(([, weight]) => weight > 0)
        .map(([slug, weight]) => ({ slug, weight }));

      const config: BacktestConfig = {
        protocols: protocolsArray,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        initialCapital: parseFloat(initialCapital),
      };

      runBacktest({
        name: 'Backtest',
        config,
      });
    }, 300);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [selectedProtocols, startDate, endDate, initialCapital, isRunning, runBacktest]);

  const handleSaveBacktest = () => {
    if (!lastResults || !strategyName.trim()) {
      alert('Run a backtest and enter a strategy name');
      return;
    }

    saveBacktest({
      name: strategyName,
      description: `Multi-protocol yield farming strategy`,
      results: lastResults,
    });

    setStrategyName('');
  };

  const totalWeight = Object.values(selectedProtocols).reduce((a, b) => a + b, 0);

  // Colors for metrics
  const returnColor = (lastResults?.returnsPercent ?? 0) > 0 ? 'text-green-500' : 'text-red-500';
  const sharpeColor = (lastResults?.sharpeRatio ?? 0) > 1 ? 'text-green-500' : 'text-amber-500';
  const drawdownColor = (lastResults?.maxDrawdown ?? 0) > -20 ? 'text-green-500' : 'text-red-500';

  return (
    <Layout>
      <div className="space-y-6 page-enter">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Target className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-gradient-primary">Yield Farming Backtester</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Simulate historical yield farming strategies and optimize returns
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Strategy Builder */}
          <Card className="lg:col-span-1 p-4 border-border space-y-4">
            <h3 className="font-semibold text-foreground">Strategy Builder</h3>

            {/* Date Range */}
            <div className="space-y-2">
              <Label className="text-sm">Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Initial Capital */}
            <div className="space-y-2">
              <Label className="text-sm">Initial Capital ($)</Label>
              <Input
                type="number"
                value={initialCapital}
                onChange={(e) => setInitialCapital(e.target.value)}
                placeholder="10000"
                min="100"
              />
            </div>

            {/* Protocol Weights */}
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-foreground">Protocol Allocation</p>
                <span className="text-xs text-muted-foreground">{protocolsList.length} available</span>
              </div>
              {protocolsList.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4">Loading protocols...</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {protocolsList.map((protocol) => (
                    <div key={protocol.slug}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-muted-foreground">{protocol.name}</label>
                        <span className="text-xs font-mono font-semibold">{selectedProtocols[protocol.slug] ?? 0}%</span>
                      </div>
                      <div className="flex gap-1">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={selectedProtocols[protocol.slug] ?? 0}
                          onChange={(e) => handleProtocolWeightChange(protocol.slug, parseFloat(e.target.value))}
                          className="flex-1 h-2 rounded-lg bg-muted"
                        />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={selectedProtocols[protocol.slug] ?? 0}
                          onChange={(e) => handleProtocolWeightChange(protocol.slug, parseFloat(e.target.value))}
                          className="w-12 px-2 py-1 text-xs rounded border border-border text-center"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-2 bg-muted rounded">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total Weight</span>
                  <span className={cn('font-semibold', totalWeight === 100 ? 'text-green-500' : 'text-amber-500')}>
                    {totalWeight}%
                  </span>
                </div>
              </div>
            </div>

            {/* Run Button */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Results update automatically as you adjust parameters</p>
              <Button
                onClick={() => {
                  // Manual refresh button for users who want to force a recalculation
                  const protocolsArray = Object.entries(selectedProtocols)
                    .filter(([, weight]) => weight > 0)
                    .map(([slug, weight]) => ({ slug, weight }));

                  if (protocolsArray.length === 0) {
                    alert('Select at least one protocol');
                    return;
                  }

                  const config: BacktestConfig = {
                    protocols: protocolsArray,
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                    initialCapital: parseFloat(initialCapital),
                  };

                  runBacktest({
                    name: 'Backtest',
                    config,
                  });
                }}
                disabled={isRunning || totalWeight === 0}
                variant="outline"
                className="w-full"
              >
                {isRunning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isRunning ? 'Calculating...' : 'Refresh Results'}
              </Button>
            </div>
          </Card>

          {/* Results */}
          <div className="lg:col-span-2 space-y-4">
            {lastResults ? (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-4 border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Final Value</p>
                    <p className={cn('text-2xl font-bold', returnColor)}>
                      ${lastResults.finalValue.toFixed(0)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Initial: ${lastResults.initialValue.toFixed(0)}</p>
                  </Card>

                  <Card className="p-4 border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Return</p>
                    <p className={cn('text-2xl font-bold', returnColor)}>
                      {lastResults.returnsPercent > 0 ? '+' : ''}{lastResults.returnsPercent.toFixed(2)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{lastResults.totalDays} days</p>
                  </Card>

                  <Card className="p-4 border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Sharpe Ratio</p>
                    <p className={cn('text-2xl font-bold', sharpeColor)}>
                      {lastResults.sharpeRatio.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Risk-adjusted return</p>
                  </Card>

                  <Card className="p-4 border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Max Drawdown</p>
                    <p className={cn('text-2xl font-bold', drawdownColor)}>
                      {lastResults.maxDrawdown.toFixed(2)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Worst peak-to-trough</p>
                  </Card>
                </div>

                {/* Save Strategy */}
                <Card className="p-4 border-primary/30 bg-primary/5">
                  <p className="text-sm font-semibold text-foreground mb-3">Save Strategy</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Strategy name (e.g., Conservative Yield Mix)"
                      value={strategyName}
                      onChange={(e) => setStrategyName(e.target.value)}
                    />
                    <Button onClick={handleSaveBacktest} disabled={isSaving || !strategyName.trim()} size="sm">
                      {isSaving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                      Save
                    </Button>
                  </div>
                </Card>

                {/* NAV Chart */}
                <Card className="p-4 border-border">
                  <p className="text-sm font-semibold text-foreground mb-3">Portfolio Value Over Time</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={lastResults.daily}>
                      <defs>
                        <linearGradient id="colorNav" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(280, 80%, 60%)" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="hsl(280, 80%, 60%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        interval={Math.floor(lastResults.daily.length / 5)}
                      />
                      <YAxis
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        label={{ value: 'Portfolio Value ($)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value) => `$${(value as number).toFixed(0)}`}
                      />
                      <Area type="monotone" dataKey="totalValue" stroke="hsl(280, 80%, 60%)" fillOpacity={1} fill="url(#colorNav)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>

                {/* Daily Returns Chart */}
                <Card className="p-4 border-border">
                  <p className="text-sm font-semibold text-foreground mb-3">Daily Returns</p>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={lastResults.daily}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        interval={Math.floor(lastResults.daily.length / 5)}
                      />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value) => `${(value as number).toFixed(3)}%`}
                      />
                      <Bar
                        dataKey="dayChangePercent"
                        fill="hsl(280, 80%, 60%)"
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </>
            ) : (
              <Card className="p-12 border-dashed text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">Build a strategy and click "Run Backtest" to see results</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
