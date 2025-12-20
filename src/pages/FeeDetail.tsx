import { Layout } from "@/components/layout/Layout";
import { useParams, Link } from "react-router-dom";
import { useFeesData, useProtocolDetails } from "@/hooks/useDefiData";
import { StatCard } from "@/components/dashboard/StatCard";
import { ArrowLeft, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/api/defillama";

export default function FeeDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: fees, isLoading } = useFeesData();

  const item = fees?.find((f: any) => (f.name || '').toLowerCase() === id || (f.project || '').toLowerCase() === id);
  const protocolSlug = item?.projectSlug || item?.slug || (item?.project || '').toLowerCase().replace(/\s+/g, '-');
  const { data: protoDetails } = useProtocolDetails(protocolSlug || null as any);

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <Link to="/fees" className="inline-flex">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>

        {isLoading ? (
          <div className="skeleton h-48 rounded-lg" />
        ) : !item ? (
          <div className="text-center text-muted-foreground">Fees item not found</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{item.name || item.project}</h1>
                <p className="text-sm text-muted-foreground">{item.category || ''}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{formatCurrency(item.fee || item.revenue || 0)}</p>
                <p className="text-xs text-muted-foreground">Recent Fees</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard title="24h Fees" value={formatCurrency(item.fee_1d || item.recent24h || 0)} icon={Wallet} />
              <StatCard title="7d Fees" value={formatCurrency(item.fee_7d || 0)} icon={Wallet} />
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <pre className="text-sm text-muted-foreground">{JSON.stringify(item, null, 2)}</pre>
              {protoDetails && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold">Protocol Details</h4>
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
