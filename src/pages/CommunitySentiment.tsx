import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useSentimentData, useSentimentTimeline, getSentimentColor, getSentimentLabel } from '@/hooks/useSentiment';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { MessageCircle, TrendingUp, Users, Zap, MessageSquare, Heart, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

const PROTOCOLS = [
  { slug: 'aave', name: 'Aave', color: 'hsl(142, 76%, 46%)' },
  { slug: 'curve', name: 'Curve', color: 'hsl(45, 100%, 50%)' },
  { slug: 'lido', name: 'Lido', color: 'hsl(280, 80%, 60%)' },
  { slug: 'yearn', name: 'Yearn', color: 'hsl(180, 80%, 45%)' },
  { slug: 'balancer', name: 'Balancer', color: 'hsl(30, 90%, 55%)' },
];

export default function CommunitySentiment() {
  const { data: allSentiment, isLoading } = useSentimentData();
  const [selectedProtocol, setSelectedProtocol] = useState<string>('aave');

  const protocolSentiment = useMemo(() => {
    if (!allSentiment) return [];
    return allSentiment.filter((s) => s.protocol_slug === selectedProtocol);
  }, [allSentiment, selectedProtocol]);

  const { data: timeline } = useSentimentTimeline(selectedProtocol);

  const overallSentiment = useMemo(() => {
    if (protocolSentiment.length === 0) return 0;
    return Math.round(
      protocolSentiment.reduce((sum, s) => sum + s.sentiment_score, 0) / protocolSentiment.length
    );
  }, [protocolSentiment]);

  const totalMentions = useMemo(() => {
    return protocolSentiment.reduce((sum, s) => sum + s.mention_count, 0);
  }, [protocolSentiment]);

  const sentimentBreakdown = useMemo(() => {
    if (protocolSentiment.length === 0) return [];
    return protocolSentiment.map((s) => ({
      name: s.source.charAt(0).toUpperCase() + s.source.slice(1),
      value: s.mention_count,
      sentiment: s.sentiment_score,
    }));
  }, [protocolSentiment]);

  const voteBreakdown = useMemo(() => {
    if (protocolSentiment.length === 0) return [];
    const combined = {
      positive: 0,
      negative: 0,
      neutral: 0,
    };

    protocolSentiment.forEach((s) => {
      combined.positive += s.positive_count;
      combined.negative += s.negative_count;
      combined.neutral += s.neutral_count;
    });

    return [
      { name: 'Positive', value: combined.positive, fill: 'hsl(142, 76%, 46%)' },
      { name: 'Neutral', value: combined.neutral, fill: 'hsl(45, 100%, 50%)' },
      { name: 'Negative', value: combined.negative, fill: 'hsl(0, 84%, 60%)' },
    ];
  }, [protocolSentiment]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading sentiment data...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 page-enter">
        {/* Header */}
        <div className="flex items-center gap-3">
          <MessageCircle className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-gradient-primary">Community Sentiment</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Real-time social sentiment analysis from Twitter, Discord, and Reddit
            </p>
          </div>
        </div>

        {/* Protocol Selector */}
        <Card className="p-4 border-border">
          <p className="text-sm text-muted-foreground mb-3 font-semibold">Select Protocol</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {PROTOCOLS.map((p) => (
              <button
                key={p.slug}
                onClick={() => setSelectedProtocol(p.slug)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  selectedProtocol === p.slug
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary/50'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {p.name}
              </button>
            ))}
          </div>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Overall Sentiment */}
          <Card className="p-4 border-border">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Overall Sentiment</p>
                <div
                  className="text-2xl font-bold mt-2 px-3 py-1 rounded w-fit"
                  style={{
                    color: getSentimentColor(overallSentiment),
                    backgroundColor: getSentimentColor(overallSentiment) + '20',
                  }}
                >
                  {overallSentiment}%
                </div>
                <p className="text-xs text-muted-foreground mt-2">{getSentimentLabel(overallSentiment)}</p>
              </div>
              <Zap className="h-5 w-5 flex-shrink-0" style={{ color: getSentimentColor(overallSentiment) }} />
            </div>
          </Card>

          {/* Total Mentions */}
          <Card className="p-4 border-border">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Total Mentions</p>
                <p className="text-2xl font-bold text-primary mt-2">{totalMentions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-2">Last 24 hours</p>
              </div>
              <MessageSquare className="h-5 w-5 text-primary flex-shrink-0" />
            </div>
          </Card>

          {/* Positive Sentiment */}
          <Card className="p-4 border-border">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Positive</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {protocolSentiment.reduce((sum, s) => sum + s.positive_count, 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {protocolSentiment.length > 0
                    ? Math.round((protocolSentiment.reduce((sum, s) => sum + s.positive_count, 0) / totalMentions) * 100)
                    : 0}
                  %
                </p>
              </div>
              <Heart className="h-5 w-5 text-green-600 flex-shrink-0" />
            </div>
          </Card>

          {/* Trending */}
          <Card className="p-4 border-border">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Trending Status</p>
                {protocolSentiment.some((s) => s.trending) ? (
                  <>
                    <Badge className="mt-2 bg-red-500/20 text-red-600">
                      <Flame className="h-3 w-3 mr-1" />
                      Trending
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">High engagement detected</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground mt-2">Not trending</p>
                )}
              </div>
              <Flame className="h-5 w-5 flex-shrink-0" style={{ opacity: protocolSentiment.some((s) => s.trending) ? 1 : 0.3 }} />
            </div>
          </Card>
        </div>

        {/* Sentiment Timeline */}
        {timeline && timeline.length > 0 && (
          <Card className="p-4 border-border">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Sentiment Trend (7 Days)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: any) => `${value}%`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sentiment_score"
                  stroke="hsl(142, 76%, 46%)"
                  strokeWidth={2}
                  dot={false}
                  name="Sentiment Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Sentiment by Source */}
          {sentimentBreakdown.length > 0 && (
            <Card className="p-4 border-border">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Sentiment by Source
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sentimentBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(142, 76%, 46%)" name="Mentions" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Sentiment Breakdown Pie */}
          {voteBreakdown.length > 0 && (
            <Card className="p-4 border-border">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Sentiment Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={voteBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {voteBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>

        {/* Keywords & Topics */}
        {protocolSentiment.length > 0 && (
          <Card className="p-4 border-border">
            <h3 className="font-semibold text-foreground mb-3">Trending Keywords</h3>
            <div className="space-y-3">
              {protocolSentiment.map((sentiment) => (
                <div key={`${sentiment.protocol_slug}-${sentiment.source}`}>
                  <p className="text-xs text-muted-foreground mb-2 font-semibold">
                    {sentiment.source.charAt(0).toUpperCase() + sentiment.source.slice(1)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {sentiment.keywords.map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="text-[11px]">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Footer */}
        <Card className="p-4 border-border bg-card/50">
          <p className="text-xs text-muted-foreground">
            <strong>Sentiment Analysis:</strong> Powered by real-time monitoring of Twitter, Discord, and Reddit. Sentiment scores
            range from -100 (extremely negative) to +100 (extremely positive). Data updates every 15 minutes. Use this to gauge
            community mood and identify emerging narratives.
          </p>
        </Card>
      </div>
    </Layout>
  );
}
