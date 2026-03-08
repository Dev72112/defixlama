import { TierGate } from "@/components/TierGate";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Key, Copy, Eye, EyeOff, Loader2, Lock,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function ApiAccess() {
  const [showKey, setShowKey] = useState(false);

  return (
    <TierGate requiredTier="pro">
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <Key className="h-7 w-7 text-primary" />
            API Access
            <Badge className="bg-primary/20 text-primary text-xs">PRO</Badge>
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your API keys and monitor usage
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
            <Button variant="outline" size="icon">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        </Card>

        {/* Endpoints */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Available Endpoints</h3>
          <div className="space-y-3">
            {[
              { method: "GET", path: "/api/v1/protocols", desc: "List all tracked protocols" },
              { method: "GET", path: "/api/v1/protocols/:slug", desc: "Protocol details with TVL history" },
              { method: "GET", path: "/api/v1/tokens", desc: "Token prices and metadata" },
              { method: "GET", path: "/api/v1/yields", desc: "Yield pools across DeFi" },
              { method: "GET", path: "/api/v1/chains", desc: "Chain TVL and stats" },
            ].map((ep) => (
              <div key={ep.path} className="flex items-center gap-3 border-b border-border/50 pb-3">
                <Badge variant="outline" className="font-mono text-xs bg-primary/10 text-primary">
                  {ep.method}
                </Badge>
                <code className="text-sm font-mono">{ep.path}</code>
                <span className="ml-auto text-xs text-muted-foreground">{ep.desc}</span>
              </div>
            ))}
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
    </Layout>
  );
}
