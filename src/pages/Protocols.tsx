import { Layout } from "@/components/layout/Layout";
import { ProtocolTable } from "@/components/dashboard/ProtocolTable";
import { StatCard } from "@/components/dashboard/StatCard";
import { useXLayerProtocols, useXLayerTVL, useXLayerTVLHistory } from "@/hooks/useDefiData";
import { formatCurrency } from "@/lib/api/defillama";
import { Database, Layers, TrendingUp, Search, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HistoricalTVLChart } from "@/components/dashboard/HistoricalTVLChart";

export default function Protocols() {
  const { data: protocols, isLoading: protocolsLoading } = useXLayerProtocols();
  const { data: tvl, isLoading: tvlLoading } = useXLayerTVL();
  const { data: tvlHistory, isLoading: tvlHistoryLoading } = useXLayerTVLHistory();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("tvl");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Get unique categories
  const categories = useMemo(() => {
    if (!protocols) return [];
    const cats = new Set(protocols.map((p) => p.category || "Other"));
    return Array.from(cats).sort();
  }, [protocols]);

  // Filter and sort protocols
  const filteredProtocols = useMemo(() => {
    if (!protocols) return [];
    
    let filtered = protocols.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.symbol?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "tvl":
          return (b.tvl || 0) - (a.tvl || 0);
        case "change_1d":
          return (b.change_1d || 0) - (a.change_1d || 0);
        case "change_7d":
          return (b.change_7d || 0) - (a.change_7d || 0);
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [protocols, searchQuery, sortBy, categoryFilter]);

  // Calculate metrics
  const totalTVL = tvl?.tvl || 0;
  const protocolCount = protocols?.length || 0;
  const avgTVL = protocolCount > 0 ? totalTVL / protocolCount : 0;
  const topGainer = useMemo(() => {
    if (!protocols || protocols.length === 0) return null;
    return protocols.reduce((max, p) => 
      (p.change_1d || 0) > (max.change_1d || 0) ? p : max
    , protocols[0]);
  }, [protocols]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredProtocols.length / pageSize));
  if (page > totalPages) setPage(1);
  const pagedProtocols = filteredProtocols.slice((page - 1) * pageSize, page * pageSize);

  const exportCSV = () => {
    const rows = [
      ["name", "slug", "chain", "category", "tvl", "change_1d", "change_7d"],
      ...filteredProtocols.map((p) => [
        p.name,
        p.slug || "",
        p.chain || "",
        p.category || "",
        p.tvl || 0,
        p.change_1d || 0,
        p.change_7d || 0,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `protocols_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Protocols</h1>
            <p className="text-muted-foreground mt-1">
              All DeFi protocols deployed on XLayer
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4 text-primary animate-pulse" />
            {protocolCount} protocols tracked
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total TVL"
            value={formatCurrency(totalTVL)}
            icon={Layers}
            loading={tvlLoading}
          />
          <StatCard
            title="Protocols"
            value={protocolCount.toString()}
            icon={Database}
            loading={protocolsLoading}
          />
          <StatCard
            title="Avg. TVL per Protocol"
            value={formatCurrency(avgTVL)}
            icon={TrendingUp}
            loading={protocolsLoading || tvlLoading}
          />
          <StatCard
            title="Top Gainer (24h)"
            value={topGainer?.name || "-"}
            change={topGainer?.change_1d}
            loading={protocolsLoading}
          />
        </div>

        {/* Historical TVL Chart */}
        <HistoricalTVLChart 
          data={tvlHistory || []} 
          loading={tvlHistoryLoading} 
          title="XLayer Protocol TVL History"
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search protocols..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tvl">TVL (High to Low)</SelectItem>
              <SelectItem value="change_1d">24h Change</SelectItem>
              <SelectItem value="change_7d">7d Change</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
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
            <Button variant="outline" onClick={exportCSV}>Export CSV</Button>
          </div>
        </div>

        {/* Protocols Table */}
        <ProtocolTable
          protocols={pagedProtocols}
          loading={protocolsLoading}
          showCategory={true}
        />

        {/* Pagination controls */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Showing {pagedProtocols.length} of {filteredProtocols.length} results</div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
            <div className="text-sm text-muted-foreground">Page {page} / {totalPages}</div>
            <Button variant="ghost" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
          </div>
        </div>

        {/* Results count */}
        {!protocolsLoading && (
          <p className="text-sm text-muted-foreground">
            Showing {filteredProtocols.length} of {protocolCount} protocols
          </p>
        )}
      </div>
    </Layout>
  );
}
