import { Layout } from "@/components/layout/Layout";
import { useParams, Link } from "react-router-dom";
import { useAllProtocols, useProtocolDetails } from "@/hooks/useDefiData";
import { StatCard } from "@/components/dashboard/StatCard";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function SecurityDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: protocols, isLoading } = useAllProtocols();

  const proto = protocols?.find((p) => (p.slug || '').toLowerCase() === id || (p.name || '').toLowerCase().replace(/\s+/g, '-') === id);
  const { data: protoDetails } = useProtocolDetails(proto?.slug || null);

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <Link to="/security" className="inline-flex">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>

        {isLoading ? (
          <div className="skeleton h-48 rounded-lg" />
        ) : !proto ? (
          <div className="text-center text-muted-foreground">Project not found</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{proto.name}</h1>
                <p className="text-sm text-muted-foreground">{proto.category}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{proto.audits ? 'Audited' : 'Not Audited'}</p>
                <p className="text-xs text-muted-foreground">Security Status</p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-lg font-semibold mb-2">Audit Notes</h3>
              <p className="text-sm text-muted-foreground">{proto.audit_note || proto.audits || 'No audit information available.'}</p>
              {protoDetails && (
                <div className="mt-3">
                  <h4 className="text-sm font-semibold">DefiLlama Details</h4>
                  <pre className="text-xs text-muted-foreground max-h-40 overflow-auto">{JSON.stringify(protoDetails, null, 2)}</pre>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <h4 className="text-sm font-semibold">Oracles</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {proto.oracles?.map((o) => (
                    <span key={o} className={cn('px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm')}>{o}</span>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <h4 className="text-sm font-semibold">Methodology</h4>
                <p className="text-sm text-muted-foreground mt-2">{proto.methodology || 'Not available'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
