import { Layout } from "@/components/layout/Layout";
import { YieldTable } from "@/components/dashboard/YieldTable";
import { StatCard } from "@/components/dashboard/StatCard";
import { useChainYieldPools } from "@/hooks/useDefiData";
import { formatCurrency } from "@/lib/api/defillama";
import { TrendingUp, Droplets, Search, Activity, Percent, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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

  // Get unique projects
  const projects = useMemo(() => {
    if (!pools) return [];
    const projs = new Set(pools.map((p) => p.project));
    return Array.from(projs).sort();
  }, [pools]);

  // Filter and sort pools
  const filteredPools = useMemo(() => {
    if (!pools) return [];
    
    let filtered = pools.filter((p) => {
      const matchesSearch = p.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.project.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProject = projectFilter === "all" || p.project === projectFilter;
      return matchesSearch && matchesProject;
    });

    // Sort
    filtered.sort((a, b) => {
      const apyA = (a.apyBase || 0) + (a.apyReward || 0);
      const apyB = (b.apyBase || 0) + (b.apyReward || 0);
      
      switch (sortBy) {
        case "apy":
          return apyB - apyA;
        case "tvl":
          return (b.tvlUsd || 0) - (a.tvlUsd || 0);
        case "symbol":
          return a.symbol.localeCompare(b.symbol);
        default:
          return 0;
      }
    });

    return filtered;
  }, [pools, searchQuery, sortBy, projectFilter]);

  // Calculate metrics
  const totalTVL = pools?.reduce((acc, p) => acc + (p.tvlUsd || 0), 0) || 0;
  const poolCount = pools?.length || 0;
  const avgApy = pools && pools.length > 0
    ? pools.reduce((acc, p) => acc + ((p.apyBase || 0) + (p.apyReward || 0)), 0) / pools.length
    : 0;
  const maxApy = pools && pools.length > 0
    ? Math.max(...pools.map((p) => (p.apyBase || 0) + (p.apyReward || 0)))
    : 0;

  const handleExport = () => {
    if (!filteredPools.length) return;
    exportToCSV(
      filteredPools.map(p => ({
        Symbol: p.symbol,
        Project: p.project,
        APY: ((p.apyBase || 0) + (p.apyReward || 0)).toFixed(2),
        TVL: p.tvlUsd || 0,
      })),
      "yield_pools"
    );
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{selectedChain.name} {t('yields.title')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('yields.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              {t('common.exportCsv')}
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4 text-primary animate-pulse" />
              {t('yields.maxApy')}: {Number(isNaN(maxApy) ? 0 : maxApy).toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t('yields.totalTvl')}
            value={formatCurrency(totalTVL)}
            icon={Droplets}
            loading={isLoading}
          />
          <StatCard
            title={t('yields.activePools')}
            value={poolCount.toString()}
            icon={Activity}
            loading={isLoading}
          />
          <StatCard
            title={t('yields.avgApy')}
            value={`${Number(isNaN(avgApy) ? 0 : avgApy).toFixed(2)}%`}
            icon={TrendingUp}
            loading={isLoading}
          />
          <StatCard
            title={t('yields.maxApy')}
            value={`${Number(isNaN(maxApy) ? 0 : maxApy).toFixed(2)}%`}
            icon={Percent}
            loading={isLoading}
          />
        </div>

        {/* Yield Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <YieldDistributionChart pools={pools || []} loading={isLoading} />
          <TopYieldPools pools={pools || []} loading={isLoading} />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('yields.searchPools')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('yields.project')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('yields.allProjects')}</SelectItem>
              {projects.map((proj) => (
                <SelectItem key={proj} value={proj} className="capitalize">
                  {proj}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('common.sortBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apy">{t('yields.apyHighToLow')}</SelectItem>
              <SelectItem value="tvl">{t('yields.tvlHighToLow')}</SelectItem>
              <SelectItem value="symbol">{t('yields.symbolAZ')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Yield Table */}
        {isError ? (
          <ErrorState 
            error={error as Error}
            onRetry={() => refetch()}
          />
        ) : (
          <YieldTable pools={filteredPools} loading={isLoading} />
        )}

        {/* Results count */}
        {!isLoading && (
          <p className="text-sm text-muted-foreground">
            {t('common.showing')} {filteredPools.length} {t('common.of')} {poolCount} {t('yields.pools')}
          </p>
        )}
      </div>
    </Layout>
  );
}
