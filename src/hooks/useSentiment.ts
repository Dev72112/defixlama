import { useQuery } from '@tanstack/react-query';

export interface SentimentData {
  protocol_slug: string;
  protocol_name: string;
  source: 'twitter' | 'discord' | 'reddit';
  sentiment_score: number; // -100 to +100
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  mention_count: number;
  trending: boolean;
  keywords: string[];
  timestamp: string;
}

export interface SentimentTimeline {
  timestamp: string;
  date: string;
  sentiment_score: number;
  mention_count: number;
}

const SAMPLE_SENTIMENT: SentimentData[] = [
  {
    protocol_slug: 'aave',
    protocol_name: 'Aave',
    source: 'twitter',
    sentiment_score: 72,
    positive_count: 1240,
    negative_count: 156,
    neutral_count: 456,
    mention_count: 1852,
    trending: true,
    keywords: ['flash-loan', 'security', 'governance', 'AAVE-token'],
    timestamp: new Date().toISOString(),
  },
  {
    protocol_slug: 'aave',
    protocol_name: 'Aave',
    source: 'discord',
    sentiment_score: 81,
    positive_count: 890,
    negative_count: 45,
    neutral_count: 234,
    mention_count: 1169,
    trending: false,
    keywords: ['risk', 'governance', 'yields', 'strategy'],
    timestamp: new Date().toISOString(),
  },
  {
    protocol_slug: 'curve',
    protocol_name: 'Curve',
    source: 'twitter',
    sentiment_score: 65,
    positive_count: 980,
    negative_count: 234,
    neutral_count: 567,
    mention_count: 1781,
    trending: true,
    keywords: ['stableswap', 'gauge-voting', 'incentives', 'TVL'],
    timestamp: new Date().toISOString(),
  },
  {
    protocol_slug: 'lido',
    protocol_name: 'Lido',
    source: 'twitter',
    sentiment_score: 58,
    positive_count: 756,
    negative_count: 312,
    neutral_count: 445,
    mention_count: 1513,
    trending: false,
    keywords: ['staking', 'eth', 'withdrawal', 'consensus'],
    timestamp: new Date().toISOString(),
  },
  {
    protocol_slug: 'yearn',
    protocol_name: 'Yearn',
    source: 'discord',
    sentiment_score: 74,
    positive_count: 650,
    negative_count: 89,
    neutral_count: 178,
    mention_count: 917,
    trending: true,
    keywords: ['strategy', 'vault', 'yield-farming', 'automation'],
    timestamp: new Date().toISOString(),
  },
  {
    protocol_slug: 'balancer',
    protocol_name: 'Balancer',
    source: 'twitter',
    sentiment_score: 52,
    positive_count: 412,
    negative_count: 289,
    neutral_count: 334,
    mention_count: 1035,
    trending: false,
    keywords: ['liquidity', 'AMM', 'governance', 'fees'],
    timestamp: new Date().toISOString(),
  },
];

const SENTIMENT_TIMELINES: Record<string, SentimentTimeline[]> = {
  aave: [
    { timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), date: '6 days ago', sentiment_score: 58, mention_count: 1200 },
    { timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), date: '5 days ago', sentiment_score: 62, mention_count: 1450 },
    { timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), date: '4 days ago', sentiment_score: 68, mention_count: 1680 },
    { timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), date: '3 days ago', sentiment_score: 70, mention_count: 1750 },
    { timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), date: '2 days ago', sentiment_score: 71, mention_count: 1800 },
    { timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), date: '1 day ago', sentiment_score: 72, mention_count: 1852 },
    { timestamp: new Date().toISOString(), date: 'Today', sentiment_score: 72, mention_count: 1852 },
  ],
  curve: [
    { timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), date: '6 days ago', sentiment_score: 48, mention_count: 1200 },
    { timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), date: '5 days ago', sentiment_score: 52, mention_count: 1320 },
    { timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), date: '4 days ago', sentiment_score: 58, mention_count: 1450 },
    { timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), date: '3 days ago', sentiment_score: 61, mention_count: 1600 },
    { timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), date: '2 days ago', sentiment_score: 64, mention_count: 1720 },
    { timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), date: '1 day ago', sentiment_score: 65, mention_count: 1750 },
    { timestamp: new Date().toISOString(), date: 'Today', sentiment_score: 65, mention_count: 1781 },
  ],
};

export function useSentimentData(protocolSlug?: string) {
  return useQuery({
    queryKey: ['sentiment-data', protocolSlug],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return protocolSlug
        ? SAMPLE_SENTIMENT.filter((s) => s.protocol_slug === protocolSlug)
        : SAMPLE_SENTIMENT;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useSentimentTimeline(protocolSlug: string) {
  return useQuery({
    queryKey: ['sentiment-timeline', protocolSlug],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return SENTIMENT_TIMELINES[protocolSlug] || [];
    },
    staleTime: 15 * 60 * 1000,
  });
}

export function getSentimentColor(score: number): string {
  if (score >= 70) return 'hsl(142, 76%, 46%)'; // Green
  if (score >= 50) return 'hsl(45, 100%, 50%)'; // Amber
  return 'hsl(0, 84%, 60%)'; // Red
}

export function getSentimentLabel(score: number): string {
  if (score >= 70) return 'Very Positive';
  if (score >= 55) return 'Positive';
  if (score >= 45) return 'Neutral';
  if (score >= 30) return 'Negative';
  return 'Very Negative';
}

export function calculateSentimentChange(old: number, current: number): number {
  return current - old;
}
