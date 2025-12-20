import { Layout } from "@/components/layout/Layout";
import { useParams, Link } from "react-router-dom";
import { useStablecoins, useProtocolDetails } from "@/hooks/useDefiData";
import { useQuery } from "@tanstack/react-query";
import oklink from "@/lib/api/oklink";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatCurrency } from "@/lib/api/defillama";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StablecoinDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: stablecoins, isLoading } = useStablecoins();

  const coin = stablecoins?.find((s) => (s.symbol || '').toLowerCase() === id || (s.id || '').toLowerCase() === id);
  // Try to find a related protocol or contract to enrich via OKLink
  const contract = (coin as any)?.contract || null;
  const oklinkInfo = useQuery({ queryKey: ["oklink-stable", contract], queryFn: () => (contract ? oklink.fetchOklinkContractInfo(contract) : null), enabled: !!contract, staleTime: 60 * 1000 });

  const protocolSlug = (coin as any)?.projectSlug || (coin as any)?.gecko_id || null;
  const { data: protoDetails } = useProtocolDetails(protocolSlug || null as any);

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <Link to="/stablecoins" className="inline-flex">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>

        {isLoading ? (
          <div className="skeleton h-48 rounded-lg" />
        ) : !coin ? (
          <div className="text-center text-muted-foreground">Stablecoin not found</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{coin.name}</h1>
                <p className="text-sm text-muted-foreground">{coin.symbol}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{formatCurrency(coin.price || 0)}</p>
                <p className="text-xs text-muted-foreground">Price</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard title="Peg Type" value={coin.pegType || '-'} icon={undefined as any} />
              <StatCard title="Price Source" value={coin.priceSource || '-'} icon={undefined as any} />
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-lg font-semibold">Circulating Supply</h3>
              <pre className="text-sm text-muted-foreground">{JSON.stringify(coin.circulating || {}, null, 2)}</pre>
              {oklinkInfo.data && (
                <div className="mt-3">
                  <h4 className="text-sm font-semibold">On-chain Info</h4>
                  <pre className="text-xs text-muted-foreground max-h-40 overflow-auto">{JSON.stringify(oklinkInfo.data, null, 2)}</pre>
                </div>
              )}
              {protoDetails && (
                <div className="mt-3">
                  <h4 className="text-sm font-semibold">DefiLlama Details</h4>
                  <pre className="text-xs text-muted-foreground max-h-40 overflow-auto">{JSON.stringify(protoDetails, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
