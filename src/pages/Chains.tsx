import { Layout } from "@/components/layout/Layout";
import { StatCard } from "@/components/dashboard/StatCard";
import { useChainsTVL } from "@/hooks/useDefiData";
import { formatCurrency, ChainData } from "@/lib/api/defillama";
import { Layers, TrendingUp, Search, PieChart, Globe, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
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
import { ChainComparisonChart } from "@/components/dashboard/ChainComparisonChart";
import { TVLDistributionChart } from "@/components/dashboard/TVLDistributionChart";

export default function Chains() {
  const { data: chains, isLoading } = useChainsTVL();
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Filter and sort chains
  const filteredChains = useMemo(() => {
    if (!chains) return [];

    return chains
      .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => (b.tvl || 0) - (a.tvl || 0));
  }, [chains, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredChains.length / pageSize));
  if (page > totalPages) setPage(1);
  const paginatedChains = filteredChains.slice((page - 1) * pageSize, page * pageSize);

  // Find XLayer
  const xlayer = chains?.find(
    (c) => c.name.toLowerCase() === "xlayer" || c.name.toLowerCase() === "x layer"
  );
  const xlayerRank = filteredChains.findIndex(
    (c) => c.name.toLowerCase() === "xlayer" || c.name.toLowerCase() === "x layer"
  ) + 1;

  // Calculate metrics
  const totalTVL = chains?.reduce((acc, c) => acc + (c.tvl || 0), 0) || 0;
  const chainCount = chains?.length || 0;
  const xlayerShare = xlayer && totalTVL > 0 ? (xlayer.tvl / totalTVL) * 100 : 0;
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">All Chains</h1>
            <p className="text-muted-foreground mt-1">
              TVL comparison across all blockchain networks
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4 text-primary animate-pulse" />
            {chainCount} chains tracked
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total DeFi TVL"
            value={formatCurrency(totalTVL)}
            icon={Globe}
            loading={isLoading}
          />
          <StatCard
            title="Total Chains"
            value={chainCount.toString()}
            icon={PieChart}
            loading={isLoading}
          />
          <StatCard
            title="XLayer TVL"
            value={formatCurrency(xlayer?.tvl || 0)}
            icon={Layers}
            loading={isLoading}
          />
          <StatCard
            title="XLayer Rank"
            value={xlayerRank > 0 ? `#${xlayerRank}` : "-"}
            icon={TrendingUp}
            loading={isLoading}
          />
        </div>

        {/* XLayer Highlight */}
        {xlayer && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">X</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">XLayer</h3>
                  <p className="text-muted-foreground">
                    Rank #{xlayerRank} • {xlayerShare.toFixed(4)}% of total DeFi TVL
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(xlayer.tvl)}
                </p>
                <p className="text-sm text-muted-foreground">Total Value Locked</p>
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChainComparisonChart chains={filteredChains} loading={isLoading} highlightChain="xlayer" />
          <TVLDistributionChart chains={filteredChains} loading={isLoading} />
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search chains..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Chains Table */}
        {isLoading ? (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table w-full min-w-[400px]">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="w-12">#</th>
                    <th>Chain</th>
                    <th className="text-right">TVL</th>
                    <th className="text-right hidden sm:table-cell">Market Share</th>
                  </tr>
                </thead>
                <tbody>
                  {Array(10).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td><div className="skeleton h-4 w-6" /></td>
                      <td><div className="skeleton h-4 w-32" /></td>
                      <td><div className="skeleton h-4 w-24 ml-auto" /></td>
                      <td className="hidden sm:table-cell"><div className="skeleton h-4 w-16 ml-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table w-full min-w-[320px]">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="w-12 hidden sm:table-cell">#</th>
                    <th>Chain</th>
                    <th className="text-right">TVL</th>
                    <th className="text-right hidden md:table-cell">Market Share</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedChains.map((chain, index) => {
                    const isXLayer = chain.name.toLowerCase() === "xlayer" || chain.name.toLowerCase() === "x layer";
                    const share = totalTVL > 0 ? (chain.tvl / totalTVL) * 100 : 0;
                    
                    return (
                      <tr
                        key={chain.name}
                        className={cn(
                          "group cursor-pointer",
                          isXLayer && "bg-primary/5 border-l-2 border-primary"
                        )}
                        onClick={() => navigate(`/chains/${chain.name.toLowerCase().replace(/\s+/g, '-')}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/chains/${chain.name.toLowerCase().replace(/\s+/g, '-')}`); }}
                      >
                        <td className="text-muted-foreground font-mono text-sm hidden sm:table-cell">
                          { (page - 1) * pageSize + index + 1 }
                        </td>
                        <td className="max-w-[150px] sm:max-w-none">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div
                              className={cn(
                                "h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0",
                                isXLayer
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary text-secondary-foreground"
                              )}
                            >
                              {(chain.tokenSymbol || chain.name.slice(0, 2)).slice(0, 3)}
                            </div>
                            <span
                              className={cn(
                                "font-medium truncate",
                                isXLayer ? "text-primary" : "text-foreground"
                              )}
                            >
                              {chain.name}
                            </span>
                          </div>
                        </td>
                        <td className="text-right font-mono font-medium text-foreground whitespace-nowrap text-sm sm:text-base">
                          {formatCurrency(chain.tvl)}
                        </td>
                        <td className="text-right hidden md:table-cell">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 lg:w-24 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${Math.min(share * 2, 100)}%` }}
                              />
                            </div>
                            <span className="font-mono text-sm text-muted-foreground w-14 lg:w-16 text-right">
                              {share.toFixed(2)}%
                            </span>
                          </div>
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Showing {Math.min((page - 1) * pageSize + 1, filteredChains.length)}-
              {Math.min(page * pageSize, filteredChains.length)} of {filteredChains.length} chains
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">Per page</span>
                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                  <SelectTrigger className="w-[70px] sm:w-[90px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Pagination>
                <PaginationContent className="gap-1">
                  <PaginationItem>
                    <PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} className="h-8 px-2 sm:px-3" />
                  </PaginationItem>
                  {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                    const p = i + 1;
                    return (
                      <PaginationItem key={p} className="hidden sm:inline-flex">
                        <PaginationLink isActive={p === page} onClick={() => setPage(p)} className="h-8 w-8">
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <span className="text-sm text-muted-foreground px-2 sm:hidden">{page}/{totalPages}</span>
                  <PaginationItem>
                    <PaginationNext onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="h-8 px-2 sm:px-3" />
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
