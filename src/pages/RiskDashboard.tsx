import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useChain } from "@/contexts/ChainContext";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/api/defillama";
import { CACHE_TIERS } from "@/lib/cacheConfig";
import {
  Shield, AlertTriangle, CheckCircle2, XCircle,
  Loader2, Clock, TrendingDown,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, Cell,
} from "recharts";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

function useHackHistory() {
  return useQuery({
    queryKey: ["hack-history"],
    queryFn: async () => {
      const res = await fetch("https://api.llama.fi/hacks");
      if (!res.ok) throw new Error("Failed to fetch hacks");
      const data = await res.json();
      return (data as any[]).sort((a, b) => b.date - a.date).slice(0, 100);
    },
    ...CACHE_TIERS.STATIC,
  });
}

function useProtocolRisks(chainId: string) {
  return useQuery({
    queryKey: ["protocol-risks", chainId],
    queryFn: async () => {
      const res = await fetch("https://api.llama.fi/protocols");
      if (!res.ok) throw new Error("Failed to fetch protocols");
      let protocols = (await res.json()) as any[];

      if (chainId !== "all") {
        protocols = protocols.filter((p) =>
          p.chains?.some((c: string) => c.toLowerCase() === chainId.toLowerCase()) ||
          p.chain?.toLowerCase() === chainId.toLowerCase()
        );
      }

      return protocols
        .filter((p) => p.tvl > 1_000_000)
        .slice(0, 100)
        .map((p) => {
          let riskScore = 50;
          if (p.tvl < 10_000_000) riskScore += 20;
          else if (p.tvl < 100_000_000) riskScore += 10;
          else riskScore -= 10;
          if (p.change_1d < -5) riskScore += 15;
          else if (p.change_1d < -2) riskScore += 5;
          if (p.audits && p.audits.length > 0) riskScore -= 15;
          if (p.audit_links && p.audit_links.length > 0) riskScore -= 10;
          riskScore = Math.max(0, Math.min(100, riskScore));
          return {
            name: p.name,
            slug: p.slug,
            tvl: p.tvl,
            category: p.category,
            logo: p.logo,
            riskScore,
            riskLevel: riskScore > 70 ? "High" : riskScore > 40 ? "Medium" : "Low",
            change_1d: p.change_1d,
            audited: (p.audits?.length > 0 || p.audit_links?.length > 0),
          };
        })
        .sort((a, b) => b.riskScore - a.riskScore);
    },
    ...CACHE_TIERS.STATIC,
  });
}

const PAGE_SIZE = 20;

