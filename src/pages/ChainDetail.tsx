import { Layout } from "@/components/layout/Layout";
import { useParams, Link } from "react-router-dom";
import { useChainsTVL, useChainTVLHistory } from "@/hooks/useDefiData";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatCurrency } from "@/lib/api/defillama";
import { ArrowLeft, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ChainDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: chains, isLoading } = useChainsTVL();
  const { data: history } = useChainTVLHistory(chain?.name || null);

  const chain = chains?.find((c) => c.name.toLowerCase() === id || (c.name || '').toLowerCase().replace(/\s+/g, '-') === id);

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <Link to="/chains" className="inline-flex">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Chains
          </Button>
        </Link>

        {isLoading ? (
          <div className="skeleton h-48 rounded-lg" />
        ) : !chain ? (
          <div className="text-center text-muted-foreground">Chain not found</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{chain.name}</h1>
                <p className="text-sm text-muted-foreground">Chain ID: {chain.chainId || '-'}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{formatCurrency(chain.tvl)}</p>
                <p className="text-xs text-muted-foreground">Total TVL</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title="TVL" value={formatCurrency(chain.tvl)} icon={Globe} />
              <StatCard title="Gecko ID" value={chain.gecko_id || '-'} icon={undefined as any} />
              <StatCard title="CMC ID" value={chain.cmcId?.toString() || '-'} icon={undefined as any} />
            </div>

            <div className="rounded-lg border border-border bg-card p-4 md:p-6">
              <h3 className="text-lg font-semibold mb-4">TVL History</h3>
              <div className="h-[300px] md:h-[380px]">
                {history && history.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={(history || []).slice(-90).map((d: any) => ({ date: new Date(d.date * 1000).toLocaleDateString(), tvl: d.tvl || d.totalLiquidityUSD || 0 }))}>
                      <defs>
                        <linearGradient id="chainTvl" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v)} domain={["auto", "auto"]} />
                      <Tooltip formatter={(value: number) => [formatCurrency(value), 'TVL']} />
                      <Area type="monotone" dataKey="tvl" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#chainTvl)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-muted-foreground">No history available</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
