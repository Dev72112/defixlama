import { Layout } from "@/components/layout/Layout";
import { DexTable } from "@/components/dashboard/DexTable";
import { StatCard } from "@/components/dashboard/StatCard";
import { VolumeComparisonChart } from "@/components/dashboard/VolumeComparisonChart";
import { HistoricalVolumeChart } from "@/components/dashboard/HistoricalVolumeChart";
import { useChainDexVolumes } from "@/hooks/useDefiData";
import { formatCurrency } from "@/lib/api/defillama";
import { ArrowLeftRight, TrendingUp, Activity, Search, BarChart3, Download, Flame } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ErrorState } from "@/components/ErrorState";
import { useChain } from "@/contexts/ChainContext";
import { ProFeatureTeaser } from "@/components/dashboard/ProFeatureTeaser";

export default function Dexs() {
  const { t } = useTranslation();
  const { selectedChain } = useChain();
  const chainId = selectedChain.id;
  const { data: dexes, isLoading, isError, error, refetch } = useChainDexVolumes(chainId);
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "overview";

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("volume24h");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  useEffect(() => { setPage(1); }, [chainId]);

  const setTab = (tab: string) => {
    setSearchParams({ tab });
    setPage(1);
  };

  const filteredDexes = useMemo(() => {
    if (!dexes) return [];
    let filtered = dexes.filter((d) =>
      (d.displayName || d.name).toLowerCase().includes(searchQuery.toLowerCase())
    );
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "volume24h": return (b.total24h || 0) - (a.total24h || 0);
        case "volume7d": return (b.total7d || 0) - (a.total7d || 0);
        case "change": return (b.change_1d || 0) - (a.change_1d || 0);
        case "name": return (a.displayName || a.name).localeCompare(b.displayName || b.name);
        default: return 0;
      }
    });
    return filtered;
  }, [dexes, searchQuery, sortBy]);

  // Volume leaders
  const volumeLeaders = useMemo(() => {
    if (!dexes) return [];
    return [...dexes].sort((a, b) => (b.total24h || 0) - (a.total24h || 0)).slice(0, 20);
  }, [dexes]);

  // Trending DEXes by 24h change
  const trendingDexes = useMemo(() => {
    if (!dexes) return [];
    return [...dexes]
      .filter((d) => d.change_1d !== undefined && d.change_1d !== null && d.total24h > 0)
      .sort((a, b) => (b.change_1d || 0) - (a.change_1d || 0))
      .slice(0, 20);
  }, [dexes]);

  const total24hVolume = dexes?.reduce((acc, d) => acc + (d.total24h || 0), 0) || 0;
  const total7dVolume = dexes?.reduce((acc, d) => acc + (d.total7d || 0), 0) || 0;
  const dexCount = dexes?.length || 0;
  const avgChange = dexes && dexes.length > 0
    ? dexes.reduce((acc, d) => acc + (d.change_1d || 0), 0) / dexes.length : 0;

  const totalPages = Math.max(1, Math.ceil(filteredDexes.length / pageSize));
  if (page > totalPages && totalPages > 0) setPage(1);
  const paged = filteredDexes.slice((page - 1) * pageSize, page * pageSize);

  const handleExport = () => {
    const rows = [["name", "displayName", "24h", "7d", "chains"], ...filteredDexes.map(d => [d.name || '', d.displayName || '', d.total24h || 0, d.total7d || 0, (d.chains || []).join(';')])];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `dexs_${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{selectedChain.name} {t("dexs.title")}</h1>
            <p className="text-muted-foreground mt-1">{t("dexs.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4 text-primary animate-pulse" />
            {dexCount} DEXs
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title={t("dexs.volume24h")} value={formatCurrency(total24hVolume)} icon={ArrowLeftRight} loading={isLoading} />
          <StatCard title={t("dexs.volume7d")} value={formatCurrency(total7dVolume)} icon={BarChart3} loading={isLoading} />
          <StatCard title={t("dexs.dexCount")} value={dexCount.toString()} icon={Activity} loading={isLoading} />
          <StatCard title={t("dexs.change24h")} value={`${Number(avgChange || 0) >= 0 ? "+" : ""}${Number(avgChange || 0).toFixed(2)}%`} change={avgChange} icon={TrendingUp} loading={isLoading} />
        </div>

        <Tabs value={currentTab} onValueChange={setTab}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="volume">Volume</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
          </TabsList>

          {/* Tab: Overview */}
          <TabsContent value="overview">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <VolumeComparisonChart dexes={dexes || []} loading={isLoading} limit={8} />
                <HistoricalVolumeChart data={dexes || []} loading={isLoading} title="DEX Volume Analysis" />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder={t("dexs.searchPlaceholder")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="volume24h">{t("dexs.volume24h")}</SelectItem>
                    <SelectItem value="volume7d">{t("dexs.volume7d")}</SelectItem>
                    <SelectItem value="change">{t("dexs.change24h")}</SelectItem>
                    <SelectItem value="name">{t("protocols.sortByName")}</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
                  <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                    <SelectTrigger className="w-full sm:w-[120px]"><SelectValue placeholder="Page size" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={handleExport}>{t("protocols.exportCsv")}</Button>
                </div>
              </div>

              {isError ? (
                <ErrorState error={error as Error} onRetry={() => refetch()} />
              ) : (
                <>
                  <DexTable dexes={paged} loading={isLoading} />
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="text-sm text-muted-foreground">{t("protocols.showing")} {paged.length} {t("protocols.of")} {filteredDexes.length} DEXs</div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>{t("protocols.prev")}</Button>
                      <div className="text-sm text-muted-foreground">{t("protocols.page")} {page} / {totalPages}</div>
                      <Button variant="ghost" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>{t("protocols.next")}</Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* Tab: Volume Leaders */}
          <TabsContent value="volume">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Top 20 DEXes by 24h trading volume</p>
              {isError ? (
                <ErrorState error={error as Error} onRetry={() => refetch()} />
              ) : (
                <DexTable dexes={volumeLeaders} loading={isLoading} />
              )}
              <ProFeatureTeaser
                title="DEX Analytics Pro"
                description="Get pair-level volume breakdown, liquidity depth analysis, and trade flow visualization."
                requiredTier="pro"
                features={["Pair-level volume analytics", "Liquidity depth charts", "Trade flow visualization"]}
              />
            </div>
          </TabsContent>

          {/* Tab: Trending */}
          <TabsContent value="trending">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">DEXes with highest 24h volume growth</p>
              {isError ? (
                <ErrorState error={error as Error} onRetry={() => refetch()} />
              ) : isLoading ? (
                <div className="space-y-3">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="rounded-lg border border-border bg-card p-4 animate-pulse h-16" />
                  ))}
                </div>
              ) : trendingDexes.length === 0 ? (
                <div className="rounded-lg border border-border bg-card p-8 text-center">
                  <Flame className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No trending data available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {trendingDexes.map((dex, i) => (
                    <div key={dex.name} className="rounded-lg border border-border bg-card p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground font-mono text-sm w-6">{i + 1}</span>
                        <div>
                          <span className="font-medium text-foreground">{dex.displayName || dex.name}</span>
                          <p className="text-xs text-muted-foreground">{formatCurrency(dex.total24h || 0)} vol</p>
                        </div>
                      </div>
                      <span className={`font-mono text-sm ${(dex.change_1d || 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {(dex.change_1d || 0) >= 0 ? "+" : ""}{(dex.change_1d || 0).toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <ProFeatureTeaser
                title="MEV & Arbitrage Detection"
                description="Detect MEV extraction, sandwich attacks, and cross-DEX arbitrage opportunities in real-time."
                requiredTier="pro_plus"
                features={["MEV opportunity scanner", "Sandwich attack detection", "Cross-DEX arbitrage alerts"]}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
