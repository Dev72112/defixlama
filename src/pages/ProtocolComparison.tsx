import { Layout } from "@/components/layout/Layout";
import { TierGate } from "@/components/TierGate";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAllProtocols } from "@/hooks/useDefiData";
import { useChain } from "@/contexts/ChainContext";
import { formatCurrency } from "@/lib/api/defillama";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CHART_TOOLTIP_STYLE, AXIS_TICK_STYLE } from "@/lib/chartStyles";
import { GitCompare, X, Download, FileSpreadsheet, FileJson } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend } from "recharts";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const COMPARE_COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

export default function ProtocolComparison() {
  const { data: protocols, isLoading } = useAllProtocols();
  const { selectedChain } = useChain();
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(["aave", "lido"]);
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "compare";

  const protocolList = useMemo(() => {
    if (!protocols) return [];
    let list = protocols;
    if (selectedChain.id !== "all") {
      list = protocols.filter((p: any) => p.chains?.some((c: string) => c.toLowerCase() === selectedChain.id.toLowerCase()) || p.chain?.toLowerCase() === selectedChain.id.toLowerCase());
    }
    return list.map((p: any) => ({ slug: p.slug, name: p.name })).sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [protocols, selectedChain.id]);

  const selectedProtocols = useMemo(() => {
    if (!protocols) return [];
    return selectedSlugs.map((slug) => protocols.find((p: any) => p.slug === slug)).filter(Boolean);
  }, [protocols, selectedSlugs]);

  const addProtocol = (slug: string) => { if (selectedSlugs.length < 4 && !selectedSlugs.includes(slug)) setSelectedSlugs((prev) => [...prev, slug]); };
  const removeProtocol = (slug: string) => { setSelectedSlugs((prev) => prev.filter((s) => s !== slug)); };

  const barData = useMemo(() => selectedProtocols.map((p: any) => ({ name: p.name, tvl: p.tvl || 0 })), [selectedProtocols]);

  // Deterministic radar data from real protocol properties
  const radarData = useMemo(() => {
    const metrics = ["TVL Score", "Stability", "Growth", "Chain Coverage", "Maturity"];
    return metrics.map((metric) => {
      const entry: any = { metric };
      selectedProtocols.forEach((p: any) => {
        switch (metric) {
          case "TVL Score": entry[p.name] = Math.min(100, ((p.tvl || 0) / 1e10) * 100); break;
          case "Stability": entry[p.name] = Math.min(100, Math.max(10, 80 - Math.abs(p.change_1d || 0) * 5)); break;
          case "Growth": entry[p.name] = Math.min(100, Math.max(5, 50 + (p.change_7d || 0) * 2)); break;
          case "Chain Coverage": entry[p.name] = Math.min(100, (p.chains?.length || 1) * 10); break;
          case "Maturity": {
            const ageDays = p.listedAt ? (Date.now() / 1000 - p.listedAt) / 86400 : 365;
            entry[p.name] = Math.min(100, ageDays / 10);
            break;
          }
        }
      });
      return entry;
    });
  }, [selectedProtocols]);

  const exportCSV = () => {
    if (selectedProtocols.length < 2) return;
    const headers = "Protocol,TVL,Category,Chains,7d Change\n";
    const rows = selectedProtocols.map((p: any) => `${p.name},${p.tvl || 0},${p.category || "DeFi"},${p.chains?.length || 1},${p.change_7d || 0}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `comparison-${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
    toast({ title: "Exported CSV", description: `${selectedProtocols.length} protocols exported` });
  };

  const exportJSON = () => {
    if (selectedProtocols.length < 2) return;
    const data = selectedProtocols.map((p: any) => ({ name: p.name, tvl: p.tvl, category: p.category, chains: p.chains?.length, change_7d: p.change_7d }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `comparison-${Date.now()}.json`; a.click(); URL.revokeObjectURL(url);
    toast({ title: "Exported JSON", description: `${selectedProtocols.length} protocols exported` });
  };

  return (
    <TierGate requiredTier="pro">
      <Layout>
        <ErrorBoundary>
        <div className="space-y-6 animate-fade-in">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{selectedChain.name} Protocol Comparison</h1>
              <Badge className="bg-primary/20 text-primary text-xs">PRO</Badge>
            </div>
            <p className="text-muted-foreground mt-1">Side-by-side metrics comparison (up to 4 protocols)</p>
          </div>

          <Card className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              {selectedSlugs.map((slug, i) => {
                const p = protocols?.find((pr: any) => pr.slug === slug);
                return (
                  <div key={slug} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COMPARE_COLORS[i] }} />
                    <span className="text-sm font-medium text-foreground">{p?.name || slug}</span>
                    <button onClick={() => removeProtocol(slug)} className="text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
                  </div>
                );
              })}
              {selectedSlugs.length < 4 && (
                <Select onValueChange={addProtocol}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="Add protocol..." /></SelectTrigger>
                  <SelectContent>{protocolList.filter((p: any) => !selectedSlugs.includes(p.slug)).slice(0, 50).map((p: any) => <SelectItem key={p.slug} value={p.slug}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              )}
            </div>
          </Card>

          {selectedProtocols.length >= 2 ? (
            <Tabs value={currentTab} onValueChange={(v) => setSearchParams({ tab: v })} className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="compare" className="gap-1.5"><GitCompare className="h-3.5 w-3.5" /> Compare</TabsTrigger>
                <TabsTrigger value="charts" className="gap-1.5">Charts</TabsTrigger>
                <TabsTrigger value="export" className="gap-1.5"><Download className="h-3.5 w-3.5" /> Export</TabsTrigger>
              </TabsList>

              <TabsContent value="compare" className="space-y-4">
                <Card className="p-4">
                  <h3 className="font-semibold text-foreground mb-3">Metrics Comparison</h3>
                  <div className="overflow-hidden">
                    <table className="data-table w-full">
                      <thead>
                        <tr className="bg-muted/30">
                          <th className="text-left">Metric</th>
                          {selectedProtocols.map((p: any, i) => (
                            <th key={p.slug} className="text-right">
                              <span className="flex items-center justify-end gap-2">
                                <div className="h-2 w-2 rounded-full hidden sm:block" style={{ backgroundColor: COMPARE_COLORS[i] }} />
                                <span className="truncate max-w-[80px] sm:max-w-none">{p.name}</span>
                              </span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: "TVL", render: (p: any) => formatCurrency(p.tvl || 0), best: (vals: number[]) => Math.max(...vals), getter: (p: any) => p.tvl || 0 },
                          { label: "Category", render: (p: any) => p.category || "DeFi" },
                          { label: "Chains", render: (p: any) => p.chains?.length || 1, best: (vals: number[]) => Math.max(...vals), getter: (p: any) => p.chains?.length || 1 },
                          { label: "7d Change", render: (p: any) => `${(p.change_7d || 0) >= 0 ? "+" : ""}${(p.change_7d || 0).toFixed(2)}%`, best: (vals: number[]) => Math.max(...vals), getter: (p: any) => p.change_7d || 0 },
                        ].map((metric) => {
                          const vals = metric.getter ? selectedProtocols.map((p: any) => metric.getter!(p)) : [];
                          const bestVal = metric.best ? metric.best(vals) : null;
                          return (
                            <tr key={metric.label} className="hover:bg-muted/30">
                              <td className="text-muted-foreground">{metric.label}</td>
                              {selectedProtocols.map((p: any) => {
                                const val = metric.getter ? metric.getter(p) : null;
                                const isBest = bestVal !== null && val === bestVal;
                                return (
                                  <td key={p.slug} className={cn("text-right font-mono text-foreground", isBest && "text-primary font-bold")}>
                                    {metric.render(p)} {isBest && "👑"}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="charts" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="p-4">
                    <h3 className="font-semibold text-foreground mb-3">TVL Comparison</h3>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" tick={AXIS_TICK_STYLE} />
                          <YAxis tick={AXIS_TICK_STYLE} tickFormatter={(v) => `$${(v / 1e9).toFixed(1)}B`} />
                          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v: number) => [formatCurrency(v), "TVL"]} />
                          <Bar dataKey="tvl" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <h3 className="font-semibold text-foreground mb-3">Protocol Radar</h3>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="metric" tick={AXIS_TICK_STYLE} />
                          {selectedProtocols.map((p: any, i) => <Radar key={p.slug} name={p.name} dataKey={p.name} stroke={COMPARE_COLORS[i]} fill={COMPARE_COLORS[i]} fillOpacity={0.15} />)}
                          <Legend />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="export" className="space-y-4">
                <Card className="p-6 text-center space-y-4">
                  <Download className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="font-semibold text-foreground">Export Comparison Data</h3>
                  <p className="text-sm text-muted-foreground">Download the comparison data for {selectedProtocols.length} protocols</p>
                  <div className="flex items-center justify-center gap-3">
                    <Button variant="outline" onClick={exportCSV} className="gap-2"><FileSpreadsheet className="h-4 w-4" /> Export CSV</Button>
                    <Button variant="outline" onClick={exportJSON} className="gap-2"><FileJson className="h-4 w-4" /> Export JSON</Button>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="p-8 text-center">
              <GitCompare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Select at least 2 protocols to compare</p>
            </Card>
          )}
        </div>
        </ErrorBoundary>
      </Layout>
    </TierGate>
  );
}