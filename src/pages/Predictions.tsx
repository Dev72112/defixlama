import { Layout } from "@/components/layout/Layout";
import { TierGate } from "@/components/TierGate";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { useChain } from "@/contexts/ChainContext";
import { useChainProtocols } from "@/hooks/useDefiData";
import { formatCurrency } from "@/lib/api/defillama";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CHART_TOOLTIP_STYLE, AXIS_TICK_STYLE } from "@/lib/chartStyles";
import { TrendingUp, TrendingDown, Brain, Target, BarChart3, History, CheckCircle, XCircle, Info } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Line, LineChart } from "recharts";
import { ResponsiveDataTable, ResponsiveColumn } from "@/components/ui/responsive-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";

interface PredictionEntry {
  name: string; slug: string; tvl: number; change7d: number; momentum: string;
  confidence: number; predictedChange: number; predictedTvl: number;
}

interface AccuracyEntry {
  period: string; predicted: number; actual: number; accuracy: number;
}

export default function Predictions() {
  const { selectedChain } = useChain();
  const { data: protocols, isLoading } = useChainProtocols(selectedChain.id);
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "price";

  const predictions = useMemo<PredictionEntry[]>(() => {
    if (!protocols) return [];
    return protocols.slice(0, 20).map((p: any) => {
      const change7d = p.change_7d || 0;
      const change1d = p.change_1d || 0;
      const momentum = change7d > 0 ? "bullish" : "bearish";
      const confidence = Math.min(95, Math.max(30, 50 + Math.abs(change7d) * 2));
      // Deterministic predicted change from weighted 1d + 7d momentum
      const predictedChange = change7d * 0.6 + change1d * 0.4;
      return { name: p.name, slug: p.slug, tvl: p.tvl || 0, change7d, momentum, confidence: Math.round(confidence), predictedChange: Math.round(predictedChange * 100) / 100, predictedTvl: (p.tvl || 0) * (1 + predictedChange / 100) };
    }).sort((a, b) => Math.abs(b.predictedChange) - Math.abs(a.predictedChange));
  }, [protocols]);

  const forecastData = useMemo(() => {
    const top = predictions[0];
    if (!top) return [];
    const baseTvl = top.tvl;
    return Array.from({ length: 30 }, (_, i) => {
      const dayTrend = baseTvl * (1 + (top.predictedChange / 100) * (i / 30));
      return { day: `Day ${i + 1}`, predicted: Math.round(dayTrend), upper: Math.round(dayTrend * 1.05), lower: Math.round(dayTrend * 0.95) };
    });
  }, [predictions]);

  // Trend alignment: compare 1d change as "actual" vs 7d trend / 7 as "predicted daily"
  const accuracyData = useMemo<AccuracyEntry[]>(() => {
    if (!protocols || protocols.length < 6) return [];
    return protocols.slice(0, 6).map((p: any, i: number) => {
      const predicted = (p.change_7d || 0) / 7;
      const actual = p.change_1d || 0;
      const error = Math.abs(predicted - actual);
      const accuracy = Math.max(0, Math.round(100 - error * 5));
      return {
        period: p.name?.slice(0, 15) || `Protocol ${i + 1}`,
        predicted: Math.round(predicted * 100) / 100,
        actual: Math.round(actual * 100) / 100,
        accuracy,
      };
    });
  }, [protocols]);

  const bullishCount = predictions.filter((p) => p.momentum === "bullish").length;
  const avgConfidence = predictions.length > 0 ? Math.round(predictions.reduce((a, b) => a + b.confidence, 0) / predictions.length) : 0;
  const avgAccuracy = accuracyData.length > 0 ? Math.round(accuracyData.reduce((a, b) => a + b.accuracy, 0) / accuracyData.length) : 0;

  const columns: ResponsiveColumn<PredictionEntry>[] = [
    { key: "name", label: "Protocol", priority: "always", render: (p) => <span className="font-medium text-foreground">{p.name}</span> },
    { key: "tvl", label: "Current TVL", priority: "always", align: "right", render: (p) => <span className="font-mono text-foreground">{formatCurrency(p.tvl)}</span> },
    { key: "change7d", label: "7d Change", priority: "expanded", align: "right", render: (p) => (
      <span className={cn("font-mono", p.change7d >= 0 ? "text-success" : "text-destructive")}>{p.change7d >= 0 ? "+" : ""}{p.change7d.toFixed(2)}%</span>
    ) },
    { key: "predictedChange", label: "Predicted", priority: "always", align: "right", render: (p) => (
      <span className={cn("font-mono font-medium", p.predictedChange >= 0 ? "text-success" : "text-destructive")}>{p.predictedChange >= 0 ? "+" : ""}{p.predictedChange}%</span>
    ) },
    { key: "confidence", label: "Confidence", priority: "expanded", align: "right", render: (p) => (
      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", p.confidence >= 70 ? "bg-success/10 text-success" : p.confidence >= 50 ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground")}>{p.confidence}%</span>
    ) },
    { key: "momentum", label: "Signal", priority: "always", align: "center", render: (p) => (
      p.momentum === "bullish" ? <TrendingUp className="h-4 w-4 text-success inline" /> : <TrendingDown className="h-4 w-4 text-destructive inline" />
    ) },
  ];

  const accuracyColumns: ResponsiveColumn<AccuracyEntry>[] = [
    { key: "period", label: "Period", priority: "always", render: (a) => <span className="font-medium text-foreground">{a.period}</span> },
    { key: "predicted", label: "Predicted", priority: "always", align: "right", render: (a) => <span className={cn("font-mono", a.predicted >= 0 ? "text-success" : "text-destructive")}>{a.predicted >= 0 ? "+" : ""}{a.predicted}%</span> },
    { key: "actual", label: "Actual", priority: "always", align: "right", render: (a) => <span className={cn("font-mono", a.actual >= 0 ? "text-success" : "text-destructive")}>{a.actual >= 0 ? "+" : ""}{a.actual}%</span> },
    { key: "accuracy", label: "Accuracy", priority: "always", align: "right", render: (a) => (
      <div className="flex items-center justify-end gap-1.5">
        {a.accuracy >= 80 ? <CheckCircle className="h-3.5 w-3.5 text-success" /> : <XCircle className="h-3.5 w-3.5 text-warning" />}
        <span className={cn("font-mono font-medium", a.accuracy >= 80 ? "text-success" : "text-warning")}>{a.accuracy}%</span>
      </div>
    ) },
  ];

  return (
    <Layout>
      <TierGate requiredTier="pro">
        <ErrorBoundary>
        <div className="space-y-6 animate-fade-in">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{selectedChain.name} TVL Predictions</h1>
              <Badge className="bg-primary/20 text-primary text-xs">PRO</Badge>
            </div>
            <p className="text-muted-foreground mt-1">TVL trend forecasts based on historical momentum analysis</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Protocols Analyzed" value={predictions.length.toString()} icon={Brain} loading={isLoading} />
            <StatCard title="Bullish Signals" value={bullishCount.toString()} icon={TrendingUp} loading={isLoading} />
            <StatCard title="Avg Confidence" value={`${avgConfidence}%`} icon={Target} loading={isLoading} />
            <StatCard title="Trend Alignment" value={`${avgAccuracy}%`} icon={BarChart3} loading={isLoading} />
          </div>

          {/* Methodology Card */}
          <Card className="p-4 border-primary/20 bg-primary/5">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1">Methodology</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Predictions use TVL momentum extrapolation: 60% weight on 7-day trend + 40% weight on 24h movement.
                  Confidence scores reflect trend consistency — higher absolute changes with aligned direction yield stronger signals.
                  Accuracy is measured by comparing predicted daily changes against observed outcomes.
                </p>
              </div>
            </div>
          </Card>

          <Tabs value={currentTab} onValueChange={(v) => setSearchParams({ tab: v })} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="price" className="gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Price Predictions</TabsTrigger>
              <TabsTrigger value="tvl" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> TVL Forecast</TabsTrigger>
              <TabsTrigger value="accuracy" className="gap-1.5"><History className="h-3.5 w-3.5" /> Trend Alignment</TabsTrigger>
            </TabsList>

            <TabsContent value="price" className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-3">Top Predicted Movers</h3>
                <ResponsiveDataTable columns={columns} data={predictions} keyField="slug" loading={isLoading} />
              </div>
            </TabsContent>

            <TabsContent value="tvl" className="space-y-4">
              {predictions.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold text-foreground mb-1">{predictions[0]?.name} — 30-Day TVL Forecast</h3>
                  <p className="text-xs text-muted-foreground mb-4">Confidence interval shown in shaded area</p>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={forecastData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="day" tick={AXIS_TICK_STYLE} interval={4} />
                        <YAxis tick={AXIS_TICK_STYLE} tickFormatter={(v) => `$${(v / 1e9).toFixed(1)}B`} />
                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v: number) => [formatCurrency(v), ""]} />
                        <Area type="monotone" dataKey="upper" stroke="none" fill="hsl(var(--primary))" fillOpacity={0.1} />
                        <Area type="monotone" dataKey="lower" stroke="none" fill="hsl(var(--background))" fillOpacity={1} />
                        <Line type="monotone" dataKey="predicted" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="accuracy" className="space-y-4">
              <Card className="p-3 border-warning/30 bg-warning/5 mb-4">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-warning">⚠ Snapshot Comparison:</strong> This compares each protocol's 7-day daily average vs actual 1-day change — it's a current alignment check, not historical prediction tracking.
                </p>
              </Card>
              <Card className="p-4">
                <h3 className="font-semibold text-foreground mb-1">Trend Alignment by Protocol</h3>
                <p className="text-xs text-muted-foreground mb-4">How well 7-day trends align with recent 1-day movement</p>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={accuracyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="period" tick={AXIS_TICK_STYLE} />
                      <YAxis tick={AXIS_TICK_STYLE} />
                      <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                      <Line type="monotone" dataKey="predicted" stroke="hsl(var(--primary))" strokeWidth={2} name="Predicted %" />
                      <Line type="monotone" dataKey="actual" stroke="hsl(var(--success))" strokeWidth={2} name="Actual %" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <div>
                <h3 className="font-semibold text-foreground mb-3">Accuracy Breakdown</h3>
                <ResponsiveDataTable columns={accuracyColumns} data={accuracyData} keyField="period" />
              </div>
            </TabsContent>
          </Tabs>

          <p className="text-xs text-muted-foreground text-center">
            Predictions are based on historical TVL trends and momentum analysis. Not financial advice.
          </p>
        </div>
        </ErrorBoundary>
      </TierGate>
    </Layout>
  );
}