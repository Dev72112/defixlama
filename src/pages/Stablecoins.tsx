import { Layout } from "@/components/layout/Layout";
import { StatCard } from "@/components/dashboard/StatCard";
import { PegTracker } from "@/components/dashboard/PegTracker";
import { useStablecoins } from "@/hooks/useDefiData";
import { formatCurrency, Stablecoin } from "@/lib/api/defillama";
import { Coins, TrendingUp, Search, DollarSign, Activity, PieChart } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ErrorState } from "@/components/ErrorState";
import { useChain } from "@/contexts/ChainContext";

export default function Stablecoins() {
  const { t } = useTranslation();
  const { selectedChain } = useChain();
  const { data: stablecoins, isLoading, isError, error, refetch } = useStablecoins();
  const [searchQuery, setSearchQuery] = useState("");
  const [pegFilter, setPegFilter] = useState("all");
  const [sortBy, setSortBy] = useState("marketcap");

  // Extract peg types
  const pegTypes = useMemo(() => {
    if (!stablecoins) return [];
    const types = new Set(stablecoins.map((s) => s.pegType || "USD"));
    return Array.from(types).sort();
  }, [stablecoins]);

  // Filter stablecoins by selected chain
  const filteredStablecoins = useMemo(() => {
    if (!stablecoins) return [];
    
    let filtered = stablecoins.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.symbol.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPeg = pegFilter === "all" || (s.pegType || "USD") === pegFilter;
      if (selectedChain.id === "all") {
        return matchesSearch && matchesPeg;
      }
      const chainSlug = selectedChain.slug.toLowerCase();
      const isRelevant = s.chains?.some(
        (c) => c.toLowerCase() === chainSlug || c.toLowerCase().replace(/[\s-]/g, "") === chainSlug.replace(/[\s-]/g, "")
      ) || ["USDT", "USDC", "DAI", "FRAX", "LUSD", "TUSD"].includes(s.symbol);
      return matchesSearch && matchesPeg && isRelevant;
    });
    
    // Sort
    filtered.sort((a, b) => {
      const aCirc = a.circulating ? Object.values(a.circulating).reduce((x, y) => x + y, 0) : 0;
      const bCirc = b.circulating ? Object.values(b.circulating).reduce((x, y) => x + y, 0) : 0;
      switch (sortBy) {
        case "marketcap": return bCirc - aCirc;
        case "name": return a.name.localeCompare(b.name);
        case "peg": return Math.abs(1 - (a.price || 1)) - Math.abs(1 - (b.price || 1));
        default: return 0;
      }
    });
    
    return filtered.slice(0, 50);
  }, [stablecoins, searchQuery, selectedChain, pegFilter, sortBy]);

  // Calculate metrics
  const totalMarketCap = filteredStablecoins.reduce((acc, s) => {
    const circulating = s.circulating ? Object.values(s.circulating).reduce((a, b) => a + b, 0) : 0;
    return acc + circulating;
  }, 0);
  const stablecoinCount = filteredStablecoins.length;

  // Dominance chart data
  const dominanceData = useMemo(() => {
    const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
    return filteredStablecoins.slice(0, 5).map((s, i) => {
      const circulating = s.circulating ? Object.values(s.circulating).reduce((a, b) => a + b, 0) : 0;
      return {
        name: s.symbol,
        value: circulating,
        color: COLORS[i % COLORS.length],
      };
    });
  }, [filteredStablecoins]);

  // Calculate stability score
  const stabilityScore = useMemo(() => {
    const stables = filteredStablecoins.filter((s) => s.price !== undefined);
    if (stables.length === 0) return 100;
    const avgDeviation = stables.reduce((acc, s) => acc + Math.abs(1 - (s.price || 1)) * 100, 0) / stables.length;
    return Math.max(0, 100 - avgDeviation * 10);
  }, [filteredStablecoins]);

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{selectedChain.name} {t('stablecoins.title')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('stablecoins.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4 text-primary animate-pulse" />
            {stablecoinCount} {t('stablecoins.stablecoins')}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t('stablecoins.totalMarketCap')}
            value={formatCurrency(totalMarketCap)}
            icon={DollarSign}
            loading={isLoading}
          />
          <StatCard
            title={t('stablecoins.stablecoinsAvailable')}
            value={stablecoinCount.toString()}
            icon={Coins}
            loading={isLoading}
          />
          <StatCard
            title={t('stablecoins.mostUsed')}
            value={filteredStablecoins[0]?.symbol || "-"}
            icon={Activity}
            loading={isLoading}
          />
          <StatCard
            title={t('stablecoins.stabilityScore')}
            value={`${stabilityScore.toFixed(1)}%`}
            icon={TrendingUp}
            loading={isLoading}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dominance Chart */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold text-foreground mb-4">{t('stablecoins.marketCapDominance')}</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={dominanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {dominanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [formatCurrency(value), t('stablecoins.marketCap')]}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-3 justify-center">
              {dominanceData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Peg Tracker */}
          <PegTracker stablecoins={filteredStablecoins} loading={isLoading} />
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('stablecoins.searchStablecoins')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={pegFilter} onValueChange={setPegFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Peg Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pegs</SelectItem>
              {pegTypes.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="marketcap">Market Cap</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="peg">Peg Stability</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stablecoins Grid */}
        {isError ? (
          <ErrorState 
            error={error as Error}
            onRetry={() => refetch()}
          />
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-6">
                <div className="skeleton h-10 w-10 rounded-full mb-4" />
                <div className="skeleton h-6 w-24 mb-2" />
                <div className="skeleton h-4 w-32" />
              </div>
            ))}
          </div>
        ) : filteredStablecoins.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{t('stablecoins.noStablecoinsFound')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStablecoins.map((stablecoin) => (
              <StablecoinCard key={stablecoin.id} stablecoin={stablecoin} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function StablecoinCard({ stablecoin }: { stablecoin: Stablecoin }) {
  const { t } = useTranslation();
  const circulating = stablecoin.circulating 
    ? Object.values(stablecoin.circulating).reduce((a, b) => a + b, 0) 
    : 0;
  const pegDeviation = stablecoin.price ? Math.abs(1 - stablecoin.price) * 100 : 0;
  const isPegged = pegDeviation < 1;

  return (
    <Link to={`/stablecoins/${stablecoin.symbol.toLowerCase()}`} className="block">
      <div className="rounded-lg border border-border bg-card p-6 card-hover group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            {stablecoin.symbol.slice(0, 2)}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{stablecoin.name}</h3>
            <p className="text-sm text-muted-foreground">{stablecoin.symbol}</p>
          </div>
        </div>
        <div
          className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            isPegged
              ? "bg-success/10 text-success"
              : "bg-warning/10 text-warning"
          )}
        >
          {isPegged ? t('stablecoins.pegged') : t('stablecoins.depegged')}
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">{t('stablecoins.marketCap')}</span>
          <span className="font-mono font-medium text-foreground">
            {formatCurrency(circulating)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">{t('stablecoins.price')}</span>
          <span className="font-mono font-medium text-foreground">
            ${stablecoin.price?.toFixed(4) || "1.0000"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">{t('stablecoins.pegType')}</span>
          <span className="text-sm text-foreground capitalize">
            {stablecoin.pegType || "USD"}
          </span>
        </div>
        {stablecoin.chains && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{t('stablecoins.chains')}</span>
            <span className="text-sm text-foreground">
              {stablecoin.chains.length}
            </span>
          </div>
        )}
      </div>
    </div>
    </Link>
  );
}
