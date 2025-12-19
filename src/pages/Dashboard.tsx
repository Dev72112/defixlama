import { Layout } from "@/components/layout/Layout";
import { StatCard } from "@/components/dashboard/StatCard";
import { TVLChart } from "@/components/dashboard/TVLChart";
import { ProtocolTable } from "@/components/dashboard/ProtocolTable";
import { DexTable } from "@/components/dashboard/DexTable";
import { YieldTable } from "@/components/dashboard/YieldTable";
import { useDashboardData } from "@/hooks/useDefiData";
import { formatCurrency } from "@/lib/api/defillama";
import {
  Database,
  ArrowLeftRight,
  TrendingUp,
  Coins,
  Activity,
  Layers,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { protocols, tvl, tvlHistory, dexVolumes, yieldPools, isLoading } =
    useDashboardData();

  // Calculate metrics
  const totalTVL = tvl.data?.tvl || 0;
  const protocolCount = protocols.data?.length || 0;
  const totalDexVolume =
    dexVolumes.data?.reduce((acc, dex) => acc + (dex.total24h || 0), 0) || 0;
  const avgApy =
    yieldPools.data && yieldPools.data.length > 0
      ? yieldPools.data.reduce(
          (acc, pool) => acc + ((pool.apyBase || 0) + (pool.apyReward || 0)),
          0
        ) / yieldPools.data.length
      : 0;

  // Get TVL change from history
  const tvlChange = (() => {
    if (!tvlHistory.data || tvlHistory.data.length < 2) return 0;
    const latest = tvlHistory.data[tvlHistory.data.length - 1].tvl;
    const dayAgo = tvlHistory.data[tvlHistory.data.length - 2]?.tvl || latest;
    return dayAgo > 0 ? ((latest - dayAgo) / dayAgo) * 100 : 0;
  })();

  // Mini chart data
  const miniChartData =
    tvlHistory.data?.slice(-14).map((d) => d.tvl) || [];

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              XLayer DeFi Overview
            </h1>
            <p className="text-muted-foreground mt-1">
              Real-time analytics for the XLayer ecosystem
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 text-success text-sm font-medium">
              <Activity className="h-4 w-4" />
              Live Data
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Value Locked"
            value={formatCurrency(totalTVL)}
            change={tvlChange}
            icon={Layers}
            loading={tvl.isLoading}
            miniChart={miniChartData}
          />
          <StatCard
            title="Protocols"
            value={protocolCount.toString()}
            icon={Database}
            loading={protocols.isLoading}
          />
          <StatCard
            title="24h DEX Volume"
            value={formatCurrency(totalDexVolume)}
            icon={ArrowLeftRight}
            loading={dexVolumes.isLoading}
          />
          <StatCard
            title="Avg. Yield APY"
            value={`${avgApy.toFixed(2)}%`}
            icon={TrendingUp}
            loading={yieldPools.isLoading}
          />
        </div>

        {/* TVL Chart */}
        <TVLChart
          data={tvlHistory.data || []}
          loading={tvlHistory.isLoading}
          height={350}
        />

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Protocols */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Top Protocols
              </h2>
              <Link to="/protocols">
                <Button variant="ghost" size="sm" className="text-primary">
                  View All →
                </Button>
              </Link>
            </div>
            <ProtocolTable
              protocols={protocols.data || []}
              loading={protocols.isLoading}
              showCategory={false}
              limit={5}
            />
          </div>

          {/* Top DEXs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                DEX Volume
              </h2>
              <Link to="/dexs">
                <Button variant="ghost" size="sm" className="text-primary">
                  View All →
                </Button>
              </Link>
            </div>
            <DexTable
              dexes={dexVolumes.data || []}
              loading={dexVolumes.isLoading}
              limit={5}
            />
          </div>
        </div>

        {/* Yield Pools */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Top Yield Pools
            </h2>
            <Link to="/yields">
              <Button variant="ghost" size="sm" className="text-primary">
                View All →
              </Button>
            </Link>
          </div>
          <YieldTable
            pools={yieldPools.data || []}
            loading={yieldPools.isLoading}
            limit={5}
          />
        </div>

        {/* Call to Action */}
        <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Build on XLayer
              </h3>
              <p className="text-muted-foreground mt-1">
                Deploy your DeFi protocol on XLayer and get listed here
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href="https://www.okx.com/xlayer/docs"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline">Documentation</Button>
              </a>
              <a
                href="https://www.okx.com/xlayer"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button>Get Started</Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
