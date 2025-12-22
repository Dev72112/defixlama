import { Layout } from "@/components/layout/Layout";
import { StatCard } from "@/components/dashboard/StatCard";
import { useFeesData } from "@/hooks/useDefiData";
import { formatCurrency } from "@/lib/api/defillama";
import { BarChart3, TrendingUp, Search, DollarSign, Activity } from "lucide-react";
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

export default function Fees() {
  const { data: fees, isLoading } = useFeesData();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(200);

  // Filter and sort fee entries (no hard slice here)
  const filteredFees = useMemo(() => {
    if (!fees) return [];
    return fees
      .filter((f) => (f.displayName || f.name || "").toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => (b.total24h || 0) - (a.total24h || 0));
  }, [fees, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredFees.length / pageSize));
  if (page > totalPages) setPage(1);
  const paginatedFees = filteredFees.slice((page - 1) * pageSize, page * pageSize);

  const total24h = fees?.reduce((acc, f) => acc + (f.total24h || 0), 0) || 0;
  const protocolsCount = fees?.length || 0;

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Fees</h1>
            <p className="text-muted-foreground mt-1">Protocol fee volumes across chains</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4 text-primary animate-pulse" />
            {protocolsCount} protocols
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="24h Fees"
            value={formatCurrency(total24h)}
            icon={DollarSign}
            loading={isLoading}
          />
          <StatCard
            title="Protocols"
            value={protocolsCount.toString()}
            icon={Activity}
            loading={isLoading}
          />
          <StatCard
            title="Top Change"
            value={"-"}
            icon={TrendingUp}
            loading={isLoading}
          />
          <StatCard
            title="Fees Chart"
            value={"Live"}
            icon={BarChart3}
            loading={isLoading}
          />
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search protocols..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Fees Table */}
        {isLoading ? (
          <div className="rounded-lg border border-border bg-card overflow-x-auto">
            <table className="data-table w-full min-w-[500px]">
              <thead>
                <tr className="bg-muted/30">
                  <th className="w-12 hidden sm:table-cell">#</th>
                  <th>Protocol</th>
                  <th className="text-right">24h Fees</th>
                  <th className="text-right hidden sm:table-cell">7d Fees</th>
                  <th className="text-right">24h Change</th>
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
            <p className="text-muted-foreground">No fee data found</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-x-auto">
            <table className="data-table w-full min-w-[500px]">
              <thead>
                <tr className="bg-muted/30">
                  <th className="w-12 hidden sm:table-cell">#</th>
                  <th>Protocol</th>
                  <th className="text-right">24h Fees</th>
                  <th className="text-right hidden sm:table-cell">7d Fees</th>
                  <th className="text-right">24h Change</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFees.map((fee, index) => {
                  const slug = (fee.displayName || fee.name || index).toString().toLowerCase().replace(/\s+/g, '-');
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
                      <td>
                        <div className="flex items-center gap-3">
                          {fee.logo ? (
                            <img
                              src={fee.logo}
                              alt={fee.displayName || fee.name}
                              className="h-8 w-8 rounded-full bg-muted flex-shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${fee.name}&background=1a1a2e&color=2dd4bf&size=32`;
                              }}
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                              {(fee.displayName || fee.name || "?").charAt(0)}
                            </div>
                          )}
                          <span className="font-medium text-foreground truncate max-w-[120px] sm:max-w-none">
                            {fee.displayName || fee.name}
                          </span>
                        </div>
                      </td>
                      <td className="text-right font-mono font-medium text-foreground whitespace-nowrap">
                        {formatCurrency(fee.total24h)}
                      </td>
                      <td className="text-right font-mono text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                        {formatCurrency(fee.total7d)}
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <span
                          className={cn(
                            "font-mono text-sm",
                            (fee.change_1d || 0) >= 0
                              ? "text-success"
                              : "text-destructive"
                          )}
                        >
                          {fee.change_1d !== undefined
                            ? `${fee.change_1d >= 0 ? "+" : ""}${fee.change_1d.toFixed(2)}%`
                            : "-"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {!isLoading && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {Math.min((page - 1) * pageSize + 1, filteredFees.length)}-
              {Math.min(page * pageSize, filteredFees.length)} of {filteredFees.length} results
            </p>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Per page</span>
                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                  <SelectTrigger className="w-[90px]">
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
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} />
                  </PaginationItem>
                  {Array.from({ length: totalPages }).slice(0, 7).map((_, i) => {
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
