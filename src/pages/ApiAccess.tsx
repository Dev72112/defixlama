import { TierGate } from "@/components/TierGate";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CHART_TOOLTIP_STYLE, AXIS_TICK_STYLE } from "@/lib/chartStyles";
import {
  Key, Copy, Eye, EyeOff, Lock, BarChart3, Code2,
} from "lucide-react";
import { useState, useMemo } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid,
} from "recharts";
import { toast } from "@/hooks/use-toast";

export default function ApiAccess() {
  const [showKey, setShowKey] = useState(false);

  // Deterministic usage data (last 30 days)
  const usageData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        day: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        requests: 0,
      };
    });
  }, []);

  const endpoints = [
    { method: "GET", path: "/api/v1/protocols", desc: "List all tracked protocols with TVL and metadata", rateLimit: "60/min" },
    { method: "GET", path: "/api/v1/protocols/:slug", desc: "Protocol details with full TVL history", rateLimit: "30/min" },
    { method: "GET", path: "/api/v1/protocols/:slug/tvl", desc: "Historical TVL data points for a protocol", rateLimit: "30/min" },
    { method: "GET", path: "/api/v1/tokens", desc: "Token prices, market caps, and volumes", rateLimit: "60/min" },
    { method: "GET", path: "/api/v1/tokens/:id", desc: "Individual token details and price history", rateLimit: "30/min" },
    { method: "GET", path: "/api/v1/yields", desc: "Yield pools across all DeFi protocols", rateLimit: "30/min" },
    { method: "GET", path: "/api/v1/chains", desc: "Chain TVL, protocol counts, and dominance", rateLimit: "60/min" },
    { method: "GET", path: "/api/v1/fees", desc: "Protocol fee revenue (24h, 7d, 30d)", rateLimit: "30/min" },
    { method: "GET", path: "/api/v1/dexs", desc: "DEX volume data across all chains", rateLimit: "30/min" },
    { method: "GET", path: "/api/v1/stablecoins", desc: "Stablecoin market caps and peg data", rateLimit: "30/min" },
  ];

  const copyKey = () => {
    navigator.clipboard.writeText("dxl_live_xxxxxxxxxxxxxxxxxxxx");
    toast({ title: "Copied", description: "API key copied to clipboard" });
  };

  return (
    <TierGate requiredTier="pro">
    <Layout>
      <ErrorBoundary>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <Key className="h-7 w-7 text-primary" />
            API Access
            <Badge className="bg-primary/20 text-primary text-xs">PRO</Badge>
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your API keys, monitor usage, and explore available endpoints
          </p>
        </div>

        {/* API Key Section */}
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Your API Key</h3>
          <div className="flex items-center gap-3">
            <div className="flex-1 font-mono text-sm bg-muted/50 rounded-lg px-4 py-3 border border-border">
              {showKey ? "dxl_live_xxxxxxxxxxxxxxxxxxxx" : "••••••••••••••••••••••••"}
            </div>
            <Button variant="outline" size="icon" onClick={() => setShowKey(!showKey)}>
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={copyKey}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Keep your API key secret. Do not share it publicly or commit it to version control.
          </p>
        </Card>

        {/* Usage Stats */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Usage This Month</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Requests Made</p>
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-muted-foreground">of 10,000</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Rate Limit</p>
              <p className="text-2xl font-bold">60</p>
              <p className="text-xs text-muted-foreground">req/min</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Avg Latency</p>
              <p className="text-2xl font-bold">-</p>
              <p className="text-xs text-muted-foreground">ms</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Errors</p>
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-muted-foreground">this month</p>
            </div>
          </div>
          {/* Usage Chart */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Request Volume (Last 30 Days)
            </h4>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={usageData}>
                  <defs>
                    <linearGradient id="apiUsageGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={AXIS_TICK_STYLE} interval={4} />
                  <YAxis tick={AXIS_TICK_STYLE} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="requests" stroke="hsl(var(--primary))" fill="url(#apiUsageGrad)" strokeWidth={2} name="Requests" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Endpoints Documentation */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" /> Available Endpoints
          </h3>
          <p className="text-xs text-muted-foreground mb-4">All endpoints require authentication via the <code className="bg-muted px-1 rounded">X-API-Key</code> header</p>
          <div className="space-y-3">
            {endpoints.map((ep) => (
              <div key={ep.path} className="flex items-start gap-3 border-b border-border/50 pb-3 last:border-0">
                <Badge variant="outline" className="font-mono text-xs bg-primary/10 text-primary flex-shrink-0 mt-0.5">
                  {ep.method}
                </Badge>
                <div className="flex-1 min-w-0">
                  <code className="text-sm font-mono text-foreground">{ep.path}</code>
                  <p className="text-xs text-muted-foreground mt-0.5">{ep.desc}</p>
                </div>
                <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-1">{ep.rateLimit}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Start */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-3">Quick Start</h3>
          <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm text-foreground overflow-x-auto">
            <pre className="whitespace-pre-wrap">{`curl -H "X-API-Key: YOUR_KEY" \\
  https://api.defixlama.com/api/v1/protocols

# Response
{
  "data": [
    { "name": "Aave", "tvl": 12500000000, ... },
    ...
  ]
}`}</pre>
          </div>
        </Card>

        <Card className="p-4 bg-muted/30">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              API access requires an active Pro subscription. Upgrade to unlock API endpoints.
            </p>
          </div>
        </Card>
      </div>
      </ErrorBoundary>
    </Layout>
    </TierGate>
  );
}