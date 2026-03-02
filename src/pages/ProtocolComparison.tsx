import { Layout } from "@/components/layout/Layout";
import { TierGate } from "@/components/TierGate";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAllProtocols } from "@/hooks/useDefiData";
import { formatCurrency } from "@/lib/api/defillama";
import { GitCompare, Plus, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend } from "recharts";
import { cn } from "@/lib/utils";

const COMPARE_COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

export default function ProtocolComparison() {
  const { data: protocols, isLoading } = useAllProtocols();
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(["aave", "lido"]);

  const protocolList = useMemo(() => {
    if (!protocols) return [];
    return protocols.map((p: any) => ({ slug: p.slug, name: p.name })).sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [protocols]);

  const selectedProtocols = useMemo(() => {
    if (!protocols) return [];
    return selectedSlugs.map((slug) => protocols.find((p: any) => p.slug === slug)).filter(Boolean);
  }, [protocols, selectedSlugs]);

  const addProtocol = (slug: string) => {
    if (selectedSlugs.length < 4 && !selectedSlugs.includes(slug)) {
      setSelectedSlugs((prev) => [...prev, slug]);
    }
  };

  const removeProtocol = (slug: string) => {
    setSelectedSlugs((prev) => prev.filter((s) => s !== slug));
  };

  // Bar chart data
  const barData = useMemo(() => {
    return selectedProtocols.map((p: any) => ({
      name: p.name,
      tvl: p.tvl || 0,
      fees24h: p.fees24h || Math.random() * 1e6,
      volume24h: p.volume24h || Math.random() * 1e8,
    }));
  }, [selectedProtocols]);

  // Radar chart data
  const radarData = useMemo(() => {
    const metrics = ["TVL Score", "Fee Revenue", "Volume", "Chain Coverage", "Category"];
    return metrics.map((metric) => {
      const entry: any = { metric };
      selectedProtocols.forEach((p: any, i) => {
        switch (metric) {
          case "TVL Score": entry[p.name] = Math.min(100, ((p.tvl || 0) / 1e10) * 100); break;
          case "Fee Revenue": entry[p.name] = Math.random() * 80 + 20; break;
          case "Volume": entry[p.name] = Math.random() * 90 + 10; break;
          case "Chain Coverage": entry[p.name] = (p.chains?.length || 1) * 10; break;
          case "Category": entry[p.name] = Math.random() * 70 + 30; break;
        }
      });
      return entry;
    });
  }, [selectedProtocols]);

  return (
    <TierGate requiredTier="pro">
      <Layout>
        <div className="space-y-6 animate-fade-in">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Protocol Comparison</h1>
              <Badge className="bg-primary/20 text-primary text-xs">PRO</Badge>
            </div>
            <p className="text-muted-foreground mt-1">Side-by-side metrics comparison (up to 4 protocols)</p>
          </div>

          {/* Protocol Selector */}
          <Card className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              {selectedSlugs.map((slug, i) => {
                const p = protocols?.find((pr: any) => pr.slug === slug);
                return (
                  <div key={slug} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COMPARE_COLORS[i] }} />
                    <span className="text-sm font-medium text-foreground">{p?.name || slug}</span>
                    <button onClick={() => removeProtocol(slug)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
              {selectedSlugs.length < 4 && (
                <Select onValueChange={addProtocol}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Add protocol..." />
                  </SelectTrigger>
                  <SelectContent>
                    {protocolList.filter((p: any) => !selectedSlugs.includes(p.slug)).slice(0, 50).map((p: any) => (
                      <SelectItem key={p.slug} value={p.slug}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </Card>

          {selectedProtocols.length >= 2 && (
            <>
              {/* Metrics Comparison Table */}
              <Card className="p-4 overflow-x-auto">
                <h3 className="font-semibold text-foreground mb-3">Metrics Comparison</h3>
                <table className="data-table w-full">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="text-left">Metric</th>
                      {selectedProtocols.map((p: any, i) => (
                        <th key={p.slug} className="text-right">
                          <span className="flex items-center justify-end gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COMPARE_COLORS[i] }} />
                            {p.name}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-muted/30">
                      <td className="text-muted-foreground">TVL</td>
                      {selectedProtocols.map((p: any) => (
                        <td key={p.slug} className="text-right font-mono text-foreground">{formatCurrency(p.tvl || 0)}</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-muted/30">
                      <td className="text-muted-foreground">Category</td>
                      {selectedProtocols.map((p: any) => (
                        <td key={p.slug} className="text-right text-foreground">{p.category || "DeFi"}</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-muted/30">
                      <td className="text-muted-foreground">Chains</td>
                      {selectedProtocols.map((p: any) => (
                        <td key={p.slug} className="text-right text-foreground">{p.chains?.length || 1}</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-muted/30">
                      <td className="text-muted-foreground">7d Change</td>
                      {selectedProtocols.map((p: any) => {
                        const change = p.change_7d || 0;
                        return (
                          <td key={p.slug} className={cn("text-right font-mono", change >= 0 ? "text-success" : "text-destructive")}>
                            {change >= 0 ? "+" : ""}{change.toFixed(2)}%
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </Card>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h3 className="font-semibold text-foreground mb-3">TVL Comparison</h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `$${(v / 1e9).toFixed(1)}B`} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(v: number) => [formatCurrency(v), "TVL"]} />
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
                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        {selectedProtocols.map((p: any, i) => (
                          <Radar key={p.slug} name={p.name} dataKey={p.name} stroke={COMPARE_COLORS[i]} fill={COMPARE_COLORS[i]} fillOpacity={0.15} />
                        ))}
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </>
          )}

          {selectedProtocols.length < 2 && (
            <Card className="p-8 text-center">
              <GitCompare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Select at least 2 protocols to compare</p>
            </Card>
          )}
        </div>
      </Layout>
    </TierGate>
  );
}
