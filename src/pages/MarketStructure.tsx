import { Layout } from "@/components/layout/Layout";
import { Landmark, GitBranch, Lock, Activity } from "lucide-react";

export default function MarketStructure() {
  return (
    <Layout>
      <div className="space-y-6 page-enter">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gradient-primary">Market Structure</h1>
          <p className="text-muted-foreground mt-1">Analyze liquidity dynamics, market microstructure, and smart contract behavior</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Landmark className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Coming Soon</h2>
            <p className="text-muted-foreground mt-2 max-w-lg mx-auto text-sm">
              Market structure analytics will provide deep visibility into liquidity depth, order flow toxicity, 
              smart contract governance activity, and cause→effect timelines linking parameter changes to market reactions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 max-w-2xl mx-auto">
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-left">
              <Activity className="h-5 w-5 text-primary mb-2" />
              <h3 className="text-sm font-medium text-foreground">Liquidity Dynamics</h3>
              <p className="text-xs text-muted-foreground mt-1">Depth analysis across DEX pools and lending markets</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-left">
              <Lock className="h-5 w-5 text-primary mb-2" />
              <h3 className="text-sm font-medium text-foreground">Governance & Upgrades</h3>
              <p className="text-xs text-muted-foreground mt-1">Track contract permissions, upgrades, and voting</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-left">
              <GitBranch className="h-5 w-5 text-primary mb-2" />
              <h3 className="text-sm font-medium text-foreground">Cause → Effect</h3>
              <p className="text-xs text-muted-foreground mt-1">Link parameter changes to volatility and flow shifts</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
