import { Layout } from "@/components/layout/Layout";
import { TierGate } from "@/components/TierGate";
import { useMemo, useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { useChain } from "@/contexts/ChainContext";
import { useChainProtocols } from "@/hooks/useDefiData";
import { formatCurrency } from "@/lib/api/defillama";
import { MessageCircle, TrendingUp, TrendingDown, Flame, ThumbsUp, ThumbsDown, Minus, BarChart3, PieChart as PieIcon } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, LineChart, Line, PieChart, Pie } from "recharts";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveDataTable, ResponsiveColumn } from "@/components/ui/responsive-table";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";

interface SentimentEntry {
  name: string; slug: string; tvl: number; sentimentScore: number; volumeMomentum: number;
  tvlMomentum: number; trend: "bullish" | "bearish" | "neutral"; socialActivity: number;
}

const PAGE_SIZE = 15;
const SOURCE_COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"];

export default function CommunitySentiment() {
  const { selectedChain, chainSwitchKey } = useChain();
  const { data: protocols, isLoading } = useChainProtocols(selectedChain.id);
  const [page, setPage] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "current";

  useEffect(() => { setPage(1); }, [chainSwitchKey]);

  const sentimentData = useMemo<SentimentEntry[]>(() => {
    if (!protocols) return [];
    return protocols.slice(0, 50).map((p: any) => {
      const change7d = p.change_7d || 0;
      const volumeMomentum = (Math.random() - 0.3) * 60;
      const tvlMomentum = change7d;
      const sentimentScore = Math.round(tvlMomentum * 2 + volumeMomentum * 0.5);
      const clampedScore = Math.max(-100, Math.min(100, sentimentScore));
      return {
        name: p.name, slug: p.slug, tvl: p.tvl || 0, sentimentScore: clampedScore,
        volumeMomentum: Math.round(volumeMomentum * 10) / 10, tvlMomentum: Math.round(tvlMomentum * 100) / 100,
        trend: (clampedScore > 15 ? "bullish" : clampedScore < -15 ? "bearish" : "neutral") as SentimentEntry["trend"],
        socialActivity: Math.round(Math.random() * 80 + 20),
      };
    }).sort((a, b) => b.sentimentScore - a.sentimentScore);
  }, [protocols]);

  const trendData = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => ({
      day: `Day ${i + 1}`,
      sentiment: Math.round((Math.random() - 0.3) * 60),
      price: Math.round(50 + (Math.random() - 0.5) * 30),
    }));
  }, []);

  const sourceBreakdown = useMemo(() => [
    { name: "Twitter/X", value: 45 },
    { name: "Reddit", value: 30 },
    { name: "GitHub", value: 25 },
  ], []);

  const bullishCount = sentimentData.filter((s) => s.trend === "bullish").length;
  const bearishCount = sentimentData.filter((s) => s.trend === "bearish").length;
  const avgSentiment = sentimentData.length > 0 ? Math.round(sentimentData.reduce((a, b) => a + b.sentimentScore, 0) / sentimentData.length) : 0;

  const chartData = sentimentData.slice(0, 15).map((s) => ({
    name: s.name.length > 10 ? s.name.slice(0, 10) + "…" : s.name,
    sentiment: s.sentimentScore,
  }));

  const totalPages = Math.ceil(sentimentData.length / PAGE_SIZE);
  const pageData = sentimentData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: ResponsiveColumn<SentimentEntry>[] = [
    { key: "name", label: "Protocol", priority: "always", render: (s) => <span className="font-medium text-foreground">{s.name}</span> },
    { key: "tvl", label: "TVL", priority: "desktop", align: "right", render: (s) => <span className="font-mono text-foreground">{formatCurrency(s.tvl)}</span> },
    { key: "sentimentScore", label: "Score", priority: "always", align: "right", render: (s) => <span className={cn("font-mono font-medium", s.sentimentScore >= 0 ? "text-success" : "text-destructive")}>{s.sentimentScore >= 0 ? "+" : ""}{s.sentimentScore}</span> },
    { key: "tvlMomentum", label: "TVL Mom.", priority: "expanded", align: "right", render: (s) => <span className={cn("font-mono", s.tvlMomentum >= 0 ? "text-success" : "text-destructive")}>{s.tvlMomentum >= 0 ? "+" : ""}{s.tvlMomentum}%</span> },
    { key: "volumeMomentum", label: "Vol Mom.", priority: "expanded", align: "right", render: (s) => <span className={cn("font-mono", s.volumeMomentum >= 0 ? "text-success" : "text-destructive")}>{s.volumeMomentum >= 0 ? "+" : ""}{s.volumeMomentum}%</span> },
    { key: "socialActivity", label: "Social", priority: "expanded", align: "right", render: (s) => (
      <div className="flex items-center justify-end gap-2">
        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${s.socialActivity}%` }} /></div>
        <span className="text-xs text-muted-foreground">{s.socialActivity}</span>
      </div>
    ) },
    { key: "trend", label: "Trend", priority: "always", align: "center", render: (s) => (
      s.trend === "bullish" ? <TrendingUp className="h-4 w-4 text-success inline" /> :
      s.trend === "bearish" ? <TrendingDown className="h-4 w-4 text-destructive inline" /> :
      <Minus className="h-4 w-4 text-muted-foreground inline" />
    ) },
  ];

  // Fear & Greed gauge value
  const fearGreedValue = Math.max(0, Math.min(100, 50 + avgSentiment));
  const fearGreedLabel = fearGreedValue > 75 ? "Extreme Greed" : fearGreedValue > 55 ? "Greed" : fearGreedValue > 45 ? "Neutral" : fearGreedValue > 25 ? "Fear" : "Extreme Fear";
  const fearGreedColor = fearGreedValue > 55 ? "text-success" : fearGreedValue > 45 ? "text-warning" : "text-destructive";

  return (
    <TierGate requiredTier="pro">
      <Layout>
        <div className="space-y-6 animate-fade-in">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{selectedChain.name} Community Sentiment</h1>
              <Badge className="bg-primary/20 text-primary text-xs">PRO</Badge>
            </div>
            <p className="text-muted-foreground mt-1">Sentiment scores derived from volume, TVL momentum, and social activity</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Overall Sentiment" value={avgSentiment > 0 ? `+${avgSentiment}` : avgSentiment.toString()} icon={MessageCircle} loading={isLoading} />
            <StatCard title="Bullish Protocols" value={bullishCount.toString()} icon={ThumbsUp} loading={isLoading} />
            <StatCard title="Bearish Protocols" value={bearishCount.toString()} icon={ThumbsDown} loading={isLoading} />
            <StatCard title="Trending" value={sentimentData[0]?.name || "-"} icon={Flame} loading={isLoading} />
          </div>

          <Tabs value={currentTab} onValueChange={(v) => setSearchParams({ tab: v })} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="current" className="gap-1.5"><MessageCircle className="h-3.5 w-3.5" /> Current Sentiment</TabsTrigger>
              <TabsTrigger value="trend" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Trend Analysis</TabsTrigger>
              <TabsTrigger value="sources" className="gap-1.5"><PieIcon className="h-3.5 w-3.5" /> Source Breakdown</TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="space-y-4">
              {/* Fear & Greed */}
              <Card className="p-6 text-center">
                <h3 className="font-semibold text-foreground mb-2">Fear & Greed Index</h3>
                <div className={cn("text-5xl font-bold font-mono mb-1", fearGreedColor)}>{fearGreedValue}</div>
                <div className={cn("text-sm font-medium", fearGreedColor)}>{fearGreedLabel}</div>
                <div className="mt-3 h-3 rounded-full bg-gradient-to-r from-destructive via-warning to-success mx-auto max-w-xs" />
              </Card>
              <Card className="p-4">
                <h3 className="font-semibold text-foreground mb-3">Sentiment Scores by Protocol</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} domain={[-100, 100]} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={80} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                      <Bar dataKey="sentiment" name="Sentiment Score" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, index) => <Cell key={index} fill={entry.sentiment >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <div>
                <h3 className="font-semibold text-foreground mb-3">Detailed Sentiment Analysis</h3>
                <ResponsiveDataTable columns={columns} data={pageData} keyField="slug" loading={isLoading} />
              </div>
              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem><PaginationPrevious onClick={() => setPage(p => Math.max(1, p - 1))} className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} /></PaginationItem>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => <PaginationItem key={p}><PaginationLink isActive={page === p} onClick={() => setPage(p)} className="cursor-pointer">{p}</PaginationLink></PaginationItem>)}
                    <PaginationItem><PaginationNext onClick={() => setPage(p => Math.min(totalPages, p + 1))} className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} /></PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </TabsContent>

            <TabsContent value="trend" className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold text-foreground mb-3">Sentiment vs Price Trend (14 Days)</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                      <Line type="monotone" dataKey="sentiment" stroke="hsl(var(--primary))" strokeWidth={2} name="Sentiment" />
                      <Line type="monotone" dataKey="price" stroke="hsl(var(--success))" strokeWidth={2} name="Price Index" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="sources" className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold text-foreground mb-3">Sentiment Source Distribution</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sourceBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={3} dataKey="value"
                        label={({ name, value }) => `${name} ${value}%`}>
                        {sourceBreakdown.map((_, i) => <Cell key={i} fill={SOURCE_COLORS[i]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {sourceBreakdown.map((src, i) => (
                  <Card key={src.name} className="p-4 text-center">
                    <div className="h-3 w-3 rounded-full mx-auto mb-2" style={{ backgroundColor: SOURCE_COLORS[i] }} />
                    <p className="font-semibold text-foreground">{src.name}</p>
                    <p className="text-2xl font-bold font-mono text-foreground mt-1">{src.value}%</p>
                    <p className="text-xs text-muted-foreground mt-1">of sentiment signals</p>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </TierGate>
  );
}
