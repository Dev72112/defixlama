import { Layout } from "@/components/layout/Layout";
import { ProtocolTable } from "@/components/dashboard/ProtocolTable";
import { StatCard } from "@/components/dashboard/StatCard";
import { useChainProtocols, useChainTVLData, useChainTVLHistory, useGlobalTVLHistory } from "@/hooks/useDefiData";
import { formatCurrency } from "@/lib/api/defillama";
import { Database, Layers, TrendingUp, Search, Activity, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HistoricalTVLChart } from "@/components/dashboard/HistoricalTVLChart";
import { ErrorState } from "@/components/ErrorState";
import { useChain } from "@/contexts/ChainContext";
import { ProFeatureTeaser } from "@/components/dashboard/ProFeatureTeaser";

export default function Protocols() {
  const { t } = useTranslation();
  const { selectedChain } = useChain();
  const chainId = selectedChain.id;
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "all";

  const { data: protocols, isLoading: protocolsLoading, isError: protocolsError, error, refetch } = useChainProtocols(chainId);
  const { data: tvl, isLoading: tvlLoading } = useChainTVLData(chainId);
  const tvlHistoryChain = chainId === "all" ? null : selectedChain.slug;
  const chainTvlHistory = useChainTVLHistory(tvlHistoryChain);
  const globalTvlHistory = useGlobalTVLHistory();
  const tvlHistory = chainId === "all" ? globalTvlHistory.data : chainTvlHistory.data;
  const tvlHistoryLoading = chainId === "all" ? globalTvlHistory.isLoading : chainTvlHistory.isLoading;

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("tvl");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const setTab = (tab: string) => {
    setSearchParams({ tab });
    setPage(1);
  };

  const categories = useMemo(() => {
    if (!protocols) return [];
    const cats = new Set(protocols.map((p) => p.category || "Other"));
    return Array.from(cats).sort();
  }, [protocols]);

  // Category stats for Category tab
  const categoryStats = useMemo(() => {
    if (!protocols) return [];
    const map = new Map<string, { count: number; tvl: number; avgChange: number }>();
    protocols.forEach((p) => {
      const cat = p.category || "Other";
      const existing = map.get(cat) || { count: 0, tvl: 0, avgChange: 0 };
      existing.count++;
      existing.tvl += p.tvl || 0;
      existing.avgChange += p.change_1d || 0;
      map.set(cat, existing);
    });
    return Array.from(map.entries())
      .map(([name, stats]) => ({ name, ...stats, avgChange: stats.avgChange / stats.count }))
      .sort((a, b) => b.tvl - a.tvl);
  }, [protocols]);

  // Trending protocols (sorted by 1d change)
  const trendingProtocols = useMemo(() => {
    if (!protocols) return [];
    return [...protocols]
      .filter((p) => p.change_1d !== undefined && p.change_1d !== null)
      .sort((a, b) => (b.change_1d || 0) - (a.change_1d || 0))
      .slice(0, 30);
  }, [protocols]);

  const filteredProtocols = useMemo(() => {
    if (!protocols) return [];
    let filtered = protocols.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.symbol?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "tvl": return (b.tvl || 0) - (a.tvl || 0);
        case "change_1d": return (b.change_1d || 0) - (a.change_1d || 0);
        case "change_7d": return (b.change_7d || 0) - (a.change_7d || 0);
        case "name": return a.name.localeCompare(b.name);
        default: return 0;
      }
    });
    return filtered;
  }, [protocols, searchQuery, sortBy, categoryFilter]);

  const totalTVL = tvl?.tvl || 0;
  const protocolCount = protocols?.length || 0;
  const avgTVL = protocolCount > 0 ? totalTVL / protocolCount : 0;
  const topGainer = useMemo(() => {
    if (!protocols || protocols.length === 0) return null;
    return protocols.reduce((max, p) => (p.change_1d || 0) > (max.change_1d || 0) ? p : max, protocols[0]);
  }, [protocols]);

  const totalPages = Math.max(1, Math.ceil(filteredProtocols.length / pageSize));
  if (page > totalPages) setPage(1);
  const pagedProtocols = filteredProtocols.slice((page - 1) * pageSize, page * pageSize);

  const exportCSV = () => {
    const rows = [
      ["name", "slug", "chain", "category", "tvl", "change_1d", "change_7d"],
      ...filteredProtocols.map((p) => [p.name, p.slug || "", p.chain || "", p.category || "", p.tvl || 0, p.change_1d || 0, p.change_7d || 0]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `protocols_${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{selectedChain.name} {t("protocols.title")}</h1>
            <p className="text-muted-foreground mt-1">{t("protocols.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4 text-primary animate-pulse" />
            {protocolCount} {t("protocols.tracked")}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title={t("protocols.totalTvl")} value={formatCurrency(totalTVL)} icon={Layers} loading={tvlLoading} />
          <StatCard title={t("dashboard.protocols")} value={protocolCount.toString()} icon={Database} loading={protocolsLoading} />
          <StatCard title={t("protocols.avgTvlPerProtocol")} value={formatCurrency(avgTVL)} icon={TrendingUp} loading={protocolsLoading || tvlLoading} />
          <StatCard title={t("protocols.topGainer")} value={topGainer?.name || "-"} change={topGainer?.change_1d} loading={protocolsLoading} />
        </div>

        <HistoricalTVLChart data={tvlHistory || []} loading={tvlHistoryLoading} title={`${selectedChain.name} TVL History`} />

        <Tabs value={currentTab} onValueChange={setTab}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="category">Category</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
          </TabsList>

          {/* Tab: All */}
          <TabsContent value="all">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder={t("protocols.searchPlaceholder")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder={t("common.category")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("protocols.allCategories")}</SelectItem>
                    {categories.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tvl">{t("protocols.sortByTvl")}</SelectItem>
                    <SelectItem value="change_1d">{t("protocols.sortByChange1d")}</SelectItem>
                    <SelectItem value="change_7d">{t("protocols.sortByChange7d")}</SelectItem>
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
                  <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
                    <Download className="h-4 w-4" />{t("protocols.exportCsv")}
                  </Button>
                </div>
              </div>

              {protocolsError ? (
                <ErrorState error={error as Error} onRetry={() => refetch()} />
              ) : (
                <ProtocolTable protocols={pagedProtocols} loading={protocolsLoading} showCategory={true} />
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">{t("protocols.showing")} {pagedProtocols.length} {t("protocols.of")} {filteredProtocols.length} {t("protocols.results")}</div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>{t("protocols.prev")}</Button>
                  <span className="text-sm text-muted-foreground">{t("protocols.page")} {page} / {totalPages}</span>
                  <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>{t("protocols.next")}</Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Category */}
          <TabsContent value="category">
            <div className="space-y-4">
              {protocolsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="rounded-lg border border-border bg-card p-4 animate-pulse h-28" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryStats.map((cat) => (
                    <div
                      key={cat.name}
                      className="rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors cursor-pointer"
                      onClick={() => { setCategoryFilter(cat.name); setTab("all"); }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-foreground text-sm">{cat.name}</h4>
                        <span className="text-xs text-muted-foreground">{cat.count} protocols</span>
                      </div>
                      <div className="text-lg font-bold text-foreground">{formatCurrency(cat.tvl)}</div>
                      <div className={`text-xs mt-1 ${cat.avgChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                        Avg 24h: {cat.avgChange >= 0 ? "+" : ""}{cat.avgChange.toFixed(2)}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <ProFeatureTeaser
                title="Risk Dashboard"
                description="Get protocol risk scores, audit tracking, and security alerts for every category."
                requiredTier="pro"
                features={["Smart contract risk scores", "Audit history tracking", "Real-time security alerts"]}
              />
            </div>
          </TabsContent>

          {/* Tab: Trending */}
          <TabsContent value="trending">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Top movers by 24h TVL change</p>
              {protocolsError ? (
                <ErrorState error={error as Error} onRetry={() => refetch()} />
              ) : (
                <ProtocolTable protocols={trendingProtocols} loading={protocolsLoading} showCategory={true} />
              )}
              <ProFeatureTeaser
                title="Advanced Trend Analytics"
                description="Unlock capital flow analysis, protocol lifecycle tracking, and predictive trend models."
                requiredTier="pro_plus"
                features={["Capital concentration metrics", "Protocol growth velocity", "TVL prediction models"]}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
