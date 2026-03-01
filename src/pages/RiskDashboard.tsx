import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

function useProtocolRisks() {
  return useQuery({
    queryKey: ["protocol-risks"],
    queryFn: async () => {
      const res = await fetch("https://api.llama.fi/protocols");
      if (!res.ok) throw new Error("Failed to fetch protocols");
      const protocols = (await res.json()) as any[];

      return protocols
        .filter((p) => p.tvl > 1_000_000)
        .slice(0, 100)
        .map((p) => {
          // Simple risk score: lower TVL = higher risk, negative change = higher risk
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

export default function RiskDashboard() {
  const { data: hacks = [], isLoading: loadingHacks } = useHackHistory();
  const { data: risks = [], isLoading: loadingRisks } = useProtocolRisks();

  // Aggregate hacks by month for chart
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

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <Shield className="h-7 w-7 text-primary" />
            Risk Dashboard
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
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
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

        {/* Risk Table */}
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
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Protocol</th>
                    <th className="text-right">TVL</th>
                    <th className="text-right">Risk Score</th>
                    <th className="text-center">Risk Level</th>
                    <th className="text-center">Audited</th>
                    <th className="text-right">24h Change</th>
                  </tr>
                </thead>
                <tbody>
                  {risks.slice(0, 50).map((r) => (
                    <tr key={r.slug}>
                      <td>
                        <div className="flex items-center gap-2">
                          {r.logo && <img src={r.logo} alt="" className="h-5 w-5 rounded-full" />}
                          <span className="font-medium">{r.name}</span>
                          <span className="text-xs text-muted-foreground">{r.category}</span>
                        </div>
                      </td>
                      <td className="text-right font-mono">{formatCurrency(r.tvl)}</td>
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
                      <td className="text-center">
                        {r.audited ? (
                          <CheckCircle2 className="h-4 w-4 text-success mx-auto" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive/50 mx-auto" />
                        )}
                      </td>
                      <td className={cn("text-right font-mono", (r.change_1d || 0) >= 0 ? "text-success" : "text-destructive")}>
                        {r.change_1d != null ? `${r.change_1d >= 0 ? "+" : ""}${r.change_1d.toFixed(2)}%` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Recent Hacks */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Recent Hacks
          </h3>
          <div className="space-y-3">
            {hacks.slice(0, 15).map((hack: any, i: number) => (
              <div key={i} className="flex items-center justify-between border-b border-border/50 pb-3">
                <div>
                  <p className="font-medium">{hack.name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(hack.date * 1000).toLocaleDateString()} · {hack.technique || "N/A"}
                  </p>
                </div>
                <span className="text-destructive font-mono font-bold">
                  -{formatCurrency(hack.amount || 0)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
