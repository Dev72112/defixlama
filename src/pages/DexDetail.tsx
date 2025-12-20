import { Layout } from "@/components/layout/Layout";
import { useParams, Link } from "react-router-dom";
import { useXLayerDexVolumes } from "@/hooks/useDefiData";
import oklink from "@/lib/api/oklink";
import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatCurrency } from "@/lib/api/defillama";
import { ArrowLeft, Activity, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DexDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: dexs, isLoading } = useXLayerDexVolumes();

  const dex = dexs?.find((d) => d.name.toLowerCase() === id || (d.displayName || '').toLowerCase() === id);
  // Try to enrich with OKLink if dex has a contract/address property
  const contract = (dex as any)?.address || (dex as any)?.contract || null;
  const oklinkQuery = useQuery({ queryKey: ["oklink-dex", contract], queryFn: () => (contract ? oklink.fetchOklinkContractInfo(contract) : null), enabled: !!contract, staleTime: 60 * 1000 });

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <Link to="/dexs" className="inline-flex">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to DEXs
          </Button>
        </Link>

        {isLoading ? (
          <div className="skeleton h-64 rounded-lg" />
        ) : !dex ? (
          <div className="text-center text-muted-foreground">DEX not found</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{dex.displayName || dex.name}</h1>
                <p className="text-sm text-muted-foreground">{dex.chains?.join(', ')}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{formatCurrency(dex.total24h || dex.total7d || 0)}</p>
                <p className="text-xs text-muted-foreground">24h Volume</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title="24h Volume" value={formatCurrency(dex.total24h || 0)} icon={Activity} />
              <StatCard title="7d Volume" value={formatCurrency(dex.total7d || 0)} icon={Activity} />
              <StatCard title="All Time" value={formatCurrency(dex.totalAllTime || 0)} icon={Activity} />
            </div>

            {dex.logo && (
              <a href={dex.url || '#'} target="_blank" rel="noopener noreferrer" className="text-primary/80">
                <ExternalLink className="inline-block mr-2" /> Visit DEX
              </a>
            )}
            {contract && (
              <div className="rounded-lg border border-border bg-card p-4 mt-4">
                <h4 className="text-sm font-semibold mb-2">On-Chain Info</h4>
                {oklinkQuery.isLoading ? (
                  <div className="text-sm text-muted-foreground">Loading on-chain info...</div>
                ) : oklinkQuery.data ? (
                  <pre className="text-xs text-muted-foreground max-h-40 overflow-auto">{JSON.stringify(oklinkQuery.data, null, 2)}</pre>
                ) : (
                  <div className="text-sm text-muted-foreground">No on-chain info available</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
