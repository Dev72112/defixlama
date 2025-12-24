import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarketSentimentProps {
  protocols: any[];
  tokens?: any[];
  loading?: boolean;
}

export function MarketSentiment({ protocols, tokens = [], loading }: MarketSentimentProps) {
  const sentiment = useMemo(() => {
    if (!protocols || protocols.length === 0) {
      return { score: 50, label: "Neutral", color: "text-muted-foreground" };
    }

    // Calculate sentiment based on protocol TVL changes and token price changes
    const protocolChanges = protocols
      .filter((p) => p.change_1d !== undefined && p.change_1d !== null)
      .map((p) => p.change_1d);

    const tokenChanges = tokens
      .filter((t) => t.change24h !== undefined && t.change24h !== null)
      .map((t) => t.change24h);

    const allChanges = [...protocolChanges, ...tokenChanges];
    if (allChanges.length === 0) {
      return { score: 50, label: "Neutral", color: "text-muted-foreground" };
    }

    const avgChange = allChanges.reduce((a, b) => a + b, 0) / allChanges.length;
    const positiveCount = allChanges.filter((c) => c > 0).length;
    const positiveRatio = positiveCount / allChanges.length;

    // Score from 0-100 based on average change and positive ratio
    const changeScore = Math.min(100, Math.max(0, 50 + avgChange * 2));
    const ratioScore = positiveRatio * 100;
    const score = (changeScore + ratioScore) / 2;

    let label: string;
    let color: string;
    if (score >= 70) {
      label = "Very Bullish";
      color = "text-success";
    } else if (score >= 55) {
      label = "Bullish";
      color = "text-success/80";
    } else if (score >= 45) {
      label = "Neutral";
      color = "text-muted-foreground";
    } else if (score >= 30) {
      label = "Bearish";
      color = "text-destructive/80";
    } else {
      label = "Very Bearish";
      color = "text-destructive";
    }

    return { score, label, color };
  }, [protocols, tokens]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="skeleton h-4 w-32 mb-3" />
        <div className="skeleton h-8 w-24" />
      </div>
    );
  }

  const Icon = sentiment.score >= 55 ? TrendingUp : sentiment.score <= 45 ? TrendingDown : Minus;

  return (
    <div className="rounded-lg border border-border bg-gradient-to-br from-card to-card/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">Market Sentiment</span>
        <Icon className={cn("h-5 w-5", sentiment.color)} />
      </div>
      <div className="flex items-end gap-2">
        <span className={cn("text-2xl font-bold", sentiment.color)}>{sentiment.label}</span>
        <span className="text-sm text-muted-foreground mb-0.5">{sentiment.score.toFixed(0)}/100</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            sentiment.score >= 55 ? "bg-success" : sentiment.score <= 45 ? "bg-destructive" : "bg-muted-foreground"
          )}
          style={{ width: `${sentiment.score}%` }}
        />
      </div>
    </div>
  );
}
