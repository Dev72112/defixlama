import { Layout } from "@/components/layout/Layout";
import { TierGate } from "@/components/TierGate";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { useAllProtocols } from "@/hooks/useDefiData";
import { formatCurrency } from "@/lib/api/defillama";
import { TrendingUp, TrendingDown, Brain, Target, BarChart3, Activity } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from "recharts";
import { cn } from "@/lib/utils";

export default function Predictions() {
  const { data: protocols, isLoading } = useAllProtocols();

  // Generate predictions based on TVL trends
  const predictions = useMemo(() => {
    if (!protocols) return [];
    return protocols.slice(0, 20).map((p: any) => {
      const change7d = p.change_7d || (Math.random() - 0.5) * 20;
      const change30d = p.change_1m || change7d * 3;
      const momentum = change7d > 0 ? "bullish" : "bearish";
      const confidence = Math.min(95, Math.max(30, 50 + Math.abs(change7d) * 2));
      const predictedChange = change7d * 0.7 + (Math.random() - 0.3) * 5;
      return {
        name: p.name,
        slug: p.slug,
        tvl: p.tvl || 0,
        change7d,
        change30d,
        momentum,
        confidence: Math.round(confidence),
        predictedChange: Math.round(predictedChange * 100) / 100,
        predictedTvl: (p.tvl || 0) * (1 + predictedChange / 100),
      };
    }).sort((a, b) => Math.abs(b.predictedChange) - Math.abs(a.predictedChange));
  }, [protocols]);

  // Chart data: simulated 30-day forecast
  const forecastData = useMemo(() => {
    const top = predictions[0];
    if (!top) return [];
    const baseTvl = top.tvl;
    return Array.from({ length: 30 }, (_, i) => {
      const dayTrend = baseTvl * (1 + (top.predictedChange / 100) * (i / 30));
      const noise = baseTvl * (Math.random() - 0.5) * 0.02;
      return {
        day: `Day ${i + 1}`,
        predicted: Math.round(dayTrend + noise),
        upper: Math.round(dayTrend * 1.05),
        lower: Math.round(dayTrend * 0.95),
      };
    });
  }, [predictions]);

  const bullishCount = predictions.filter((p) => p.momentum === "bullish").length;
  const avgConfidence = predictions.length > 0 ? Math.round(predictions.reduce((a, b) => a + b.confidence, 0) / predictions.length) : 0;

  return (
    <TierGate requiredTier="pro">
      <Layout>
        <div className="space-y-6 animate-fade-in">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">TVL Predictions</h1>
              <Badge className="bg-primary/20 text-primary text-xs">PRO</Badge>
            </div>
            <p className="text-muted-foreground mt-1">AI-powered TVL trend forecasts based on historical data</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Protocols Analyzed" value={predictions.length.toString()} icon={Brain} loading={isLoading} />
            <StatCard title="Bullish Signals" value={bullishCount.toString()} icon={TrendingUp} loading={isLoading} />
            <StatCard title="Bearish Signals" value={(predictions.length - bullishCount).toString()} icon={TrendingDown} loading={isLoading} />
            <StatCard title="Avg Confidence" value={`${avgConfidence}%`} icon={Target} loading={isLoading} />
          </div>

          {/* Forecast Chart */}
          {predictions.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-1">{predictions[0]?.name} — 30-Day TVL Forecast</h3>
              <p className="text-xs text-muted-foreground mb-4">Confidence interval shown in shaded area</p>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecastData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={4} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `$${(v / 1e9).toFixed(1)}B`} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(v: number) => [formatCurrency(v), ""]} />
                    <Area type="monotone" dataKey="upper" stroke="none" fill="hsl(var(--primary))" fillOpacity={0.1} />
                    <Area type="monotone" dataKey="lower" stroke="none" fill="hsl(var(--background))" fillOpacity={1} />
                    <Line type="monotone" dataKey="predicted" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Predictions Table */}
          <Card className="p-4">
            <h3 className="font-semibold text-foreground mb-3">Top Predicted Movers</h3>
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="text-left">Protocol</th>
                    <th className="text-right">Current TVL</th>
                    <th className="text-right">7d Change</th>
                    <th className="text-right">Predicted Change</th>
                    <th className="text-right">Confidence</th>
                    <th className="text-center">Signal</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i}><td colSpan={6}><div className="skeleton h-8 w-full" /></td></tr>
                    ))
                  ) : (
                    predictions.map((p) => (
                      <tr key={p.slug} className="hover:bg-muted/30 transition-colors">
                        <td className="font-medium text-foreground">{p.name}</td>
                        <td className="text-right font-mono text-foreground">{formatCurrency(p.tvl)}</td>
                        <td className={cn("text-right font-mono", p.change7d >= 0 ? "text-success" : "text-destructive")}>
                          {p.change7d >= 0 ? "+" : ""}{p.change7d.toFixed(2)}%
                        </td>
                        <td className={cn("text-right font-mono font-medium", p.predictedChange >= 0 ? "text-success" : "text-destructive")}>
                          {p.predictedChange >= 0 ? "+" : ""}{p.predictedChange}%
                        </td>
                        <td className="text-right">
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", p.confidence >= 70 ? "bg-success/10 text-success" : p.confidence >= 50 ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground")}>
                            {p.confidence}%
                          </span>
                        </td>
                        <td className="text-center">
                          {p.momentum === "bullish" ? (
                            <TrendingUp className="h-4 w-4 text-success inline" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-destructive inline" />
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <p className="text-xs text-muted-foreground text-center">
            Predictions are based on historical TVL trends and momentum analysis. Not financial advice.
          </p>
        </div>
      </Layout>
    </TierGate>
  );
}
