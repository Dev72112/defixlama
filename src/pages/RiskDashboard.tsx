import { TierGate } from "@/components/TierGate";
import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useChain } from "@/contexts/ChainContext";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/api/defillama";
import { CACHE_TIERS } from "@/lib/cacheConfig";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  Shield, AlertTriangle, CheckCircle2, XCircle,
  Loader2, Clock, TrendingDown,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, Cell, PieChart, Pie,
} from "recharts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CHART_TOOLTIP_STYLE, AXIS_TICK_STYLE, CHART_COLORS } from "@/lib/chartStyles";
import { ResponsiveDataTable, ResponsiveColumn } from "@/components/ui/responsive-table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
            name: p.name, slug: p.slug, tvl: p.tvl, category: p.category, logo: p.logo,
            riskScore, riskLevel: riskScore > 70 ? "High" : riskScore > 40 ? "Medium" : "Low",
            change_1d: p.change_1d, audited: (p.audits?.length > 0 || p.audit_links?.length > 0),
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
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "overview";

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

  const riskColumns: ResponsiveColumn<any>[] = [
    {
      key: "name", label: "Protocol", priority: "always",
      render: (r: any) => (
        <div className="flex items-center gap-2 min-w-0">
          {r.logo && <img src={r.logo} alt="" className="h-5 w-5 rounded-full flex-shrink-0" />}
          <span className="font-medium truncate max-w-[120px] sm:max-w-none">{r.name}</span>
        </div>
      ),
    },
    { key: "tvl", label: "TVL", priority: "expanded", align: "right", render: (r: any) => <span className="font-mono">{formatCurrency(r.tvl)}</span> },
    { key: "riskScore", label: "Risk Score", priority: "always", align: "right", render: (r: any) => <span className="font-mono">{r.riskScore}</span> },
    {
      key: "riskLevel", label: "Risk Level", priority: "always", align: "center",
      render: (r: any) => (
        <Badge variant="outline" className={cn(
          r.riskLevel === "High" && "border-destructive text-destructive",
          r.riskLevel === "Medium" && "border-warning text-warning",
          r.riskLevel === "Low" && "border-success text-success"
        )}>{r.riskLevel}</Badge>
      ),
    },
    { key: "audited", label: "Audited", priority: "expanded", align: "center", render: (r: any) => r.audited ? <CheckCircle2 className="h-4 w-4 text-success mx-auto" /> : <XCircle className="h-4 w-4 text-destructive/50 mx-auto" /> },
    {
      key: "change_1d", label: "24h Change", priority: "expanded", align: "right",
      render: (r: any) => (
        <span className={cn("font-mono", (r.change_1d || 0) >= 0 ? "text-success" : "text-destructive")}>
          {r.change_1d != null ? `${r.change_1d >= 0 ? "+" : ""}${r.change_1d.toFixed(2)}%` : "-"}
        </span>
      ),
    },
  ];

  return (
    <Layout>
    <TierGate requiredTier="pro">
      <ErrorBoundary>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <Shield className="h-7 w-7 text-primary" />
            {selectedChain.name} Risk Dashboard
            <Badge className="bg-primary/20 text-primary text-xs">PRO</Badge>
          </h1>
          <p className="text-muted-foreground mt-1">Protocol risk scoring, audit status, and DeFi hack history</p>
        </div>

        <Tabs value={currentTab} onValueChange={(v) => setSearchParams({ tab: v })} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="protocols">Protocols</TabsTrigger>
            <TabsTrigger value="hacks">Hack History</TabsTrigger>
          </TabsList>

        <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Avg Risk Score</p>
            <p className="text-2xl font-bold">{risks.length > 0 ? (risks.reduce((s, r) => s + r.riskScore, 0) / risks.length).toFixed(0) : "—"}</p>
          </Card>
        </div>

        {/* Risk Distribution Donut */}
        {risks.length > 0 && (() => {
          const high = risks.filter(r => r.riskLevel === "High").length;
          const medium = risks.filter(r => r.riskLevel === "Medium").length;
          const low = risks.filter(r => r.riskLevel === "Low").length;
          const distData = [
            { name: "High Risk", value: high, color: "hsl(var(--destructive))" },
            { name: "Medium Risk", value: medium, color: "hsl(45, 100%, 50%)" },
            { name: "Low Risk", value: low, color: "hsl(var(--success))" },
          ].filter(d => d.value > 0);
          return (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />Risk Distribution
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={distData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {distData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col justify-center space-y-4">
                  {distData.map(d => (
                    <div key={d.name} className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: d.color }} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{d.name}</p>
                        <p className="text-xs text-muted-foreground">{d.value} protocols ({risks.length > 0 ? ((d.value / risks.length) * 100).toFixed(1) : 0}%)</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          );
        })()}

        {/* Hack History Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-destructive" />Hack Losses by Month (Last 2 Years)
          </h3>
          {loadingHacks ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hackChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={AXIS_TICK_STYLE} />
                  <YAxis tick={AXIS_TICK_STYLE} tickFormatter={(v) => `$${(v / 1e6).toFixed(0)}M`} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value: number) => [formatCurrency(value), "Funds Lost"]} />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {hackChartData.map((_, i) => (<Cell key={i} fill="hsl(var(--destructive))" opacity={0.8} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        </TabsContent>

        <TabsContent value="protocols" className="space-y-6">
        {/* Risk Table */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />Protocol Risk Scores
          </h3>
          <ResponsiveDataTable columns={riskColumns} data={riskPageData} keyField={(r: any) => r.slug} loading={loadingRisks} loadingRows={5} emptyMessage="No protocol risk data available" />
          {riskTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button variant="ghost" size="sm" onClick={() => setRiskPage(p => Math.max(1, p - 1))} disabled={riskPage === 1}>Prev</Button>
              <span className="text-sm text-muted-foreground">{riskPage}/{riskTotalPages}</span>
              <Button variant="ghost" size="sm" onClick={() => setRiskPage(p => Math.min(riskTotalPages, p + 1))} disabled={riskPage === riskTotalPages}>Next</Button>
            </div>
          )}
        </Card>

        {/* Recent Hacks */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />Recent Hacks
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
                <span className="text-destructive font-mono font-bold ml-2 flex-shrink-0">-{formatCurrency(hack.amount || 0)}</span>
              </div>
            ))}
          </div>
          {hackTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button variant="ghost" size="sm" onClick={() => setHackPage(p => Math.max(1, p - 1))} disabled={hackPage === 1}>Prev</Button>
              <span className="text-sm text-muted-foreground">{hackPage}/{hackTotalPages}</span>
              <Button variant="ghost" size="sm" onClick={() => setHackPage(p => Math.min(hackTotalPages, p + 1))} disabled={hackPage === hackTotalPages}>Next</Button>
            </div>
          )}
        </Card>
      </div>
      </ErrorBoundary>
    </TierGate>
    </Layout>
  );
}
