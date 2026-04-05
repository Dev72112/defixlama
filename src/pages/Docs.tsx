import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom";
import {
  Book, Code, Crown, Zap, Shield, BarChart3,
  TrendingUp, Activity, Globe, Database,
} from "lucide-react";

const API_ENDPOINTS = [
  { method: "GET", path: "/protocols", desc: "List all DeFi protocols with TVL data", tier: "free" },
  { method: "GET", path: "/protocols/:slug", desc: "Protocol details including TVL history", tier: "free" },
  { method: "GET", path: "/dexs", desc: "DEX volume rankings", tier: "free" },
  { method: "GET", path: "/yields", desc: "Top yield pools across chains", tier: "free" },
  { method: "GET", path: "/stablecoins", desc: "Stablecoin supply and peg data", tier: "free" },
  { method: "GET", path: "/fees", desc: "Protocol fee and revenue data", tier: "free" },
  { method: "GET", path: "/chains", desc: "Chain TVL rankings", tier: "free" },
  { method: "GET", path: "/risk-scores", desc: "Protocol risk analysis", tier: "pro" },
  { method: "GET", path: "/predictions", desc: "AI-powered TVL predictions", tier: "pro" },
  { method: "GET", path: "/whale-activity", desc: "Large wallet movement tracking", tier: "pro_plus" },
  { method: "GET", path: "/correlations", desc: "Cross-protocol correlation matrix", tier: "pro_plus" },
];

const TIER_FEATURES = {
  free: [
    "Dashboard with live TVL, volume & fee stats",
    "Protocol, DEX, yield, stablecoin & fee explorers",
    "Chain comparison and filtering",
    "Token price tracking with multi-source fallback",
    "Watchlist and portfolio tracking",
    "Price alerts (up to 5)",
  ],
  pro: [
    "Everything in Free",
    "Strategy Backtester with historical simulations",
    "Risk Dashboard with protocol risk scores",
    "AI-powered TVL & price predictions",
    "Advanced alert configuration",
    "Protocol comparison tool",
    "Governance tracker",
    "API access (1,000 req/day)",
  ],
  pro_plus: [
    "Everything in Pro",
    "Whale Activity tracker (large wallet movements)",
    "Yield Intelligence (advanced yield analytics)",
    "Market Structure analysis",
    "Cross-protocol correlations",
    "Community Sentiment aggregation",
    "Watchlist exports (CSV/JSON)",
    "Unlimited API access",
  ],
};

