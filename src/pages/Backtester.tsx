import { TierGate } from "@/components/TierGate";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBacktesting, useProtocolList } from "@/hooks/useBacktesting";
import { useChain } from "@/contexts/ChainContext";
import { formatCurrency } from "@/lib/api/defillama";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CHART_TOOLTIP_STYLE, AXIS_TICK_STYLE } from "@/lib/chartStyles";
import { useState, useMemo, useDeferredValue } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Calculator, TrendingUp, TrendingDown, Shield, BarChart3,
  Search, Loader2, History, Play, Trash2,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid,
} from "recharts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ResponsiveDataTable, ResponsiveColumn } from "@/components/ui/responsive-table";
import { cn } from "@/lib/utils";

interface SavedBacktest {
  id: string;
  protocolName: string;
  protocolSlug: string;
  initialInvestment: number;
  durationDays: number;
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  createdAt: string;
}

export default function Backtester() {
  const { params, updateParams, result, isLoading } = useBacktesting();
  const { data: protocols = [], isLoading: loadingProtocols } = useProtocolList();
  const { selectedChain } = useChain();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "strategy";
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [savedTests, setSavedTests] = useState<SavedBacktest[]>([]);

  const setTab = (tab: string) => setSearchParams({ tab });

  const chainFiltered = useMemo(() => {
    if (selectedChain.id === "all") return protocols;
    return protocols.filter((p: any) =>
      p.chains?.some((c: string) => c.toLowerCase() === selectedChain.id.toLowerCase()) ||
      p.chain?.toLowerCase() === selectedChain.id.toLowerCase()
    );
  }, [protocols, selectedChain.id]);

  const filtered = chainFiltered.filter(
    (p: any) =>
      p.name.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      p.slug.toLowerCase().includes(deferredSearch.toLowerCase())
  );

  const selectedProtocol = protocols.find((p: any) => p.slug === params.protocolSlug);

  const saveBacktest = () => {
    if (!result || !selectedProtocol) return;
    const newTest: SavedBacktest = {
      id: Date.now().toString(),
      protocolName: selectedProtocol.name,
      protocolSlug: selectedProtocol.slug,
      initialInvestment: params.initialInvestment,
      durationDays: params.durationDays,
      totalReturn: result.totalReturnPercent,
      sharpeRatio: result.sharpeRatio,
      maxDrawdown: result.maxDrawdown,
      createdAt: new Date().toISOString(),
    };
    setSavedTests((prev) => [newTest, ...prev].slice(0, 20));
    setTab("history");
  };

  const deleteBacktest = (id: string) => {
    setSavedTests((prev) => prev.filter((t) => t.id !== id));
  };

  const loadBacktest = (test: SavedBacktest) => {
    updateParams({ protocolSlug: test.protocolSlug, initialInvestment: test.initialInvestment, durationDays: test.durationDays });
    setTab("strategy");
  };

  const historyColumns: ResponsiveColumn<SavedBacktest>[] = [
    { key: "protocolName", label: "Protocol", priority: "always", render: (t) => <span className="font-medium text-foreground">{t.protocolName}</span> },
    { key: "initialInvestment", label: "Investment", priority: "expanded", align: "right", render: (t) => <span className="font-mono text-foreground">{formatCurrency(t.initialInvestment)}</span> },
    { key: "durationDays", label: "Duration", priority: "desktop", align: "right", render: (t) => <span className="text-muted-foreground">{t.durationDays}d</span> },
    { key: "totalReturn", label: "Return", priority: "always", align: "right", render: (t) => <span className={cn("font-mono font-medium", t.totalReturn >= 0 ? "text-success" : "text-destructive")}>{t.totalReturn >= 0 ? "+" : ""}{t.totalReturn.toFixed(2)}%</span> },
    { key: "sharpeRatio", label: "Sharpe", priority: "expanded", align: "right", render: (t) => <span className="font-mono text-muted-foreground">{t.sharpeRatio.toFixed(2)}</span> },
    { key: "maxDrawdown", label: "Drawdown", priority: "expanded", align: "right", render: (t) => <span className="font-mono text-destructive">-{t.maxDrawdown.toFixed(2)}%</span> },
    { key: "actions", label: "", priority: "always", align: "center", render: (t) => (
      <div className="flex items-center gap-2">
        <button onClick={() => loadBacktest(t)} className="text-muted-foreground hover:text-primary transition-colors"><Play className="h-4 w-4" /></button>
        <button onClick={() => deleteBacktest(t.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>
      </div>
    ) },
  ];

  return (
    <Layout>
    <TierGate requiredTier="pro">
      <ErrorBoundary>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
              <Calculator className="h-7 w-7 text-primary" />
              {selectedChain.name} Backtester
              <Badge className="bg-primary/20 text-primary text-xs">PRO</Badge>
            </h1>
            <p className="text-muted-foreground mt-1">
              Simulate historical performance based on protocol TVL trends
            </p>
          </div>
          {result && selectedProtocol && (
            <Button variant="outline" size="sm" onClick={saveBacktest} className="gap-2">
              <History className="h-4 w-4" /> Save Result
            </Button>
          )}
        </div>

        <Tabs value={currentTab} onValueChange={setTab}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="strategy" className="gap-1.5"><Calculator className="h-3.5 w-3.5" /> Strategy</TabsTrigger>
            <TabsTrigger value="results" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Results</TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5"><History className="h-3.5 w-3.5" /> History ({savedTests.length})</TabsTrigger>
          </TabsList>

          {/* Tab: Strategy */}
          <TabsContent value="strategy">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="p-6 space-y-6">
                <h3 className="text-lg font-semibold">Strategy Builder</h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Protocol ({chainFiltered.length} on {selectedChain.name})</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search protocols..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1 border border-border rounded-lg p-2">
                    {loadingProtocols ? (
                      <div className="flex items-center justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                    ) : (
                      filtered.slice(0, 50).map((p: any) => (
                        <button key={p.slug} onClick={() => updateParams({ protocolSlug: p.slug })}
                          className={cn("flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm transition-colors",
                            params.protocolSlug === p.slug ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
                          )}>
                          {p.logo && <img src={p.logo} alt="" className="h-5 w-5 rounded-full" />}
                          <span className="truncate">{p.name}</span>
                          <span className="ml-auto text-xs text-muted-foreground">{formatCurrency(p.tvl)}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Initial Investment</label>
                  <Input type="number" value={params.initialInvestment} onChange={(e) => updateParams({ initialInvestment: parseFloat(e.target.value) || 0 })} min={100} step={1000} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Duration: {params.durationDays} days</label>
                  <Slider value={[params.durationDays]} onValueChange={([v]) => updateParams({ durationDays: v })} min={30} max={730} step={30} />
                  <div className="flex justify-between text-xs text-muted-foreground"><span>30d</span><span>1Y</span><span>2Y</span></div>
                </div>
                <Button onClick={() => setTab("results")} className="w-full gap-2" disabled={!params.protocolSlug}>
                  <Play className="h-4 w-4" /> Run Backtest
                </Button>
              </Card>

              <Card className="p-6 lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                {selectedProtocol ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-xs text-muted-foreground">Selected Protocol</p>
                      <p className="text-lg font-bold text-foreground">{selectedProtocol.name}</p>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-xs text-muted-foreground">Current TVL</p>
                      <p className="text-lg font-bold text-foreground">{formatCurrency(selectedProtocol.tvl)}</p>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-xs text-muted-foreground">Investment</p>
                      <p className="text-lg font-bold text-foreground">{formatCurrency(params.initialInvestment)}</p>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="text-lg font-bold text-foreground">{params.durationDays} days</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <Calculator className="h-12 w-12 mb-4 opacity-30" />
                    <p>Select a protocol to configure your backtest</p>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Results */}
          <TabsContent value="results">
            <Card className="p-6 space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Backtest Results
                {selectedProtocol && <Badge variant="outline" className="ml-2">{selectedProtocol.name}</Badge>}
              </h3>

              {isLoading ? (
                <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : !result ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <Calculator className="h-12 w-12 mb-4 opacity-30" />
                  <p>Select a protocol and run the backtest</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => setTab("strategy")}>Go to Strategy</Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-lg border border-border p-3 bg-card">
                      <p className="text-xs text-muted-foreground">Projected Value</p>
                      <p className="text-lg font-bold">{formatCurrency(result.projectedValue)}</p>
                    </div>
                    <div className="rounded-lg border border-border p-3 bg-card">
                      <p className="text-xs text-muted-foreground">Total Return</p>
                      <p className={cn("text-lg font-bold", result.totalReturn >= 0 ? "text-success" : "text-destructive")}>
                        {result.totalReturn >= 0 ? "+" : ""}{result.totalReturnPercent.toFixed(2)}%
                      </p>
                    </div>
                    <div className="rounded-lg border border-border p-3 bg-card">
                      <p className="text-xs text-muted-foreground">Max Drawdown</p>
                      <p className="text-lg font-bold text-destructive">-{result.maxDrawdown.toFixed(2)}%</p>
                    </div>
                    <div className="rounded-lg border border-border p-3 bg-card">
                      <p className="text-xs text-muted-foreground">Sharpe Ratio</p>
                      <p className="text-lg font-bold">{result.sharpeRatio.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Annualized Return</p>
                      <p className={cn("text-2xl font-bold", result.totalReturnPercent >= 0 ? "text-success" : "text-destructive")}>
                        {((result.totalReturnPercent / (params.durationDays / 365)) || 0).toFixed(1)}%
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">Extrapolated from {params.durationDays}d window</p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Win Rate</p>
                      <p className="text-2xl font-bold">
                        {result.dailyReturns.length > 1
                          ? ((result.dailyReturns.filter((d: any, i: number) => i > 0 && d.value >= result.dailyReturns[i - 1].value).length / (result.dailyReturns.length - 1)) * 100).toFixed(1)
                          : "—"}%
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">% of days with positive returns</p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Risk-Adjusted</p>
                      <p className="text-2xl font-bold">
                        {result.sharpeRatio > 2 ? "Excellent" : result.sharpeRatio > 1 ? "Good" : result.sharpeRatio > 0 ? "Moderate" : "Poor"}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">Sharpe {result.sharpeRatio.toFixed(2)} — {result.sharpeRatio > 1 ? "returns justify the risk" : "consider diversifying"}</p>
                    </div>
                  </div>

                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={result.dailyReturns}>
                        <defs>
                          <linearGradient id="backtestGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={AXIS_TICK_STYLE} tickCount={6} />
                        <YAxis tick={AXIS_TICK_STYLE} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value: number) => [formatCurrency(value), "Portfolio Value"]} />
                        <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="url(#backtestGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </Card>
          </TabsContent>

          {/* Tab: History */}
          <TabsContent value="history">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Compare saved backtest results to identify best-performing strategies</p>
              {savedTests.length === 0 ? (
                <Card className="p-8 text-center">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground mb-2">No Saved Backtests</h3>
                  <p className="text-sm text-muted-foreground">Run a backtest and save it to build your comparison history</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => setTab("strategy")}>Start Backtesting</Button>
                </Card>
              ) : (
                <ResponsiveDataTable columns={historyColumns} data={savedTests} keyField="id" />
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Card className="p-4 bg-muted/30">
          <p className="text-sm text-muted-foreground">
            ⚠️ Backtesting uses historical TVL data as a proxy. Past performance does not guarantee future results. Returns are dampened to simulate realistic portfolio behavior.
          </p>
        </Card>
      </div>
      </ErrorBoundary>
    </TierGate>
    </Layout>
  );
}
