import { Layout } from "@/components/layout/Layout";
import { useParams, Link } from "react-router-dom";
import { useFeesData, useProtocolDetails } from "@/hooks/useDefiData";
import { StatCard } from "@/components/dashboard/StatCard";
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, DollarSign, BarChart3, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercentage } from "@/lib/api/defillama";
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function FeeDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: fees, isLoading } = useFeesData();

  // Better matching logic for finding the fee item
  const item = useMemo(() => {
    if (!fees || !id) return null;
    const searchId = id.toLowerCase();
    
    return fees.find((f: any) => {
      const name = (f.name || "").toLowerCase();
      const displayName = (f.displayName || "").toLowerCase();
      const slug = (f.slug || "").toLowerCase();
      const nameSlug = name.replace(/\s+/g, "-");
      const displayNameSlug = displayName.replace(/\s+/g, "-");
      
      return (
        name === searchId ||
        displayName === searchId ||
        slug === searchId ||
        nameSlug === searchId ||
        displayNameSlug === searchId
      );
    });
  }, [fees, id]);

  const protocolSlug = item?.slug || item?.name?.toLowerCase().replace(/\s+/g, "-") || null;
  const { data: protoDetails } = useProtocolDetails(protocolSlug);

  // Calculate rank
  const rank = useMemo(() => {
    if (!fees || !item) return 0;
    const sorted = [...fees].sort((a, b) => (b.total24h || 0) - (a.total24h || 0));
    return sorted.findIndex((f: any) => f.name === item.name) + 1;
  }, [fees, item]);

  // Volume comparison data
  const feeData = useMemo(() => {
    if (!item) return [];
    return [
      { name: "24h", fees: item.total24h || 0 },
      { name: "7d", fees: item.total7d || 0 },
      { name: "30d", fees: item.total30d || 0 },
      { name: "All Time", fees: item.totalAllTime || 0 },
    ];
  }, [item]);

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6 animate-fade-in">
          <div className="skeleton h-8 w-32" />
          <div className="skeleton h-16 w-64" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-lg" />
            ))}
          </div>
          <div className="skeleton h-[300px] rounded-lg" />
        </div>
      </Layout>
    );
  }

  if (!item) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Wallet className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Fee data not found</h2>
          <p className="text-muted-foreground mb-4">
            The protocol "{id}" fee data could not be found.
          </p>
          <Link to="/fees">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Fees
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const change1d = item.change_1d || 0;
  const change7d = item.change_7d || 0;

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Back Button */}
        <Link to="/fees" className="inline-flex">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Fees
          </Button>
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {item.logo ? (
            <img
              src={item.logo}
              alt={item.displayName || item.name}
              className="h-16 w-16 rounded-full bg-muted flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl flex-shrink-0">
              {(item.displayName || item.name || "?").charAt(0)}
            </div>
          )}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{item.displayName || item.name}</h1>
              {item.category && (
                <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">
                  {item.category}
                </span>
              )}
              {rank > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  Rank #{rank}
                </span>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              Protocol fee revenue tracker
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{formatCurrency(item.total24h || 0)}</p>
            <p className="text-sm text-muted-foreground">24h Fees</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="24h Fees"
            value={formatCurrency(item.total24h || 0)}
            icon={DollarSign}
          />
          <StatCard
            title="7d Fees"
            value={formatCurrency(item.total7d || 0)}
            icon={Wallet}
          />
          <StatCard
            title="24h Change"
            value={formatPercentage(change1d)}
            change={change1d}
            icon={change1d >= 0 ? TrendingUp : TrendingDown}
          />
          <StatCard
            title="7d Change"
            value={formatPercentage(change7d)}
            change={change7d}
            icon={change7d >= 0 ? TrendingUp : TrendingDown}
          />
        </div>

        {/* Fee Comparison Chart */}
        <div className="rounded-lg border border-border bg-card p-4 md:p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Fee Overview</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={feeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCurrency(v)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [formatCurrency(value), "Fees"]}
                />
                <Bar dataKey="fees" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fee Details */}
          <div className="rounded-lg border border-border bg-card p-4 md:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Fee Details</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Protocol</span>
                <span className="font-medium text-foreground">{item.displayName || item.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium text-foreground">{item.category || "-"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">24h Fees</span>
                <span className="font-mono font-medium text-foreground">{formatCurrency(item.total24h || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">7d Fees</span>
                <span className="font-mono text-foreground">{formatCurrency(item.total7d || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">30d Fees</span>
                <span className="font-mono text-foreground">{formatCurrency(item.total30d || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">All Time</span>
                <span className="font-mono text-foreground">{formatCurrency(item.totalAllTime || 0)}</span>
              </div>
            </div>
          </div>

          {/* Protocol Details */}
          <div className="rounded-lg border border-border bg-card p-4 md:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Protocol Information</h3>
            {protoDetails ? (
              <div className="space-y-4">
                {protoDetails.description && (
                  <p className="text-sm text-muted-foreground">{protoDetails.description}</p>
                )}
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">TVL</span>
                  <span className="font-mono text-foreground">{formatCurrency(protoDetails.tvl || 0)}</span>
                </div>
                {protoDetails.chains && (
                  <div className="py-2 border-b border-border">
                    <span className="text-muted-foreground text-sm">Chains</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {protoDetails.chains.slice(0, 8).map((chain: string) => (
                        <span
                          key={chain}
                          className="px-2 py-1 rounded-full bg-secondary text-secondary-foreground text-xs"
                        >
                          {chain}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  {protoDetails.url && (
                    <a href={protoDetails.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Website
                      </Button>
                    </a>
                  )}
                  {protoDetails.twitter && (
                    <a
                      href={`https://twitter.com/${protoDetails.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Twitter
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No additional protocol information available.</p>
            )}

            {/* DefiLlama Link */}
            <div className="mt-6 pt-4 border-t border-border">
              <a
                href={`https://defillama.com/fees/${encodeURIComponent(item.name?.toLowerCase() || "")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on DefiLlama
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