export default function Docs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "overview";

  return (
    <Layout>
      <div className="max-w-4xl space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold">Documentation</h1>
          <p className="text-muted-foreground">
            Learn how to use DefiXlama's analytics platform and API
          </p>
        </div>

        <Tabs value={currentTab} onValueChange={(v) => setSearchParams({ tab: v })}>
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview" className="gap-1.5">
              <Book className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-1.5">
              <Crown className="h-4 w-4" /> Features
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-1.5">
              <Code className="h-4 w-4" /> API
            </TabsTrigger>
            <TabsTrigger value="faq" className="gap-1.5">
              <Zap className="h-4 w-4" /> FAQ
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card className="p-6 space-y-4">
              <h2 className="text-lg font-medium flex items-center gap-2">
                <Globe className="h-5 w-5" /> What is DefiXlama?
              </h2>
              <p className="text-muted-foreground">
                DefiXlama is a comprehensive DeFi analytics platform that aggregates data from
                multiple sources including DefiLlama, CoinGecko, and on-chain feeds. Track TVL,
                trading volumes, yields, fees, stablecoins, and more across all major chains.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {[
                  { icon: BarChart3, label: "Real-time TVL tracking" },
                  { icon: TrendingUp, label: "Volume & fee analytics" },
                  { icon: Activity, label: "Yield pool monitoring" },
                  { icon: Shield, label: "Risk & security analysis" },
                  { icon: Database, label: "Multi-chain data" },
                  { icon: Globe, label: "Multi-currency support" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-sm">
                    <Icon className="h-4 w-4 text-primary" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 space-y-3">
              <h2 className="text-lg font-medium">Getting Started</h2>
              <ol className="list-decimal pl-6 text-muted-foreground space-y-2 text-sm">
                <li>Browse the <strong>Dashboard</strong> for a high-level market overview</li>
                <li>Use <strong>Protocols</strong>, <strong>DEXs</strong>, or <strong>Yields</strong> to explore specific data</li>
                <li>Add tokens to your <strong>Watchlist</strong> for quick access</li>
                <li>Set up <strong>Price Alerts</strong> to be notified of market movements</li>
                <li>Track your holdings in the <strong>Portfolio</strong> page</li>
                <li>Upgrade to <strong>Pro</strong> for backtesting, risk analysis, and predictions</li>
              </ol>
            </Card>

            <Card className="p-6 space-y-3">
              <h2 className="text-lg font-medium">Data Sources</h2>
              <ul className="list-disc pl-6 text-muted-foreground text-sm space-y-1">
                <li><strong>DefiLlama</strong> — TVL, protocols, yields, fees, stablecoins, hacks</li>
                <li><strong>CoinGecko</strong> — Token prices, market data, trending coins</li>
                <li><strong>DexScreener</strong> — Fallback price feeds</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                Data refreshes every 5–30 seconds depending on the metric type.
              </p>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-4">
            {(["free", "pro", "pro_plus"] as const).map((t) => (
              <Card key={t} className="p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-medium">
                    {t === "free" ? "Free" : t === "pro" ? "Pro" : "Pro+"} Tier
                  </h2>
                  <Badge variant={t === "free" ? "secondary" : "default"} className="gap-1 text-xs">
                    <Crown className="h-3 w-3" />
                    {t === "free" ? "$0" : t === "pro" ? "$29/mo" : "$49/mo"}
                  </Badge>
                </div>
                <ul className="space-y-1.5">
                  {TIER_FEATURES[t].map((f) => (
                    <li key={f} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </TabsContent>

          {/* API Tab */}
          <TabsContent value="api" className="space-y-4">
            <Card className="p-6 space-y-3">
              <h2 className="text-lg font-medium">API Access</h2>
              <p className="text-sm text-muted-foreground">
                Pro and Pro+ subscribers can access our REST API. Generate an API key from the{" "}
                <a href="/api-access" className="text-primary hover:underline">API Access</a> page.
              </p>
              <div className="bg-muted/30 rounded-md p-3 font-mono text-xs">
                <span className="text-muted-foreground">Authorization:</span> Bearer {"<your-api-key>"}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-medium mb-4">Endpoints</h2>
              <div className="space-y-2">
                {API_ENDPOINTS.map((ep) => (
                  <div
                    key={ep.path}
                    className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 py-2 border-b border-border/50 last:border-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className="font-mono text-[10px] shrink-0">
                        {ep.method}
                      </Badge>
                      <code className="text-xs font-mono truncate">{ep.path}</code>
                    </div>
                    <span className="text-xs text-muted-foreground flex-1">{ep.desc}</span>
                    <Badge
                      variant={ep.tier === "free" ? "secondary" : "default"}
                      className="text-[10px] w-fit shrink-0"
                    >
                      {ep.tier === "pro_plus" ? "PRO+" : ep.tier.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 space-y-3">
              <h2 className="text-lg font-medium">Rate Limits</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="p-3 bg-muted/30 rounded-md text-center">
                  <p className="font-medium">Free</p>
                  <p className="text-muted-foreground text-xs">No API access</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-md text-center">
                  <p className="font-medium">Pro</p>
                  <p className="text-muted-foreground text-xs">1,000 req/day</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-md text-center">
                  <p className="font-medium">Pro+</p>
                  <p className="text-muted-foreground text-xs">Unlimited</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-4">
            <Card className="p-6 space-y-4">
              {[
                {
                  q: "How often is data updated?",
                  a: "Prices refresh every 5 seconds, TVL and volumes every 30 seconds, and protocol metadata every 5 minutes.",
                },
                {
                  q: "Which chains are supported?",
                  a: "We support all chains tracked by DefiLlama — over 200 chains including Ethereum, BSC, Polygon, Arbitrum, Solana, X Layer, and more.",
                },
                {
                  q: "Can I cancel my subscription anytime?",
                  a: "Yes. Go to Billing → Cancel. You'll retain access until the end of your billing period.",
                },
                {
                  q: "What's included in the free trial?",
                  a: "The 7-day free trial gives you full Pro tier access — backtesting, risk dashboard, predictions, and basic API. Pro+ features like Whale Activity remain locked.",
                },
                {
                  q: "How is risk score calculated?",
                  a: "Risk scores combine TVL size, 24h change volatility, and audit status. Protocols with lower TVL, higher volatility, and no audits score higher risk.",
                },
                {
                  q: "Can I export my data?",
                  a: "Free users can export watchlists. Pro+ users get full CSV/JSON exports from any data table.",
                },
              ].map(({ q, a }) => (
                <div key={q} className="space-y-1">
                  <h3 className="font-medium text-sm">{q}</h3>
                  <p className="text-sm text-muted-foreground">{a}</p>
                </div>
              ))}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
