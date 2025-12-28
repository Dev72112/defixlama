import { Layout } from "@/components/layout/Layout";
import { DexTable } from "@/components/dashboard/DexTable";
import { StatCard } from "@/components/dashboard/StatCard";
import { VolumeComparisonChart } from "@/components/dashboard/VolumeComparisonChart";
import { HistoricalVolumeChart } from "@/components/dashboard/HistoricalVolumeChart";
import { useXLayerDexVolumes } from "@/hooks/useDefiData";
import { formatCurrency } from "@/lib/api/defillama";
import { ArrowLeftRight, TrendingUp, Activity, Search, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorState } from "@/components/ErrorState";

export default function Dexs() {
  const { t } = useTranslation();
  const { data: dexes, isLoading, isError, error, refetch } = useXLayerDexVolumes();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("volume24h");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Filter and sort DEXs
  const filteredDexes = useMemo(() => {
    if (!dexes) return [];
    
    let filtered = dexes.filter((d) => {
      return (d.displayName || d.name).toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "volume24h":
          return (b.total24h || 0) - (a.total24h || 0);
        case "volume7d":
          return (b.total7d || 0) - (a.total7d || 0);
        case "change":
          return (b.change_1d || 0) - (a.change_1d || 0);
        case "name":
          return (a.displayName || a.name).localeCompare(b.displayName || b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [dexes, searchQuery, sortBy]);

  // Calculate metrics
  const total24hVolume = dexes?.reduce((acc, d) => acc + (d.total24h || 0), 0) || 0;
  const total7dVolume = dexes?.reduce((acc, d) => acc + (d.total7d || 0), 0) || 0;
  const dexCount = dexes?.length || 0;
  const avgChange = dexes && dexes.length > 0
    ? dexes.reduce((acc, d) => acc + (d.change_1d || 0), 0) / dexes.length
    : 0;

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t("dexs.title")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("dexs.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4 text-primary animate-pulse" />
            {dexCount} DEXs
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t("dexs.volume24h")}
            value={formatCurrency(total24hVolume)}
            icon={ArrowLeftRight}
            loading={isLoading}
          />
          <StatCard
            title={t("dexs.volume7d")}
            value={formatCurrency(total7dVolume)}
            icon={BarChart3}
            loading={isLoading}
          />
          <StatCard
            title={t("dexs.dexCount")}
            value={dexCount.toString()}
            icon={Activity}
            loading={isLoading}
          />
          <StatCard
            title={t("dexs.change24h")}
            value={`${Number(avgChange || 0) >= 0 ? "+" : ""}${Number(avgChange || 0).toFixed(2)}%`}
            change={avgChange}
            icon={TrendingUp}
            loading={isLoading}
          />
        </div>

        {/* Volume Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <VolumeComparisonChart dexes={dexes || []} loading={isLoading} limit={8} />
          <HistoricalVolumeChart data={dexes || []} loading={isLoading} title="DEX Volume Analysis" />
        </div>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("dexs.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="volume24h">{t("dexs.volume24h")}</SelectItem>
              <SelectItem value="volume7d">{t("dexs.volume7d")}</SelectItem>
              <SelectItem value="change">{t("dexs.change24h")}</SelectItem>
              <SelectItem value="name">{t("protocols.sortByName")}</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto flex items-center gap-2">
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Page size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => {
              const rows = [["name","displayName","24h","7d","chains"] , ...filteredDexes.map(d => [d.name || '', d.displayName || '', d.total24h || 0, d.total7d || 0, (d.chains||[]).join(';')])];
              const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = `dexs_${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
            }}>{t("protocols.exportCsv")}</Button>
          </div>
        </div>

        {/* DEX Table */}
        {/* pagination */}
        {isError ? (
          <ErrorState 
            error={error as Error}
            onRetry={() => refetch()}
          />
        ) : (() => {
          const totalPages = Math.max(1, Math.ceil(filteredDexes.length / pageSize));
          if (page > totalPages) setPage(1);
          const paged = filteredDexes.slice((page-1)*pageSize, page*pageSize);
          return (
            <>
              <DexTable dexes={paged} loading={isLoading} />
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">{t("protocols.showing")} {paged.length} {t("protocols.of")} {filteredDexes.length} DEXs</div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => setPage((p)=>Math.max(1,p-1))} disabled={page===1}>{t("protocols.prev")}</Button>
                  <div className="text-sm text-muted-foreground">{t("protocols.page")} {page} / {totalPages}</div>
                  <Button variant="ghost" onClick={() => setPage((p)=>Math.min(totalPages,p+1))} disabled={page===totalPages}>{t("protocols.next")}</Button>
                </div>
              </div>
            </>
          );
        })()}

        {/* Results count */}
        {!isLoading && (
          <p className="text-sm text-muted-foreground">
            Showing {filteredDexes.length} DEXs
          </p>
        )}
      </div>
    </Layout>
  );
}
