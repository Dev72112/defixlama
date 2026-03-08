import { Layout } from "@/components/layout/Layout";
import { YieldTable } from "@/components/dashboard/YieldTable";
import { StatCard } from "@/components/dashboard/StatCard";
import { useChainYieldPools } from "@/hooks/useDefiData";
import { formatCurrency } from "@/lib/api/defillama";
import { TrendingUp, Droplets, Search, Activity, Percent, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { YieldDistributionChart } from "@/components/dashboard/YieldDistributionChart";
import { TopYieldPools } from "@/components/dashboard/TopYieldPools";
import { exportToCSV } from "@/lib/export";
import { ErrorState } from "@/components/ErrorState";
import { useChain } from "@/contexts/ChainContext";

export default function Yields() {
  const { t } = useTranslation();
  const { selectedChain } = useChain();
  const chainId = selectedChain.id;
  const { data: pools, isLoading, isError, error, refetch } = useChainYieldPools(chainId);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("apy");
  const [projectFilter, setProjectFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  useEffect(() => { setPage(1); }, [chainId]);

  const projects = useMemo(() => {
    if (!pools) return [];
    const projs = new Set(pools.map((p) => p.project));
    return Array.from(projs).sort();
  }, [pools]);

  const filteredPools = useMemo(() => {
    if (!pools) return [];
    let filtered = pools.filter((p) => {
      const matchesSearch = p.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.project.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProject = projectFilter === "all" || p.project === projectFilter;
      return matchesSearch && matchesProject;
    });
    filtered.sort((a, b) => {
      const apyA = (a.apyBase || 0) + (a.apyReward || 0);
      const apyB = (b.apyBase || 0) + (b.apyReward || 0);
      switch (sortBy) {
        case "apy": return apyB - apyA;
        case "tvl": return (b.tvlUsd || 0) - (a.tvlUsd || 0);
        case "symbol": return a.symbol.localeCompare(b.symbol);
        default: return 0;
      }
    });
    return filtered;
  }, [pools, searchQuery, sortBy, projectFilter]);

  const totalTVL = pools?.reduce((acc, p) => acc + (p.tvlUsd || 0), 0) || 0;
  const poolCount = pools?.length || 0;
  const avgApy = pools && pools.length > 0
    ? pools.reduce((acc, p) => acc + ((p.apyBase || 0) + (p.apyReward || 0)), 0) / pools.length : 0;
  const maxApy = pools && pools.length > 0
    ? Math.max(...pools.map((p) => (p.apyBase || 0) + (p.apyReward || 0))) : 0;

  const totalPages = Math.max(1, Math.ceil(filteredPools.length / pageSize));
  if (page > totalPages && totalPages > 0) setPage(1);
  const paginatedPools = filteredPools.slice((page - 1) * pageSize, page * pageSize);

  const chartPools = useMemo(() => {
    if (!pools) return [];
    return [...pools].sort((a, b) => (b.tvlUsd || 0) - (a.tvlUsd || 0)).slice(0, 20);
  }, [pools]);

  const handleExport = () => {
    if (!filteredPools.length) return;
    exportToCSV(
      filteredPools.map(p => ({
        Symbol: p.symbol, Project: p.project,
        APY: ((p.apyBase || 0) + (p.apyReward || 0)).toFixed(2), TVL: p.tvlUsd || 0,
      })),
      "yield_pools"
    );
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{selectedChain.name} {t('yields.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('yields.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />{t('common.exportCsv')}
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4 text-primary animate-pulse" />
              {t('yields.maxApy')}: {Number(isNaN(maxApy) ? 0 : maxApy).toFixed(2)}%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title={t('yields.totalTvl')} value={formatCurrency(totalTVL)} icon={Droplets} loading={isLoading} />
          <StatCard title={t('yields.activePools')} value={poolCount.toString()} icon={Activity} loading={isLoading} />
          <StatCard title={t('yields.avgApy')} value={`${Number(isNaN(avgApy) ? 0 : avgApy).toFixed(2)}%`} icon={TrendingUp} loading={isLoading} />
          <StatCard title={t('yields.maxApy')} value={`${Number(isNaN(maxApy) ? 0 : maxApy).toFixed(2)}%`} icon={Percent} loading={isLoading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <YieldDistributionChart pools={chartPools} loading={isLoading} />
          <TopYieldPools pools={chartPools} loading={isLoading} />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder={t('yields.searchPools')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t('yields.project')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('yields.allProjects')}</SelectItem>
              {projects.map((proj) => (<SelectItem key={proj} value={proj} className="capitalize">{proj}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t('common.sortBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apy">{t('yields.apyHighToLow')}</SelectItem>
              <SelectItem value="tvl">{t('yields.tvlHighToLow')}</SelectItem>
              <SelectItem value="symbol">{t('yields.symbolAZ')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isError ? (
          <ErrorState error={error as Error} onRetry={() => refetch()} />
        ) : (
          <YieldTable pools={paginatedPools} loading={isLoading} />
        )}

        {/* Pagination controls */}
        {!isLoading && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {t('common.showing')} {Math.min((page - 1) * pageSize + 1, filteredPools.length)}-
              {Math.min(page * pageSize, filteredPools.length)} {t('common.of')} {filteredPools.length} {t('yields.pools')}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t('common.perPage')}</span>
                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                  <SelectTrigger className="w-[90px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
      </div>
    </Layout>
  );
}
