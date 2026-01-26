import React, { Suspense, lazy, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "@/components/layout/Layout";
import { Activity } from "lucide-react";
import { ErrorBoundary } from "react-error-boundary";
import { useDashboardData, useChainsTVL, useFeesData, useStablecoins, useTop10Chains } from "@/hooks/useDefiData";
import { useTokenPrices } from "@/hooks/useTokenData";
import { LivePriceIndicator } from "@/components/LivePriceIndicator";
import { LivePriceTicker } from "@/components/LivePriceTicker";
import { StatCard } from "@/components/dashboard/StatCard";
import { TVLChart } from "@/components/dashboard/TVLChart";
import { MarketSentiment } from "@/components/dashboard/MarketSentiment";
import { TopMovers } from "@/components/dashboard/TopMovers";
import { DominanceChart } from "@/components/dashboard/DominanceChart";
import { EcosystemHealth } from "@/components/dashboard/EcosystemHealth";
import { HistoricalTVLChart } from "@/components/dashboard/HistoricalTVLChart";
import { HistoricalComparisonChart } from "@/components/dashboard/HistoricalComparisonChart";
import { PriceAlertsPanel } from "@/components/PriceAlertsPanel";
import { NetworkStatsCard } from "@/components/dashboard/NetworkStatsCard";
import { StablecoinStats } from "@/components/dashboard/StablecoinStats";
import { FeesOverview } from "@/components/dashboard/FeesOverview";
import { TopChainsCard } from "@/components/dashboard/TopChainsCard";
import { TopGainersLosers } from "@/components/dashboard/TopGainersLosers";
import { MiniWatchlist } from "@/components/dashboard/MiniWatchlist";
import { FloatingQuickAction } from "@/components/dashboard/QuickActions";
import { formatCurrency, timeAgo } from "@/lib/api/defillama";
import { Database, ArrowLeftRight, TrendingUp, Layers, Globe, DollarSign, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Lazy load heavier tables to improve initial render performance
const ProtocolTable = lazy(() => import("@/components/dashboard/ProtocolTable").then(mod => ({ default: mod.ProtocolTable })));
const DexTable = lazy(() => import("@/components/dashboard/DexTable").then(mod => ({ default: mod.DexTable })));
const YieldTable = lazy(() => import("@/components/dashboard/YieldTable").then(mod => ({ default: mod.YieldTable })));

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
      <h2 className="text-lg font-bold text-destructive">Something went wrong:</h2>
      <pre className="mt-2 text-sm text-destructive/80 overflow-auto">{error.message}</pre>
    </div>
  );
}

