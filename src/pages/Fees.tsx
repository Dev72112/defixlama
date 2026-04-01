import { Layout } from "@/components/layout/Layout";
import { StatCard } from "@/components/dashboard/StatCard";
import { useChainFees } from "@/hooks/useDefiData";
import { useChain } from "@/contexts/ChainContext";
import { formatCurrency } from "@/lib/api/defillama";
import { BarChart3, TrendingUp, Search, DollarSign, Activity, Download, Zap, LineChart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { FeeTrendChart } from "@/components/dashboard/FeeTrendChart";
import { RevenueBreakdown } from "@/components/dashboard/RevenueBreakdown";
import { HistoricalFeesChart } from "@/components/dashboard/HistoricalFeesChart";
import { exportToCSV } from "@/lib/export";
import { ResponsiveDataTable, ResponsiveColumn } from "@/components/ui/responsive-table";
import { ProFeatureTeaser } from "@/components/dashboard/ProFeatureTeaser";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "overview";
  useEffect(() => { setPage(1); }, [selectedChain.id]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(200);

  const categories = useMemo(() => {
    if (!fees) return [];
    const cats = new Set(fees.map((f: any) => f.category || "Other").filter(Boolean));
    return Array.from(cats).sort();
  }, [fees]);

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
        Protocol: f.displayName || f.name, "24h Fees": f.total24h || 0,
        "7d Fees": f.total7d || 0, "24h Change": f.change_1d || 0,
      })),
      "fees"
    );
  };

  // Revenue tab data
  const revenueRanked = useMemo(() => {
    if (!fees) return [];
    return [...fees]
      .filter(f => f.total24h && f.total24h > 0)
      .map(f => {
        const tvl = (f as any).tvl || 0;
        const feeToTvl = tvl > 0 ? (f.total24h / tvl) * 100 : 0;
        const efficiency = tvl > 0 ? ((f.total24h * 365) / tvl) * 100 : 0;
        return { ...f, feeToTvl, efficiency, tvl };
      })
      .sort((a, b) => b.efficiency - a.efficiency)
      .slice(0, 30);
  }, [fees]);

  // Trends tab data
  const trendLeaders = useMemo(() => {
    if (!fees) return [];
    return [...fees]
      .filter(f => typeof f.change_1d === "number" && f.total24h > 1000)
      .sort((a, b) => (b.change_1d || 0) - (a.change_1d || 0));
  }, [fees]);

  const topGainers = trendLeaders.slice(0, 10);
  const topDecliners = [...trendLeaders].reverse().slice(0, 10);

  const columns: ResponsiveColumn<any>[] = [
    {
      key: "rank", label: "#", priority: "desktop", className: "w-12",
      render: (_fee: any, index: number) => <span className="text-muted-foreground font-mono text-sm">{(page - 1) * pageSize + index + 1}</span>,
    },
    {
      key: "name", label: t('fees.protocol'), priority: "always",
      render: (fee: any) => (
        <div className="flex items-center gap-2 sm:gap-3">
          {fee.logo ? (
            <img src={fee.logo} alt={fee.displayName || fee.name} className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-muted flex-shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${fee.name}&background=1a1a2e&color=2dd4bf&size=32`; }}
            />
          ) : (
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs sm:text-sm flex-shrink-0">
              {(fee.displayName || fee.name || "?").charAt(0)}
            </div>
          )}
          <span className="font-medium text-foreground truncate max-w-[120px] sm:max-w-none text-sm sm:text-base">{fee.displayName || fee.name}</span>
        </div>
      ),
    },
    {
      key: "fees24h", label: t('fees.fees24h'), priority: "always", align: "right",
      render: (fee: any) => <span className="font-mono font-medium text-foreground whitespace-nowrap text-sm sm:text-base">{formatCurrency(fee.total24h || 0)}</span>,
    },
    {
      key: "fees7d", label: t('fees.fees7d'), priority: "expanded", align: "right",
      render: (fee: any) => <span className="font-mono text-muted-foreground whitespace-nowrap">{formatCurrency(fee.total7d || 0)}</span>,
    },
    {
      key: "change", label: t('fees.change'), priority: "always", align: "right",
      render: (fee: any) => {
        const change1d = typeof fee.change_1d === "number" ? fee.change_1d : 0;
        return (
          <span className={cn("font-mono text-xs sm:text-sm", change1d >= 0 ? "text-success" : "text-destructive")}>
            {`${change1d >= 0 ? "+" : ""}${Number(change1d).toFixed(1)}%`}
          </span>
        );
      },
    },
  ];

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
              <Download className="h-4 w-4" />{t('common.exportCsv')}
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4 text-primary animate-pulse" />
              {protocolsCount} {t('fees.protocols')}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title={t('fees.fees24h')} value={formatCurrency(total24h)} icon={DollarSign} loading={isLoading} />
          <StatCard title={t('fees.protocols')} value={protocolsCount.toString()} icon={Activity} loading={isLoading} />
          <StatCard title={t('fees.avgFeeProtocol')} value={formatCurrency(protocolsCount > 0 ? total24h / protocolsCount : 0)} icon={TrendingUp} loading={isLoading} />
          <StatCard title={t('fees.fees7d')} value={formatCurrency(fees?.reduce((acc, f) => acc + (f.total7d || 0), 0) || 0)} icon={BarChart3} loading={isLoading} />
        </div>

        <Tabs value={currentTab} onValueChange={(v) => setSearchParams({ tab: v })} className="w-full">
          <div className="overflow-x-auto">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="overview" className="gap-2"><BarChart3 className="h-4 w-4" />Overview</TabsTrigger>
              <TabsTrigger value="revenue" className="gap-2"><DollarSign className="h-4 w-4" />Revenue</TabsTrigger>
              <TabsTrigger value="trends" className="gap-2"><LineChart className="h-4 w-4" />Trends</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FeeTrendChart fees={filteredFees} loading={isLoading} />
              <RevenueBreakdown fees={filteredFees} loading={isLoading} />
            </div>
            <HistoricalFeesChart data={filteredFees} loading={isLoading} title={t('fees.feeRevenueByProtocol')} />

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder={t('fees.searchProtocols')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fees24h">24h Fees</SelectItem>
                  <SelectItem value="fees7d">7d Fees</SelectItem>
                  <SelectItem value="change">Change</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <ResponsiveDataTable
              columns={columns}
              data={paginatedFees}
              keyField={(fee: any, index: number) => fee.name || String(index)}
              onRowClick={(fee: any) => {
                const slug = (fee.displayName || fee.name || "").toString().toLowerCase().replace(/\s+/g, '-');
                navigate(`/fees/${slug}`);
              }}
              loading={isLoading}
              loadingRows={10}
              emptyMessage={t('fees.noFeeDataFound')}
              emptyIcon={<BarChart3 className="h-12 w-12 text-muted-foreground" />}
            />

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
                      <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="200">200</SelectItem>
                        <SelectItem value="500">500</SelectItem>
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
              title="Fee Optimization Intelligence"
              description="Get AI-powered fee optimization recommendations and protocol revenue efficiency scoring."
              requiredTier="pro"
              icon={<Zap className="h-5 w-5 text-primary/70" />}
              features={["Fee-to-TVL ratio analysis", "Revenue efficiency rankings", "Fee trend alerts"]}
            />
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-semibold text-foreground mb-4">Revenue Efficiency Rankings</h3>
              <p className="text-sm text-muted-foreground mb-4">Protocols ranked by annualized fee-to-TVL ratio — higher means more capital-efficient fee generation.</p>
              {isLoading ? (
                <div className="space-y-3">
                  {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-12 rounded-lg" />)}
                </div>
              ) : revenueRanked.length === 0 ? (
                <p className="text-muted-foreground text-sm">No revenue data available</p>
              ) : (
                <div className="space-y-2">
                  {revenueRanked.map((f, i) => (
                    <div key={f.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/fees/${(f.displayName || f.name).toLowerCase().replace(/\s+/g, '-')}`)}>
                      <span className="text-muted-foreground font-mono text-sm w-8">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{f.displayName || f.name}</p>
                        <p className="text-xs text-muted-foreground">24h Fees: {formatCurrency(f.total24h || 0)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-medium text-primary">{f.efficiency.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">Ann. Fee/TVL</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <ProFeatureTeaser
              title="Revenue Forecasting"
              description="Predict future protocol revenue with ML models trained on historical fee data and market conditions."
              requiredTier="pro_plus"
              icon={<LineChart className="h-5 w-5 text-primary/70" />}
              features={["30/60/90 day revenue projections", "Revenue correlation with market cycles", "Protocol revenue alerts"]}
            />
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="font-semibold text-success mb-4">🚀 Top Fee Gainers (24h)</h3>
                {isLoading ? (
                  <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-10 rounded" />)}</div>
                ) : topGainers.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No trend data available</p>
                ) : (
                  <div className="space-y-2">
                    {topGainers.map((f) => (
                      <div key={f.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/fees/${(f.displayName || f.name).toLowerCase().replace(/\s+/g, '-')}`)}>
                        <span className="font-medium text-foreground text-sm truncate max-w-[150px]">{f.displayName || f.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm text-muted-foreground">{formatCurrency(f.total24h || 0)}</span>
                          <span className="font-mono text-sm text-success">+{(f.change_1d || 0).toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="font-semibold text-destructive mb-4">📉 Top Fee Decliners (24h)</h3>
                {isLoading ? (
                  <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-10 rounded" />)}</div>
                ) : topDecliners.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No trend data available</p>
                ) : (
                  <div className="space-y-2">
                    {topDecliners.map((f) => (
                      <div key={f.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/fees/${(f.displayName || f.name).toLowerCase().replace(/\s+/g, '-')}`)}>
                        <span className="font-medium text-foreground text-sm truncate max-w-[150px]">{f.displayName || f.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm text-muted-foreground">{formatCurrency(f.total24h || 0)}</span>
                          <span className="font-mono text-sm text-destructive">{(f.change_1d || 0).toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <ProFeatureTeaser
              title="Fee Optimization Intelligence"
              description="Track fee trends across protocols, identify emerging revenue patterns, and receive alerts on significant fee changes."
              requiredTier="pro"
              icon={<Zap className="h-5 w-5 text-primary/70" />}
              features={["Fee trend pattern recognition", "Cross-protocol fee correlation", "Revenue anomaly detection"]}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}