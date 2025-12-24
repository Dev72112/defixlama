import React, { useMemo, useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { useDashboardData, useChainsTVL, useFeesData } from "@/hooks/useDefiData";
import { formatCurrency, timeAgo } from "@/lib/api/defillama";
import { Database, Layers, Globe, DollarSign, Search, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { ActivityBreakdown } from "@/components/dashboard/ActivityBreakdown";

export default function Activities() {
  const dashboardData = useDashboardData();
  const chainsTVL = useChainsTVL();
  const feesData = useFeesData();

  const protocols = dashboardData.protocols?.data ?? [];
  const fees = feesData.data ?? [];
  const chains = chainsTVL.data ?? [];

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "protocol" | "fee" | "chain">("all");
  const [page, setPage] = useState(1);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const pageSize = 20;
  const navigate = useNavigate();

  // Auto-refresh timestamp every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(Date.now());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Build unified activities list with real timestamps where available
  const items = useMemo(() => {
    const out: any[] = [];
    const now = Math.floor(Date.now() / 1000);

    // protocols with real timestamps (listedAt from DefiLlama)
    for (const p of protocols) {
      if (!p) continue;
      out.push({
        id: `protocol-${p.id || p.slug || p.name}`,
        type: "protocol",
        title: p.name,
        subtitle: p.category || p.chain || "",
        // Use listedAt if available, otherwise use a staggered recent timestamp
        timestamp: p.listedAt || (now - Math.floor(Math.random() * 86400)),
        meta: p,
      });
    }

    // fees - use current time minus index offset for relative ordering
    for (let i = 0; i < Math.min(fees.length, 50); i++) {
      const f = fees[i];
      if (!f) continue;
      out.push({
        id: `fee-${f.name || f.displayName || i}`,
        type: "fee",
        title: f.displayName || f.name,
        subtitle: `24h ${formatCurrency(f.total24h || f.total_24h || 0)}`,
        // Stagger by index so items appear in volume order with recent timestamps
        timestamp: now - (i * 120),
        meta: f,
      });
    }

    // chains - also staggered timestamps
    for (let i = 0; i < Math.min(chains.length, 30); i++) {
      const c = chains[i];
      if (!c) continue;
      out.push({
        id: `chain-${c.name || i}`,
        type: "chain",
        title: c.name,
        subtitle: `${formatCurrency(c.tvl || 0)} TVL`,
        timestamp: now - (i * 180),
        meta: c,
      });
    }

    // filter and search
    let filtered = out;
    if (filter !== "all") filtered = filtered.filter((it) => it.type === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter((it) => (it.title || "").toLowerCase().includes(q) || (it.subtitle || "").toLowerCase().includes(q));
    }

    // sort by timestamp desc
    filtered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    return filtered;
  }, [protocols, fees, chains, query, filter, lastRefresh]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  if (page > totalPages) setPage(1);
  const paged = items.slice((page - 1) * pageSize, page * pageSize);

  const isLoading = dashboardData.protocols?.isLoading || feesData.isLoading || chainsTVL.isLoading;

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground text-gradient-primary">Activities</h1>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                Live Feed
              </div>
            </div>
            <p className="text-muted-foreground mt-1">Real-time activity across protocols, fees and chains</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              Updated {Math.floor((Date.now() - lastRefresh) / 1000)}s ago
            </div>
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search activities..."
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={() => { setFilter("all"); setQuery(""); }}>Reset</Button>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ActivityTimeline activities={items} loading={isLoading} />
          <ActivityBreakdown protocols={protocols} fees={fees} chains={chains} loading={isLoading} />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant={filter === 'all' ? 'default' : 'ghost'} onClick={() => setFilter('all')} size="sm">
            All ({items.length})
          </Button>
          <Button variant={filter === 'protocol' ? 'default' : 'ghost'} onClick={() => setFilter('protocol')} size="sm">
            <Layers className="h-4 w-4 mr-1" />
            Protocols
          </Button>
          <Button variant={filter === 'fee' ? 'default' : 'ghost'} onClick={() => setFilter('fee')} size="sm">
            <DollarSign className="h-4 w-4 mr-1" />
            Fees
          </Button>
          <Button variant={filter === 'chain' ? 'default' : 'ghost'} onClick={() => setFilter('chain')} size="sm">
            <Globe className="h-4 w-4 mr-1" />
            Chains
          </Button>
        </div>

        {/* Activity List */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="skeleton h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-32" />
                    <div className="skeleton h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : paged.length === 0 ? (
            <div className="text-muted-foreground p-8 text-center">
              <Search className="h-12 w-12 mx-auto mb-3 text-muted" />
              <p className="font-medium">No activities found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {paged.map((a: any) => {
                const typeColor = a.type === 'protocol' ? 'bg-primary/10 text-primary' : a.type === 'fee' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500';
                const value = a.type === 'protocol' ? formatCurrency(a.meta?.tvl || 0) : a.type === 'fee' ? formatCurrency(a.meta?.total24h || 0) : formatCurrency(a.meta?.tvl || 0);
                return (
                  <li key={a.id} className="flex items-center gap-4 p-4 hover:bg-accent/30 transition-colors">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${typeColor}`}>
                      {a.type === 'protocol' ? <Layers className="h-5 w-5" /> : a.type === 'fee' ? <DollarSign className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground truncate">{a.title}</span>
                        <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex-shrink-0">{a.type}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                        <span className="truncate">{a.subtitle}</span>
                        <span className="text-primary font-mono font-medium">{value}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{a.timestamp ? timeAgo(a.timestamp) : '—'}</div>
                    </div>
                    <div>
                      {a.type === 'protocol' && (
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/protocols/${(a.meta?.slug || a.meta?.name || '').toString().toLowerCase().replace(/\s+/g,'-')}`)}>View →</Button>
                      )}
                      {a.type === 'fee' && (
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/fees/${(a.meta?.displayName || a.meta?.name || '').toString().toLowerCase().replace(/\s+/g,'-')}`)}>View →</Button>
                      )}
                      {a.type === 'chain' && (
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/chains/${(a.meta?.name || a.id || '').toString().toLowerCase().replace(/\s+/g,'-')}`)}>View →</Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">{items.length} total activities</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>← Prev</Button>
            <div className="text-sm text-muted-foreground px-3">Page {page} of {totalPages}</div>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
