import { Layout } from "@/components/layout/Layout";
import { StatCard } from "@/components/dashboard/StatCard";
import { useChainsTVL } from "@/hooks/useDefiData";
import { formatCurrency, ChainData } from "@/lib/api/defillama";
import { Layers, TrendingUp, Search, PieChart, Globe, Activity, GitBranch, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { ChainComparisonChart } from "@/components/dashboard/ChainComparisonChart";
import { TVLDistributionChart } from "@/components/dashboard/TVLDistributionChart";
import { ResponsiveDataTable, ResponsiveColumn } from "@/components/ui/responsive-table";
import { ProFeatureTeaser } from "@/components/dashboard/ProFeatureTeaser";

export default function Chains() {
  const { t } = useTranslation();
  const { data: chains, isLoading } = useChainsTVL();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortBy, setSortBy] = useState("tvl");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "overview";
  useEffect(() => { setPage(1); }, [searchQuery, sortBy]);
  
  const filteredChains = useMemo(() => {
    if (!chains) return [];
    let filtered = chains.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "tvl": return (b.tvl || 0) - (a.tvl || 0);
        case "name": return a.name.localeCompare(b.name);
        default: return (b.tvl || 0) - (a.tvl || 0);
      }
    });
    return filtered;
  }, [chains, searchQuery, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredChains.length / pageSize));
  if (page > totalPages) setPage(1);
  const paginatedChains = filteredChains.slice((page - 1) * pageSize, page * pageSize);

  const xlayer = chains?.find((c) => c.name.toLowerCase() === "xlayer" || c.name.toLowerCase() === "x layer");
  const xlayerRank = filteredChains.findIndex((c) => c.name.toLowerCase() === "xlayer" || c.name.toLowerCase() === "x layer") + 1;
  const totalTVL = chains?.reduce((acc, c) => acc + (c.tvl || 0), 0) || 0;
  const chainCount = chains?.length || 0;
  const xlayerShare = xlayer && totalTVL > 0 ? (xlayer.tvl / totalTVL) * 100 : 0;

  // Growth tab data
  const growthChains = useMemo(() => {
    if (!chains) return [];
    return [...chains]
      .filter(c => c.tvl > 0)
      .sort((a, b) => (b.tvl || 0) - (a.tvl || 0))
      .slice(0, 30);
  }, [chains]);

  // Ecosystem tab data
  const ecosystemData = useMemo(() => {
    if (!chains) return { large: [] as any[], medium: [] as any[], small: [] as any[] };
    const sorted = [...chains].sort((a, b) => (b.tvl || 0) - (a.tvl || 0));
    return {
      large: sorted.filter(c => c.tvl >= 1_000_000_000),
      medium: sorted.filter(c => c.tvl >= 100_000_000 && c.tvl < 1_000_000_000),
      small: sorted.filter(c => c.tvl > 0 && c.tvl < 100_000_000),
    };
  }, [chains]);

  const columns: ResponsiveColumn<any>[] = [
    {
      key: "rank", label: "#", priority: "desktop", className: "w-12",
      render: (_chain: any, index: number) => <span className="text-muted-foreground font-mono text-sm">{(page - 1) * pageSize + index + 1}</span>,
    },
    {
      key: "name", label: t('chains.chain'), priority: "always",
      render: (chain: any) => {
        const isXLayer = chain.name.toLowerCase() === "xlayer" || chain.name.toLowerCase() === "x layer";
        return (
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={cn(
              "h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0",
              isXLayer ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            )}>
              {(chain.tokenSymbol || chain.name.slice(0, 2)).slice(0, 3)}
            </div>
            <span className={cn("font-medium truncate max-w-[120px] sm:max-w-none", isXLayer ? "text-primary" : "text-foreground")}>
              {chain.name}
            </span>
          </div>
        );
      },
    },
    {
      key: "tvl", label: t('chains.tvl'), priority: "always", align: "right",
      render: (chain: any) => <span className="font-mono font-medium text-foreground whitespace-nowrap text-sm sm:text-base">{formatCurrency(chain.tvl)}</span>,
    },
    {
      key: "share", label: t('chains.marketShare'), priority: "expanded", align: "right",
      render: (chain: any) => {
        const share = totalTVL > 0 ? (chain.tvl / totalTVL) * 100 : 0;
        return (
          <div className="flex items-center justify-end gap-2">
            <div className="w-16 lg:w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(share * 2, 100)}%` }} />
            </div>
            <span className="font-mono text-sm text-muted-foreground w-14 lg:w-16 text-right">{share.toFixed(2)}%</span>
          </div>
        );
      },
    },
  ];

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t('chains.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('chains.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4 text-primary animate-pulse" />
            {chainCount} {t('chains.chainsTracked')}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title={t('chains.totalDefiTvl')} value={formatCurrency(totalTVL)} icon={Globe} loading={isLoading} />
          <StatCard title={t('chains.totalChains')} value={chainCount.toString()} icon={PieChart} loading={isLoading} />
          <StatCard title={t('chains.xlayerTvl')} value={formatCurrency(xlayer?.tvl || 0)} icon={Layers} loading={isLoading} />
          <StatCard title={t('chains.xlayerRank')} value={xlayerRank > 0 ? `#${xlayerRank}` : "-"} icon={TrendingUp} loading={isLoading} />
        </div>

        {xlayer && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">X</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">XLayer</h3>
                  <p className="text-muted-foreground">{t('chains.rank')} #{xlayerRank} • {xlayerShare.toFixed(4)}% {t('chains.ofTotalDefiTvl')}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{formatCurrency(xlayer.tvl)}</p>
                <p className="text-sm text-muted-foreground">{t('chains.totalValueLocked')}</p>
              </div>
            </div>
          </div>
        )}

        <Tabs value={currentTab} onValueChange={(v) => setSearchParams({ tab: v })} className="w-full">
          <div className="overflow-x-auto">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="overview" className="gap-2"><Globe className="h-4 w-4" />Overview</TabsTrigger>
              <TabsTrigger value="growth" className="gap-2"><TrendingUp className="h-4 w-4" />Growth</TabsTrigger>
              <TabsTrigger value="ecosystem" className="gap-2"><GitBranch className="h-4 w-4" />Ecosystem</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChainComparisonChart chains={filteredChains} loading={isLoading} highlightChain="xlayer" />
              <TVLDistributionChart chains={filteredChains} loading={isLoading} />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder={t('chains.searchChains')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tvl">Sort by TVL</SelectItem>
                  <SelectItem value="name">Sort by Name</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <ResponsiveDataTable
              columns={columns}
              data={paginatedChains}
              keyField={(chain: any) => chain.name}
              onRowClick={(chain) => navigate(`/chains/${chain.name.toLowerCase().replace(/\s+/g, '-')}`)}
              loading={isLoading}
              loadingRows={10}
              emptyMessage="No chains found"
            />

            {!isLoading && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  {t('common.showing')} {Math.min((page - 1) * pageSize + 1, filteredChains.length)}-
                  {Math.min(page * pageSize, filteredChains.length)} {t('common.of')} {filteredChains.length} {t('chains.chains')}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground hidden sm:inline">{t('common.perPage')}</span>
                    <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                      <SelectTrigger className="w-[70px] sm:w-[90px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                    <span className="text-sm text-muted-foreground">{page}/{totalPages}</span>
                    <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                  </div>
                </div>
              </div>
            )}

            <ProFeatureTeaser
              title="Cross-Chain Flow Analysis"
              description="Track capital flows between chains in real-time with bridge volume analytics and migration patterns."
              requiredTier="pro"
              icon={<GitBranch className="h-5 w-5 text-primary/70" />}
              features={["Bridge volume tracking", "Capital migration alerts", "Chain correlation analysis"]}
            />
          </TabsContent>

          <TabsContent value="growth" className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-semibold text-foreground mb-4">Top 30 Chains by TVL</h3>
              <p className="text-sm text-muted-foreground mb-4">Largest chains ranked by total value locked across all protocols.</p>
              {isLoading ? (
                <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-12 rounded-lg" />)}</div>
              ) : (
                <div className="space-y-2">
                  {growthChains.map((chain, i) => {
                    const share = totalTVL > 0 ? (chain.tvl / totalTVL) * 100 : 0;
                    return (
                      <div key={chain.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/chains/${chain.name.toLowerCase().replace(/\s+/g, '-')}`)}>
                        <span className="text-muted-foreground font-mono text-sm w-8">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{chain.name}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden hidden sm:block">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(share * 2, 100)}%` }} />
                          </div>
                          <span className="font-mono font-medium text-foreground text-sm w-24 text-right">{formatCurrency(chain.tvl)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <ProFeatureTeaser
              title="Chain Risk Scoring"
              description="AI-powered risk assessment for each chain based on validator count, TVL concentration, and historical exploit data."
              requiredTier="pro_plus"
              icon={<BarChart3 className="h-5 w-5 text-primary/70" />}
              features={["Chain health scoring (A-F)", "Validator decentralization metrics", "Historical exploit timeline"]}
            />
          </TabsContent>

          <TabsContent value="ecosystem" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg border border-border bg-card p-4 text-center">
                <p className="text-3xl font-bold text-primary">{ecosystemData.large.length}</p>
                <p className="text-sm text-muted-foreground mt-1">Mega Chains (&gt;$1B TVL)</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 text-center">
                <p className="text-3xl font-bold text-foreground">{ecosystemData.medium.length}</p>
                <p className="text-sm text-muted-foreground mt-1">Mid-Cap Chains ($100M-$1B)</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 text-center">
                <p className="text-3xl font-bold text-muted-foreground">{ecosystemData.small.length}</p>
                <p className="text-sm text-muted-foreground mt-1">Emerging Chains (&lt;$100M)</p>
              </div>
            </div>

            {[
              { label: "🏛️ Mega Chains (>$1B TVL)", data: ecosystemData.large },
              { label: "📊 Mid-Cap Chains ($100M-$1B)", data: ecosystemData.medium },
              { label: "🌱 Emerging Chains (<$100M)", data: ecosystemData.small.slice(0, 20) },
            ].map(({ label, data }) => (
              <div key={label} className="rounded-lg border border-border bg-card p-4">
                <h3 className="font-semibold text-foreground mb-3">{label}</h3>
                {data.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No chains in this tier</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {data.map((chain) => (
                      <button key={chain.name}
                        className="px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted text-sm text-foreground transition-colors"
                        onClick={() => navigate(`/chains/${chain.name.toLowerCase().replace(/\s+/g, '-')}`)}>
                        {chain.name} <span className="text-muted-foreground ml-1">{formatCurrency(chain.tvl)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <ProFeatureTeaser
              title="Ecosystem Diversity Metrics"
              description="Analyze protocol diversity, developer activity, and ecosystem health scores for each chain."
              requiredTier="pro"
              icon={<PieChart className="h-5 w-5 text-primary/70" />}
              features={["Protocol count per chain", "Category diversity index", "Developer activity tracking"]}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}