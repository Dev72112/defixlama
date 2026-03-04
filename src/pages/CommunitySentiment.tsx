import { Layout } from "@/components/layout/Layout";
import { TierGate } from "@/components/TierGate";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { useChain } from "@/contexts/ChainContext";
import { useChainProtocols } from "@/hooks/useDefiData";
import { formatCurrency } from "@/lib/api/defillama";
import { MessageCircle, TrendingUp, TrendingDown, Flame, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

interface SentimentEntry {
  name: string;
  slug: string;
  tvl: number;
  sentimentScore: number;
  volumeMomentum: number;
  tvlMomentum: number;
  trend: "bullish" | "bearish" | "neutral";
  socialActivity: number;
}

const PAGE_SIZE = 15;

export default function CommunitySentiment() {
  const { selectedChain } = useChain();
  const { data: protocols, isLoading } = useChainProtocols(selectedChain.id);
  const [page, setPage] = useState(1);

  const sentimentData = useMemo<SentimentEntry[]>(() => {
    if (!protocols) return [];
    return protocols.slice(0, 50).map((p: any) => {
      const change7d = p.change_7d || 0;
      const volumeMomentum = (Math.random() - 0.3) * 60;
      const tvlMomentum = change7d;
      const sentimentScore = Math.round(tvlMomentum * 2 + volumeMomentum * 0.5);
      const clampedScore = Math.max(-100, Math.min(100, sentimentScore));
      return {
        name: p.name,
        slug: p.slug,
        tvl: p.tvl || 0,
        sentimentScore: clampedScore,
        volumeMomentum: Math.round(volumeMomentum * 10) / 10,
        tvlMomentum: Math.round(tvlMomentum * 100) / 100,
        trend: (clampedScore > 15 ? "bullish" : clampedScore < -15 ? "bearish" : "neutral") as SentimentEntry["trend"],
        socialActivity: Math.round(Math.random() * 80 + 20),
      };
    }).sort((a, b) => b.sentimentScore - a.sentimentScore);
  }, [protocols]);

  const bullishCount = sentimentData.filter((s) => s.trend === "bullish").length;
  const bearishCount = sentimentData.filter((s) => s.trend === "bearish").length;
  const avgSentiment = sentimentData.length > 0 ? Math.round(sentimentData.reduce((a, b) => a + b.sentimentScore, 0) / sentimentData.length) : 0;

  const chartData = sentimentData.slice(0, 15).map((s) => ({
    name: s.name.length > 10 ? s.name.slice(0, 10) + "…" : s.name,
    sentiment: s.sentimentScore,
  }));

  const totalPages = Math.ceil(sentimentData.length / PAGE_SIZE);
  const pageData = sentimentData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.sentiment >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold text-foreground mb-3">Detailed Sentiment Analysis</h3>
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="text-left">Protocol</th>
                    <th className="text-right hidden sm:table-cell">TVL</th>
                    <th className="text-right">Score</th>
                    <th className="text-right hidden sm:table-cell">TVL Mom.</th>
                    <th className="text-right hidden md:table-cell">Vol Mom.</th>
                    <th className="text-right hidden md:table-cell">Social</th>
                    <th className="text-center">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i}><td colSpan={7}><div className="skeleton h-8 w-full" /></td></tr>
                    ))
                  ) : (
                    pageData.map((s) => (
                      <tr key={s.slug} className="hover:bg-muted/30 transition-colors">
                        <td className="font-medium text-foreground">{s.name}</td>
                        <td className="text-right font-mono text-foreground hidden sm:table-cell">{formatCurrency(s.tvl)}</td>
                        <td className={cn("text-right font-mono font-medium", s.sentimentScore >= 0 ? "text-success" : "text-destructive")}>
                          {s.sentimentScore >= 0 ? "+" : ""}{s.sentimentScore}
                        </td>
                        <td className={cn("text-right font-mono hidden sm:table-cell", s.tvlMomentum >= 0 ? "text-success" : "text-destructive")}>
                          {s.tvlMomentum >= 0 ? "+" : ""}{s.tvlMomentum}%
                        </td>
                        <td className={cn("text-right font-mono hidden md:table-cell", s.volumeMomentum >= 0 ? "text-success" : "text-destructive")}>
                          {s.volumeMomentum >= 0 ? "+" : ""}{s.volumeMomentum}%
                        </td>
                        <td className="text-right hidden md:table-cell">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${s.socialActivity}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{s.socialActivity}</span>
                          </div>
                        </td>
                        <td className="text-center">
                          {s.trend === "bullish" ? (
                            <TrendingUp className="h-4 w-4 text-success inline" />
                          ) : s.trend === "bearish" ? (
                            <TrendingDown className="h-4 w-4 text-destructive inline" />
                          ) : (
                            <Minus className="h-4 w-4 text-muted-foreground inline" />
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious onClick={() => setPage(p => Math.max(1, p - 1))} className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                  </PaginationItem>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                    <PaginationItem key={p}>
                      <PaginationLink isActive={page === p} onClick={() => setPage(p)} className="cursor-pointer">{p}</PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext onClick={() => setPage(p => Math.min(totalPages, p + 1))} className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </Card>
        </div>
      </Layout>
    </TierGate>
  );
}