export default function RiskDashboard() {
  const { selectedChain } = useChain();
  const { data: hacks = [], isLoading: loadingHacks } = useHackHistory();
  const { data: risks = [], isLoading: loadingRisks } = useProtocolRisks(selectedChain.id);
  const [riskPage, setRiskPage] = useState(1);
  const [hackPage, setHackPage] = useState(1);

  // Reset pagination on chain change
  useEffect(() => { setRiskPage(1); setHackPage(1); }, [selectedChain.id]);

  const hacksByMonth = hacks.reduce((acc: Record<string, number>, hack: any) => {
    const month = new Date(hack.date * 1000).toISOString().slice(0, 7);
    acc[month] = (acc[month] || 0) + (hack.amount || 0);
    return acc;
  }, {});

  const hackChartData = Object.entries(hacksByMonth)
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-24);

  const totalLost = hacks.reduce((s: number, h: any) => s + (h.amount || 0), 0);

  const riskTotalPages = Math.ceil(risks.length / PAGE_SIZE);
  const riskPageData = risks.slice((riskPage - 1) * PAGE_SIZE, riskPage * PAGE_SIZE);

  const hackTotalPages = Math.ceil(hacks.length / PAGE_SIZE);
  const hackPageData = hacks.slice((hackPage - 1) * PAGE_SIZE, hackPage * PAGE_SIZE);

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <Shield className="h-7 w-7 text-primary" />
            {selectedChain.name} Risk Dashboard
            <Badge className="bg-primary/20 text-primary text-xs">PRO</Badge>
          </h1>
          <p className="text-muted-foreground mt-1">
            Protocol risk scoring, audit status, and DeFi hack history
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Total Hacks Tracked</p>
            <p className="text-2xl font-bold">{hacks.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Total Funds Lost</p>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(totalLost)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">High Risk Protocols</p>
            <p className="text-2xl font-bold text-warning">{risks.filter((r) => r.riskLevel === "High").length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Audited Protocols</p>
            <p className="text-2xl font-bold text-success">{risks.filter((r) => r.audited).length}</p>
          </Card>
        </div>

        {/* Hack History Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-destructive" />
            Hack Losses by Month (Last 2 Years)
          </h3>
          {loadingHacks ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hackChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `$${(v / 1e6).toFixed(0)}M`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    formatter={(value: number) => [formatCurrency(value), "Funds Lost"]}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {hackChartData.map((_, i) => (
                      <Cell key={i} fill="hsl(var(--destructive))" opacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Risk Table with pagination */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Protocol Risk Scores
          </h3>
          {loadingRisks ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="overflow-hidden">
                <table className="w-full data-table">
                  <thead>
                    <tr>
                      <th>Protocol</th>
                      <th className="text-right hidden sm:table-cell">TVL</th>
                      <th className="text-right">Risk Score</th>
                      <th className="text-center">Risk Level</th>
                      <th className="text-center hidden sm:table-cell">Audited</th>
                      <th className="text-right hidden md:table-cell">24h Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskPageData.map((r) => (
                      <tr key={r.slug}>
                        <td>
                          <div className="flex items-center gap-2 min-w-0">
                            {r.logo && <img src={r.logo} alt="" className="h-5 w-5 rounded-full flex-shrink-0" />}
                            <span className="font-medium truncate max-w-[100px] sm:max-w-none">{r.name}</span>
                            <span className="text-xs text-muted-foreground hidden sm:inline flex-shrink-0">{r.category}</span>
                          </div>
                        </td>
                        <td className="text-right font-mono hidden sm:table-cell">{formatCurrency(r.tvl)}</td>
                        <td className="text-right font-mono">{r.riskScore}</td>
                        <td className="text-center">
                          <Badge
                            variant="outline"
                            className={cn(
                              r.riskLevel === "High" && "border-destructive text-destructive",
                              r.riskLevel === "Medium" && "border-warning text-warning",
                              r.riskLevel === "Low" && "border-success text-success"
                            )}
                          >
                            {r.riskLevel}
                          </Badge>
                        </td>
                        <td className="text-center hidden sm:table-cell">
                          {r.audited ? (
                            <CheckCircle2 className="h-4 w-4 text-success mx-auto" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive/50 mx-auto" />
                          )}
                        </td>
                        <td className={cn("text-right font-mono hidden md:table-cell", (r.change_1d || 0) >= 0 ? "text-success" : "text-destructive")}>
                          {r.change_1d != null ? `${r.change_1d >= 0 ? "+" : ""}${r.change_1d.toFixed(2)}%` : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {riskTotalPages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious onClick={() => setRiskPage(p => Math.max(1, p - 1))} className={riskPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                    </PaginationItem>
                    {Array.from({ length: Math.min(riskTotalPages, 5) }, (_, i) => i + 1).map(p => (
                      <PaginationItem key={p}>
                        <PaginationLink isActive={riskPage === p} onClick={() => setRiskPage(p)} className="cursor-pointer">{p}</PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext onClick={() => setRiskPage(p => Math.min(riskTotalPages, p + 1))} className={riskPage === riskTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </Card>

        {/* Recent Hacks with pagination */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Recent Hacks
          </h3>
          <div className="space-y-3">
            {hackPageData.map((hack: any, i: number) => (
              <div key={i} className="flex items-center justify-between border-b border-border/50 pb-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{hack.name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(hack.date * 1000).toLocaleDateString()} · <span className="hidden sm:inline">{hack.technique || "N/A"}</span>
                  </p>
                </div>
                <span className="text-destructive font-mono font-bold ml-2 flex-shrink-0">
                  -{formatCurrency(hack.amount || 0)}
                </span>
              </div>
            ))}
          </div>
          {hackTotalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious onClick={() => setHackPage(p => Math.max(1, p - 1))} className={hackPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                </PaginationItem>
                {Array.from({ length: Math.min(hackTotalPages, 5) }, (_, i) => i + 1).map(p => (
                  <PaginationItem key={p}>
                    <PaginationLink isActive={hackPage === p} onClick={() => setHackPage(p)} className="cursor-pointer">{p}</PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext onClick={() => setHackPage(p => Math.min(hackTotalPages, p + 1))} className={hackPage === hackTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </Card>
      </div>
    </Layout>
  );
}
