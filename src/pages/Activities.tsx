import React, { useMemo, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useDashboardData, useChainsTVL, useFeesData } from "@/hooks/useDefiData";
import { formatCurrency, timeAgo } from "@/lib/api/defillama";
import { Database, Layers, Globe, DollarSign, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";

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
  const pageSize = 20;
  const navigate = useNavigate();

  // Build unified activities list
  const items = useMemo(() => {
    const out: any[] = [];

    // protocols with real timestamps
    for (const p of protocols) {
      if (!p) continue;
      out.push({
        id: p.id || p.slug || p.name,
        type: "protocol",
        title: p.name,
        subtitle: p.category || p.chain || "",
        timestamp: p.listedAt || 0,
        meta: p,
      });
    }

    // fees (no reliable timestamp) — approximate using index
    for (let i = 0; i < fees.length; i++) {
      const f = fees[i];
      out.push({
        id: f.name || f.displayName || `fee-${i}`,
        type: "fee",
        title: f.displayName || f.name,
        subtitle: `24h ${formatCurrency(f.total24h || f.total_24h || 0)}`,
        timestamp: Math.floor(Date.now() / 1000) - i * 60,
        meta: f,
      });
    }

    // chains
    for (let i = 0; i < chains.length; i++) {
      const c = chains[i];
      out.push({
        id: c.name || `chain-${i}`,
        type: "chain",
        title: c.name,
        subtitle: `${formatCurrency(c.tvl || 0)} TVL`,
        timestamp: Math.floor(Date.now() / 1000) - i * 120,
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
  }, [protocols, fees, chains, query, filter]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  if (page > totalPages) setPage(1);
  const paged = items.slice((page - 1) * pageSize, page * pageSize);

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Activities</h1>
            <p className="text-muted-foreground mt-1">Chronological activity across protocols, fees and chains</p>
          </div>
          <div className="flex items-center gap-3">
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

        <div className="flex items-center gap-2">
          <Button variant={filter === 'all' ? 'default' : 'ghost'} onClick={() => setFilter('all')}>All</Button>
          <Button variant={filter === 'protocol' ? 'default' : 'ghost'} onClick={() => setFilter('protocol')}>Protocols</Button>
          <Button variant={filter === 'fee' ? 'default' : 'ghost'} onClick={() => setFilter('fee')}>Fees</Button>
          <Button variant={filter === 'chain' ? 'default' : 'ghost'} onClick={() => setFilter('chain')}>Chains</Button>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          {paged.length === 0 ? (
            <div className="text-muted-foreground p-6 text-center">No activities found</div>
          ) : (
            <ul className="divide-y">
              {paged.map((a: any) => (
                <li key={a.id} className="flex items-center gap-4 py-3">
                  <div className="h-10 w-10 rounded-full bg-muted/10 flex items-center justify-center">
                    {a.type === 'protocol' ? <Layers className="h-5 w-5" /> : a.type === 'fee' ? <DollarSign className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-medium truncate">{a.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{a.subtitle}</div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{a.timestamp ? timeAgo(a.timestamp) : '—'}</div>
                  </div>
                  <div>
                    {a.type === 'protocol' && (
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/protocols/${(a.meta?.slug || a.meta?.name || '').toString().toLowerCase().replace(/\s+/g,'-')}`)}>View</Button>
                    )}
                    {a.type === 'fee' && (
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/fees/${(a.meta?.displayName || a.meta?.name || '').toString().toLowerCase().replace(/\s+/g,'-')}`)}>View</Button>
                    )}
                    {a.type === 'chain' && (
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/chains/${(a.meta?.name || a.id || '').toString().toLowerCase().replace(/\s+/g,'-')}`)}>View</Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-muted-foreground">{items.length} activities</div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
            <div className="text-sm text-muted-foreground">Page {page} / {totalPages}</div>
            <Button variant="ghost" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
