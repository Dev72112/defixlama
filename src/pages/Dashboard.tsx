import { Layout } from "@/components/layout/Layout";
import { Activity } from "lucide-react";
import { ErrorBoundary } from "react-error-boundary";
import { useDashboardData } from "@/hooks/useDefiData";
import { StatCard } from "@/components/dashboard/StatCard";
import { TVLChart } from "@/components/dashboard/TVLChart";
import { ProtocolTable } from "@/components/dashboard/ProtocolTable";
import { DexTable } from "@/components/dashboard/DexTable";
import { YieldTable } from "@/components/dashboard/YieldTable";
import { formatCurrency } from "@/lib/api/defillama";
import { Database, ArrowLeftRight, TrendingUp, Layers } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
      <h2 className="text-lg font-bold text-destructive">Something went wrong:</h2>
      <pre className="mt-2 text-sm text-destructive/80 overflow-auto">{error.message}</pre>
    </div>
  );
}

function DashboardContent() {
  const dashboardData = useDashboardData();
  
  const protocols = dashboardData?.protocols;
  const tvl = dashboardData?.tvl;
  const tvlHistory = dashboardData?.tvlHistory;
  const dexVolumes = dashboardData?.dexVolumes;
  const yieldPools = dashboardData?.yieldPools;

  const totalTVL = tvl?.data?.tvl ?? 0;
  const protocolCount = protocols?.data?.length ?? 0;
  const totalDexVolume = dexVolumes?.data?.reduce((acc, dex) => acc + (dex?.total24h ?? 0), 0) ?? 0;
  
  const avgApy = (() => {
    const pools = yieldPools?.data;
    if (!pools || pools.length === 0) return 0;
    const total = pools.reduce((acc, pool) => acc + ((pool?.apyBase ?? 0) + (pool?.apyReward ?? 0)), 0);
    const result = total / pools.length;
    return isNaN(result) ? 0 : result;
  })();

  const tvlChange = (() => {
    const data = tvlHistory?.data;
    if (!Array.isArray(data) || data.length < 2) return 0;
    const latest = data[data.length - 1]?.tvl ?? 0;
    const dayAgo = data[data.length - 2]?.tvl ?? latest;
    if (dayAgo === 0) return 0;
    const result = ((latest - dayAgo) / dayAgo) * 100;
    return isNaN(result) ? 0 : result;
  })();

  const miniChartData = Array.isArray(tvlHistory?.data) ? tvlHistory.data.slice(-14).map((d) => d?.tvl ?? 0) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">XLayer DeFi Overview</h1>
          <p className="text-muted-foreground mt-1">Real-time analytics for the XLayer ecosystem</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 text-success text-sm font-medium">
          <Activity className="h-4 w-4" />
          Live Data
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Value Locked"
          value={formatCurrency(totalTVL)}
          change={tvlChange}
          icon={Layers}
          loading={tvl?.isLoading ?? true}
          miniChart={miniChartData}
        />
        <StatCard
          title="Protocols"
          value={protocolCount.toString()}
          icon={Database}
          loading={protocols?.isLoading ?? true}
        />
        <StatCard
          title="24h DEX Volume"
          value={formatCurrency(totalDexVolume)}
          icon={ArrowLeftRight}
          loading={dexVolumes?.isLoading ?? true}
        />
        <StatCard
          title="Avg. Yield APY"
          value={`${avgApy.toFixed(2)}%`}
          icon={TrendingUp}
          loading={yieldPools?.isLoading ?? true}
        />
      </div>

      {/* TVL Chart */}
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <TVLChart data={tvlHistory?.data ?? []} loading={tvlHistory?.isLoading ?? true} height={350} />
      </ErrorBoundary>

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
            <ProtocolTable protocols={protocols?.data ?? []} loading={protocols?.isLoading ?? true} showCategory={false} limit={5} />
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
            <DexTable dexes={dexVolumes?.data ?? []} loading={dexVolumes?.isLoading ?? true} limit={5} />
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
          <YieldTable pools={yieldPools?.data ?? []} loading={yieldPools?.isLoading ?? true} limit={5} />
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