function DashboardContent() {
  const { t } = useTranslation();
  const dashboardData = useDashboardData();
  const chainsTVL = useChainsTVL();
  const top10Chains = useTop10Chains();
  const feesData = useFeesData();
  const stablecoins = useStablecoins();
  const { data: tokens } = useTokenPrices();

  const protocols = dashboardData.protocols;
  const tvl = dashboardData.tvl;
  const tvlHistory = dashboardData.tvlHistory;
  const dexVolumes = dashboardData.dexVolumes;
  const yieldPools = dashboardData.yieldPools;

  // Memoized derived values to avoid recalculations on every render
  const totalTVL = useMemo(() => tvl?.data?.tvl ?? 0, [tvl?.data?.tvl]);
  const protocolCount = useMemo(() => protocols?.data?.length ?? 0, [protocols?.data]);
  const totalDexVolume = useMemo(() => {
    return dexVolumes?.data?.reduce((acc, dex) => acc + (dex?.total24h ?? 0), 0) ?? 0;
  }, [dexVolumes?.data]);

  const avgApy = useMemo(() => {
    const pools = yieldPools?.data;
    if (!pools || pools.length === 0) return 0;
    const total = pools.reduce((acc, pool) => acc + ((pool?.apyBase ?? 0) + (pool?.apyReward ?? 0)), 0);
    const result = total / pools.length;
    return isNaN(result) ? 0 : result;
  }, [yieldPools?.data]);

  const tvlChange = useMemo(() => {
    const data = tvlHistory?.data;
    if (!Array.isArray(data) || data.length < 2) return 0;
    const latest = data[data.length - 1]?.tvl ?? 0;
    const dayAgo = data[data.length - 2]?.tvl ?? latest;
    if (dayAgo === 0) return 0;
    const result = ((latest - dayAgo) / dayAgo) * 100;
    return isNaN(result) ? 0 : result;
  }, [tvlHistory?.data]);

  const miniChartData = useMemo(() => (
    Array.isArray(tvlHistory?.data) ? tvlHistory.data.slice(-14).map((d) => d?.tvl ?? 0) : []
  ), [tvlHistory?.data]);

  // Additional KPI derivations
  const marketCap = useMemo(() => {
    const list = protocols?.data ?? [];
    return list.reduce((acc: number, p: any) => acc + (p?.mcap ?? 0), 0);
  }, [protocols?.data]);

  const recentProtocols = useMemo(() => {
    const list = protocols?.data ?? [];
    return (Array.isArray(list) ? list : [])
      .filter((p: any) => p?.listedAt)
      .sort((a: any, b: any) => (b.listedAt || 0) - (a.listedAt || 0))
      .slice(0, 6);
  }, [protocols?.data]);

  // Memoized top chains
  const topChains = useMemo(() => {
    const list = chainsTVL?.data ?? [];
    return Array.isArray(list) ? list.slice(0, 5) : [];
  }, [chainsTVL?.data]);

  // Unified activity feed: protocols (with real timestamps) + top fees + top chains
  const isActivityLoading = protocols?.isLoading || feesData?.isLoading || chainsTVL?.isLoading;

  const activities = useMemo(() => {
    const items: Array<any> = [];

    // Protocol listings (real timestamps)
    for (const p of recentProtocols) {
      items.push({
        type: "protocol",
        id: p.id || p.slug || p.name,
        title: p.name,
        subtitle: `${p.category || "—"} • ${p.chain || "—"}`,
        timestamp: p.listedAt || Math.floor(Date.now() / 1000),
        meta: p,
      });
    }

    // Top fees (no timestamp in payload) — give recent synthetic timestamps so they appear now
    const feesList = feesData?.data ?? [];
    if (Array.isArray(feesList) && feesList.length > 0) {
      const topFees = feesList
        .slice()
        .sort((a: any, b: any) => (b.total24h || b.total_24h || 0) - (a.total24h || a.total_24h || 0))
        .slice(0, 3);
      topFees.forEach((f: any, i: number) => {
        items.push({
          type: "fee",
          id: f.name || f.displayName || `fee-${i}`,
          title: f.displayName || f.name,
          subtitle: `24h ${formatCurrency(f.total24h || f.total_24h || 0)}`,
          timestamp: Math.floor(Date.now() / 1000) - (i + 1) * 60,
          meta: f,
        });
      });
    }

    // Top chains (no timestamp) — synthetic timestamps spaced further back
    for (let i = 0; i < topChains.length && i < 3; i++) {
      const c = topChains[i];
      items.push({
        type: "chain",
        id: c?.name || `chain-${i}`,
        title: c?.name || "unknown",
        subtitle: `${formatCurrency(c?.tvl ?? 0)} TVL`,
        timestamp: Math.floor(Date.now() / 1000) - (i + 1) * 120,
        meta: c,
      });
    }

    // Sort by timestamp desc and limit
    return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 6);
  }, [recentProtocols, feesData?.data, topChains]);

  const newProtocolsCount = useMemo(() => {
    const nowSec = Math.floor(Date.now() / 1000);
    const weekAgo = nowSec - 7 * 24 * 60 * 60;
    const list = protocols?.data ?? [];
    return list.filter((p: any) => p?.listedAt && p.listedAt >= weekAgo).length;
  }, [protocols?.data]);

  const categoryCount = useMemo(() => {
    const list = protocols?.data ?? [];
    const map = new Map<string, number>();
    for (const p of (Array.isArray(list) ? list : [])) {
      const cat = p?.category || "unknown";
      map.set(cat, (map.get(cat) || 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [protocols?.data]);

  const fees24h = useMemo(() => {
    const fees = feesData?.data ?? [];
    if (!Array.isArray(fees) || fees.length === 0) return 0;
    // Sum common 24h fields (fallbacks for various payload shapes)
    const sum = fees.slice(0, 5).reduce((acc: number, f: any) => {
      const v = f?.total24h ?? f?.total_24h ?? f?.total24hUsd ?? f?.fees24h ?? f?.fee_24h ?? 0;
      return acc + (typeof v === 'number' && !isNaN(v) ? v : Number(v) || 0);
    }, 0);
    return sum;
  }, [feesData?.data]);

  return (
    <div className="space-y-6 page-enter">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gradient-primary">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">{t("dashboard.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <LivePriceIndicator />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 text-success text-sm font-medium pulse-live badge-pulse">
            <Activity className="h-4 w-4 animate-pulse" />
            {t("dashboard.liveData")}
          </div>
        </div>
      </div>

      {/* Live Price Ticker */}
      <div className="rounded-lg border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
        <LivePriceTicker />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title={t("dashboard.tvl")}
          value={formatCurrency(totalTVL)}
          change={tvlChange}
          icon={Layers}
          loading={tvl?.isLoading ?? true}
          miniChart={miniChartData}
        />
        <StatCard
          title={t("dashboard.protocols")}
          value={protocolCount.toString()}
          icon={Database}
          loading={protocols?.isLoading ?? true}
        />
        <StatCard
          title={t("dashboard.dexVolume")}
          value={formatCurrency(totalDexVolume)}
          icon={ArrowLeftRight}
          loading={dexVolumes?.isLoading ?? true}
        />
        <StatCard
          title={t("dashboard.avgApy")}
          value={`${avgApy.toFixed(2)}%`}
          icon={TrendingUp}
          loading={yieldPools?.isLoading ?? true}
        />
      </div>

      {/* New Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NetworkStatsCard 
          loading={protocols?.isLoading} 
          protocols={protocols?.data ?? []} 
          dexVolumes={dexVolumes?.data ?? []} 
        />
        <StablecoinStats stablecoins={stablecoins?.data ?? []} loading={stablecoins?.isLoading} />
        <FeesOverview feesData={feesData?.data ?? []} loading={feesData?.isLoading} />
        <TopChainsCard chains={top10Chains?.data ?? []} loading={top10Chains?.isLoading} />
      </div>

      {/* TVL Chart */}
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <TVLChart data={tvlHistory?.data ?? []} loading={tvlHistory?.isLoading ?? true} height={350} />
      </ErrorBoundary>

      {/* Historical Charts with Date Range */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HistoricalTVLChart 
          data={tvlHistory?.data ?? []} 
          loading={tvlHistory?.isLoading ?? true} 
          title="XLayer TVL History"
        />
        <HistoricalComparisonChart 
          tvlData={tvlHistory?.data ?? []} 
          volumeData={dexVolumes?.data ?? []}
          loading={tvlHistory?.isLoading ?? true} 
          title="TVL vs Volume Trend"
        />
      </div>

      {/* Market Intelligence Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MarketSentiment 
          protocols={protocols?.data ?? []} 
          tokens={tokens ?? []}
          loading={protocols?.isLoading} 
        />
        <EcosystemHealth 
          protocols={protocols?.data ?? []} 
          tvl={totalTVL}
          dexVolume={totalDexVolume}
          loading={protocols?.isLoading} 
        />
        <div className="lg:col-span-2">
          <DominanceChart 
            protocols={protocols?.data ?? []} 
            loading={protocols?.isLoading} 
          />
        </div>
      </div>

      {/* Top Movers */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">{t("dashboard.topMovers")}</h2>
        <TopMovers
          protocols={protocols?.data ?? []} 
          tokens={tokens ?? []}
          loading={protocols?.isLoading} 
          limit={5}
        />
      </div>

      {/* OKX Top Gainers/Losers - X Layer */}
      <TopGainersLosers chainIndex="196" limit={5} />

      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title={t("dashboard.marketCap")} value={formatCurrency(marketCap)} icon={Database} loading={protocols?.isLoading ?? true} />
        <StatCard title={t("dashboard.newProtocols")} value={String(newProtocolsCount)} icon={Layers} loading={protocols?.isLoading ?? true} />
        <StatCard title={t("dashboard.topCategories")} value={categoryCount.length.toString()} icon={TrendingUp} loading={protocols?.isLoading ?? true} />
      </div>

      {/* Insights: Categories + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-lg border border-border bg-card p-4 lg:col-span-2">
          <h3 className="text-lg font-semibold text-foreground mb-3">{t("dashboard.protocolCategories")}</h3>
          <div className="flex flex-col gap-2">
            {categoryCount.map(([cat, count]: any) => (
              <div key={cat} className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">{cat}</div>
                <div className="font-medium">{count}</div>
              </div>
            ))}
            {categoryCount.length === 0 && <div className="text-muted-foreground">No category data</div>}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">{t("dashboard.recentActivity")}</h3>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                {t("common.live")}
              </div>
            </div>
            <Link to="/activities">
              <Button variant="ghost" size="sm" className="text-primary">{t("dashboard.viewAll")} →</Button>
            </Link>
          </div>
          {isActivityLoading ? (
            <ul className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <li key={i} className="flex items-center gap-3 p-2">
                  <div className="skeleton h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <div className="skeleton h-4 w-32 mb-1.5" />
                    <div className="skeleton h-3 w-24" />
                  </div>
                  <div className="skeleton h-3 w-14" />
                </li>
              ))}
            </ul>
          ) : activities.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">No recent activity</div>
          ) : (
            <ul className="space-y-1">
              {activities.map((a: any) => {
                const href = a.type === 'protocol' ? `/protocols/${(a.meta?.slug || a.meta?.name || '').toString().toLowerCase().replace(/\s+/g,'-')}` : a.type === 'fee' ? `/fees/${(a.meta?.displayName || a.meta?.name || '').toString().toLowerCase().replace(/\s+/g,'-')}` : a.type === 'chain' ? `/chains/${(a.meta?.name || a.id || '').toString().toLowerCase().replace(/\s+/g,'-')}` : null;
                const Icon = a.type === 'protocol' ? Layers : a.type === 'fee' ? DollarSign : Globe;
                const typeColor = a.type === 'protocol' ? 'bg-primary/10 text-primary' : a.type === 'fee' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500';
                const value = a.type === 'protocol' ? formatCurrency(a.meta?.tvl || 0) : a.type === 'fee' ? formatCurrency(a.meta?.total24h || 0) : formatCurrency(a.meta?.tvl || 0);
                return (
                  <li key={a.id}>
                    <Link 
                      to={href ?? '#'} 
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors group" 
                      onClick={(e) => { if (!href) e.preventDefault(); }}
                    >
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${typeColor}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground truncate">{a.title}</span>
                          <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{a.type}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="truncate">{a.subtitle}</span>
                          <span className="text-primary font-medium">{value}</span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">{a.timestamp ? timeAgo(a.timestamp) : "—"}</div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Top Protocols</h2>
            <Link to="/protocols">
              <Button variant="ghost" size="sm" className="text-primary">View All →</Button>
            </Link>
          </div>
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<div className="rounded-lg border border-border bg-card p-4"><div className="skeleton h-6 w-32 mb-4" /><div className="skeleton w-full h-28" /></div>}>
              <ProtocolTable protocols={protocols?.data ?? []} loading={protocols?.isLoading ?? true} showCategory={false} limit={5} />
            </Suspense>
          </ErrorBoundary>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">DEX Volume</h2>
            <Link to="/dexs">
              <Button variant="ghost" size="sm" className="text-primary">View All →</Button>
            </Link>
          </div>
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<div className="rounded-lg border border-border bg-card p-4"><div className="skeleton h-6 w-32 mb-4" /><div className="skeleton w-full h-28" /></div>}>
              <DexTable dexes={dexVolumes?.data ?? []} loading={dexVolumes?.isLoading ?? true} limit={5} />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>

      {/* Yield Pools */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Top Yield Pools</h2>
          <Link to="/yields">
            <Button variant="ghost" size="sm" className="text-primary">View All →</Button>
          </Link>
        </div>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<div className="rounded-lg border border-border bg-card p-4"><div className="skeleton h-6 w-32 mb-4" /><div className="skeleton w-full h-28" /></div>}>
            <YieldTable pools={yieldPools?.data ?? []} loading={yieldPools?.isLoading ?? true} limit={5} />
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* Call to Action */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Build on XLayer</h3>
            <p className="text-muted-foreground mt-1">Deploy your DeFi protocol on XLayer and get listed here</p>
          </div>
          <div className="flex gap-3">
            <a href="https://www.okx.com/xlayer/docs" target="_blank" rel="noopener noreferrer">
              <Button variant="outline">Documentation</Button>
            </a>
            <a href="https://www.okx.com/xlayer" target="_blank" rel="noopener noreferrer">
              <Button>Get Started</Button>
            </a>
          </div>
        </div>
      </div>
      
      {/* Top Chains & Fees */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Top Chains by TVL</h2>
            <Link to="/chains">
              <Button variant="ghost" size="sm" className="text-primary">View All →</Button>
            </Link>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <ul className="space-y-2">
              {topChains.length === 0 && (
                <li className="text-muted-foreground">No chain TVL data available</li>
              )}
              {topChains.map((c: any) => (
                <li key={c?.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted/10 flex items-center justify-center text-muted">
                      <Globe className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{c?.name}</div>
                      <div className="text-xs text-muted-foreground">{c?.chainId ? `ID ${c.chainId}` : ""}</div>
                    </div>
                  </div>
                  <div className="font-semibold">{formatCurrency(c?.tvl ?? 0)}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Fees (24h)</h2>
          <StatCard
            title="Estimated Fees (24h)"
            value={formatCurrency(fees24h)}
            icon={Database}
            loading={feesData?.isLoading ?? true}
          />
          <MiniWatchlist />
          <PriceAlertsPanel />
        </div>
      </div>
      
      {/* Floating Quick Action Button - Mobile only */}
      <FloatingQuickAction />
    </div>
  );
}

export default function Dashboard() {
  return (
    <Layout>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <DashboardContent />
      </ErrorBoundary>
    </Layout>
  );
}
