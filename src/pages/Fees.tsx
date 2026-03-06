import { Layout } from "@/components/layout/Layout";
import { StatCard } from "@/components/dashboard/StatCard";
import { useChainFees } from "@/hooks/useDefiData";
import { useChain } from "@/contexts/ChainContext";
import { formatCurrency } from "@/lib/api/defillama";
import { BarChart3, TrendingUp, Search, DollarSign, Activity, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { FeeTrendChart } from "@/components/dashboard/FeeTrendChart";
import { RevenueBreakdown } from "@/components/dashboard/RevenueBreakdown";
import { HistoricalFeesChart } from "@/components/dashboard/HistoricalFeesChart";
import { exportToCSV } from "@/lib/export";

export default function Fees() {
  return (
    <ErrorBoundary>
      <FeesContent />
    </ErrorBoundary>
  );
}

function FeesContent() {
  const { t } = useTranslation();
  const { selectedChain } = useChain();
  const { data: fees, isLoading } = useChainFees(selectedChain.id);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("fees24h");
  const navigate = useNavigate();
  useEffect(() => { setPage(1); }, [selectedChain.id]);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(200);

  // Extract unique categories
  const categories = useMemo(() => {
    if (!fees) return [];
    const cats = new Set(fees.map((f: any) => f.category || "Other").filter(Boolean));
    return Array.from(cats).sort();
  }, [fees]);

  // Filter and sort fee entries
  const filteredFees = useMemo(() => {
    if (!fees) return [];
    let filtered = fees.filter((f) => {
      const matchesSearch = (f.displayName || f.name || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || (f as any).category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "fees24h": return (b.total24h || 0) - (a.total24h || 0);
        case "fees7d": return (b.total7d || 0) - (a.total7d || 0);
        case "change": return Math.abs(b.change_1d || 0) - Math.abs(a.change_1d || 0);
        case "name": return (a.displayName || a.name || "").localeCompare(b.displayName || b.name || "");
        default: return 0;
      }
    });
    return filtered;
  }, [fees, searchQuery, categoryFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredFees.length / pageSize));
  if (page > totalPages) setPage(1);
  const paginatedFees = filteredFees.slice((page - 1) * pageSize, page * pageSize);

  const total24h = fees?.reduce((acc, f) => acc + (f.total24h || 0), 0) || 0;
  const protocolsCount = fees?.length || 0;

  const handleExport = () => {
    if (!filteredFees.length) return;
    exportToCSV(
      filteredFees.map(f => ({
        Protocol: f.displayName || f.name,
        "24h Fees": f.total24h || 0,
        "7d Fees": f.total7d || 0,
        "24h Change": f.change_1d || 0,
      })),
      "fees"
    );
  };
  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{selectedChain.name} {t('fees.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('fees.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              {t('common.exportCsv')}
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4 text-primary animate-pulse" />
              {protocolsCount} {t('fees.protocols')}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t('fees.fees24h')}
            value={formatCurrency(total24h)}
            icon={DollarSign}
            loading={isLoading}
          />
          <StatCard
            title={t('fees.protocols')}
            value={protocolsCount.toString()}
            icon={Activity}
            loading={isLoading}
          />
          <StatCard
            title={t('fees.avgFeeProtocol')}
            value={formatCurrency(protocolsCount > 0 ? total24h / protocolsCount : 0)}
            icon={TrendingUp}
            loading={isLoading}
          />
          <StatCard
            title={t('fees.fees7d')}
            value={formatCurrency(fees?.reduce((acc, f) => acc + (f.total7d || 0), 0) || 0)}
            icon={BarChart3}
            loading={isLoading}
          />
        </div>

        {/* Fee Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FeeTrendChart fees={filteredFees} loading={isLoading} />
          <RevenueBreakdown fees={filteredFees} loading={isLoading} />
        </div>

        {/* Historical Fees Chart */}
        <HistoricalFeesChart data={filteredFees} loading={isLoading} title={t('fees.feeRevenueByProtocol')} />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('fees.searchProtocols')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fees24h">24h Fees</SelectItem>
              <SelectItem value="fees7d">7d Fees</SelectItem>
              <SelectItem value="change">Change</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Fees Table */}
        {isLoading ? (
          <div className="rounded-lg border border-border bg-card overflow-x-auto">
            <table className="data-table w-full min-w-[500px]">
              <thead>
                <tr className="bg-muted/30">
                  <th className="w-12 hidden sm:table-cell">#</th>
                  <th>{t('fees.protocol')}</th>
                  <th className="text-right">{t('fees.fees24h')}</th>
                  <th className="text-right hidden sm:table-cell">{t('fees.fees7d')}</th>
                  <th className="text-right">{t('fees.change24h')}</th>
                </tr>
              </thead>
              <tbody>
                {Array(10).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="hidden sm:table-cell"><div className="skeleton h-4 w-6" /></td>
                    <td><div className="skeleton h-4 w-32" /></td>
                    <td><div className="skeleton h-4 w-24 ml-auto" /></td>
                    <td className="hidden sm:table-cell"><div className="skeleton h-4 w-24 ml-auto" /></td>
                    <td><div className="skeleton h-4 w-16 ml-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : filteredFees.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{t('fees.noFeeDataFound')}</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table w-full min-w-[320px]">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="w-12 hidden sm:table-cell">#</th>
                    <th>{t('fees.protocol')}</th>
                    <th className="text-right">{t('fees.fees24h')}</th>
                    <th className="text-right hidden md:table-cell">{t('fees.fees7d')}</th>
                    <th className="text-right">{t('fees.change')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedFees.map((fee, index) => {
                    if (!fee || typeof fee !== "object") return null;
                    const slug = (fee.displayName || fee.name || index).toString().toLowerCase().replace(/\s+/g, '-');
                    const total24h = typeof fee.total24h === "number" ? fee.total24h : 0;
                    const total7d = typeof fee.total7d === "number" ? fee.total7d : 0;
                    const change1d = typeof fee.change_1d === "number" ? fee.change_1d : 0;
                    return (
                      <tr
                        key={fee.name || index}
                        className="group cursor-pointer"
                        onClick={() => navigate(`/fees/${slug}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/fees/${slug}`); }}
                      >
                        <td className="text-muted-foreground font-mono text-sm hidden sm:table-cell">
                          {index + 1}
                        </td>
                        <td className="max-w-[120px] sm:max-w-none">
                          <div className="flex items-center gap-2 sm:gap-3">
                            {fee.logo ? (
                              <img
                                src={fee.logo}
                                alt={fee.displayName || fee.name}
                                className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-muted flex-shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${fee.name}&background=1a1a2e&color=2dd4bf&size=32`;
                                }}
                              />
                            ) : (
                              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs sm:text-sm flex-shrink-0">
                                {(fee.displayName || fee.name || "?").charAt(0)}
                              </div>
                            )}
                            <span className="font-medium text-foreground truncate text-sm sm:text-base">
                              {fee.displayName || fee.name}
                            </span>
                          </div>
                        </td>
                        <td className="text-right font-mono font-medium text-foreground whitespace-nowrap text-sm sm:text-base">
                          {formatCurrency(total24h)}
                        </td>
                        <td className="text-right font-mono text-muted-foreground hidden md:table-cell whitespace-nowrap">
                          {formatCurrency(total7d)}
                        </td>
                        <td className="text-right whitespace-nowrap">
                          <span
                            className={cn(
                              "font-mono text-xs sm:text-sm",
                              change1d >= 0
                                ? "text-success"
                                : "text-destructive"
                            )}
                          >
                            {`${change1d >= 0 ? "+" : ""}${Number(change1d || 0).toFixed(1)}%`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination controls */}
        {!isLoading && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {t('common.showing')} {Math.min((page - 1) * pageSize + 1, filteredFees.length)}-
              {Math.min(page * pageSize, filteredFees.length)} {t('common.of')} {filteredFees.length} {t('common.results')}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t('common.perPage')}</span>
                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                  <SelectTrigger className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Pagination>
                <PaginationContent className="flex-wrap">
                  <PaginationItem>
                    <PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} />
                  </PaginationItem>
                  {Array.from({ length: totalPages }).slice(0, 5).map((_, i) => {
                    const p = i + 1;
                    return (
                      <PaginationItem key={p}>
                        <PaginationLink isActive={p === page} onClick={() => setPage(p)}>
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext onClick={() => setPage((p) => Math.min(totalPages, p + 1))} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
