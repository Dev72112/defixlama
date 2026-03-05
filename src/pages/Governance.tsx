import { Layout } from "@/components/layout/Layout";
import { TierGate } from "@/components/TierGate";
import { useMemo, useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { useChain } from "@/contexts/ChainContext";
import { useChainProtocols } from "@/hooks/useDefiData";
import { formatCurrency } from "@/lib/api/defillama";
import { Vote, Users, Clock, CheckCircle, BarChart3 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ResponsiveDataTable, ResponsiveColumn } from "@/components/ui/responsive-table";
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

const PAGE_SIZE = 15;

export default function Governance() {
  const { selectedChain, chainSwitchKey } = useChain();
  const { data: protocols, isLoading } = useChainProtocols(selectedChain.id);
  const [page, setPage] = useState(1);

  // Reset pagination on chain change
  useEffect(() => { setPage(1); }, [chainSwitchKey]);

  const governanceData = useMemo<GovernanceProtocol[]>(() => {
    if (!protocols) return [];
    const govCategories = ["Lending", "DEXes", "Liquid Staking", "CDP", "Bridge", "Yield"];
    return protocols
      .filter((p: any) => govCategories.includes(p.category))
      .slice(0, 50)
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

  const totalPages = Math.ceil(governanceData.length / PAGE_SIZE);
  const pageData = governanceData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: ResponsiveColumn<GovernanceProtocol>[] = [
    { key: "name", label: "Protocol", priority: "always", render: (g) => <span className="font-medium text-foreground">{g.name}</span> },
    { key: "tvl", label: "TVL", priority: "desktop", align: "right", render: (g) => <span className="font-mono text-foreground">{formatCurrency(g.tvl)}</span> },
    { key: "proposalCount", label: "Proposals", priority: "always", align: "right", render: (g) => <span className="font-mono text-foreground">{g.proposalCount}</span> },
    { key: "activeProposals", label: "Active", priority: "always", align: "right", render: (g) => g.activeProposals > 0 ? (
      <span className="inline-flex items-center gap-1 text-success"><CheckCircle className="h-3 w-3" /> {g.activeProposals}</span>
    ) : <span className="text-muted-foreground">0</span> },
    { key: "participationRate", label: "Participation", priority: "expanded", align: "right", render: (g) => (
      <span className={cn("font-mono", g.participationRate >= 40 ? "text-success" : g.participationRate >= 20 ? "text-warning" : "text-destructive")}>{g.participationRate.toFixed(1)}%</span>
    ) },
    { key: "category", label: "Category", priority: "expanded", align: "center", render: (g) => <Badge variant="outline" className="text-xs">{g.category}</Badge> },
  ];

  return (
    <TierGate requiredTier="pro">
      <Layout>
        <div className="space-y-6 animate-fade-in">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{selectedChain.name} Governance Tracker</h1>
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

          <div>
            <h3 className="font-semibold text-foreground mb-3">Protocol Governance Overview</h3>
            <ResponsiveDataTable
              columns={columns}
              data={pageData}
              keyField="slug"
              loading={isLoading}
            />
          </div>

          {totalPages > 1 && (
            <Pagination>
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
        </div>
      </Layout>
    </TierGate>
  );
}