import { Layout } from "@/components/layout/Layout";
import { Waves, BarChart3, Users, TrendingUp } from "lucide-react";

export default function WhaleActivity() {
  return (
    <Layout>
      <div className="space-y-6 page-enter">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gradient-primary">Whale Activity</h1>
          <p className="text-muted-foreground mt-1">Track institutional and large-wallet behavior across DeFi protocols</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Waves className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Coming Soon</h2>
            <p className="text-muted-foreground mt-2 max-w-lg mx-auto text-sm">
              Whale and institutional behavior tracking will surface pattern-based insights into large wallet movements, 
              liquidity provision concentration, and cross-protocol flow analysis. This requires on-chain indexing data 
              sources not yet integrated.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 max-w-2xl mx-auto">
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-left">
              <Users className="h-5 w-5 text-primary mb-2" />
              <h3 className="text-sm font-medium text-foreground">Wallet Clustering</h3>
              <p className="text-xs text-muted-foreground mt-1">Identify and track related wallet groups</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-left">
              <TrendingUp className="h-5 w-5 text-primary mb-2" />
              <h3 className="text-sm font-medium text-foreground">Flow Analysis</h3>
              <p className="text-xs text-muted-foreground mt-1">Decompose capital flows by participant archetype</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-left">
              <BarChart3 className="h-5 w-5 text-primary mb-2" />
              <h3 className="text-sm font-medium text-foreground">Behavior Patterns</h3>
              <p className="text-xs text-muted-foreground mt-1">Detect accumulation, distribution, and rotation</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
