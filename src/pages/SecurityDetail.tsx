import { Layout } from "@/components/layout/Layout";
import { useParams, Link } from "react-router-dom";
import { useAllProtocols, useProtocolDetails, useProtocolTVLHistory } from "@/hooks/useDefiData";
import { StatCard } from "@/components/dashboard/StatCard";
import { ArrowLeft, Shield, CheckCircle, AlertTriangle, ExternalLink, Globe, Twitter, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercentage } from "@/lib/api/defillama";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function SecurityDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: protocols, isLoading } = useAllProtocols();

  // Find protocol with better matching
  const proto = useMemo(() => {
    if (!protocols || !id) return null;
    const searchId = id.toLowerCase();
    
    return protocols.find((p) => {
      const slug = (p.slug || "").toLowerCase();
      const name = (p.name || "").toLowerCase();
      const nameSlug = name.replace(/\s+/g, "-");
      
      return slug === searchId || name === searchId || nameSlug === searchId;
    });
  }, [protocols, id]);

  const { data: protoDetails, isLoading: detailsLoading } = useProtocolDetails(proto?.slug || null);
  const { data: tvlHistory, isLoading: historyLoading } = useProtocolTVLHistory(proto?.slug || null);

  // Format chart data
  const chartData = useMemo(() => {
    if (!tvlHistory) return [];
    return tvlHistory.slice(-90).map((item: any) => ({
      date: new Date(item.date * 1000).toLocaleDateString(),
      tvl: item.totalLiquidityUSD || 0,
    }));
  }, [tvlHistory]);

  const isAudited = proto?.audits && proto.audits !== "0";

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

  if (!proto) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Shield className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Protocol not found</h2>
          <p className="text-muted-foreground mb-4">
            The protocol "{id}" could not be found.
          </p>
          <Link to="/security">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Security
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Back Button */}
        <Link to="/security" className="inline-flex">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Security
          </Button>
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {proto.logo ? (
            <img
              src={proto.logo}
              alt={proto.name}
              className="h-16 w-16 rounded-full bg-muted flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl flex-shrink-0">
              {proto.name.charAt(0)}
            </div>
          )}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{proto.name}</h1>
              {proto.symbol && (
                <span className="text-lg text-muted-foreground">${proto.symbol}</span>
              )}
              <div
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                  isAudited ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                )}
              >
                {isAudited ? (
                  <>
                    <CheckCircle className="h-3.5 w-3.5" />
                    Audited
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Unaudited
                  </>
                )}
              </div>
            </div>
            <p className="text-muted-foreground mt-1">{proto.category || "DeFi"}</p>
            {proto.description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{proto.description}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{formatCurrency(proto.tvl || 0)}</p>
            <p className="text-sm text-muted-foreground">Total Value Locked</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="TVL"
            value={formatCurrency(proto.tvl || 0)}
            icon={Layers}
          />
          <StatCard
            title="Security Status"
            value={isAudited ? "Audited" : "Unaudited"}
            icon={Shield}
          />
          <StatCard
            title="24h Change"
            value={formatPercentage(proto.change_1d)}
            change={proto.change_1d}
            icon={proto.change_1d && proto.change_1d >= 0 ? CheckCircle : AlertTriangle}
          />
          <StatCard
            title="Chains"
            value={(proto.chains?.length || 0).toString()}
            icon={Globe}
          />
        </div>

        {/* Security Status Card */}
        <div
          className={cn(
            "rounded-lg border p-6",
            isAudited
              ? "border-success/30 bg-success/5"
              : "border-warning/30 bg-warning/5"
          )}
        >
          <div className="flex items-start gap-4">
            {isAudited ? (
              <CheckCircle className="h-8 w-8 text-success flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-warning flex-shrink-0" />
            )}
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {isAudited ? "Security Audit Completed" : "No Security Audit Found"}
              </h3>
              <p className="text-muted-foreground mt-1">
                {proto.audit_note ||
                  (isAudited
                    ? "This protocol has undergone a security audit. However, an audit does not guarantee complete security. Always DYOR."
                    : "This protocol has not been audited. Exercise additional caution when interacting with unaudited protocols.")}
              </p>
            </div>
          </div>
        </div>

          {/* TVL History Chart */}
        <div className="rounded-lg border border-border bg-card p-4 md:p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">TVL History (90 Days)</h3>
          <div className="h-[300px]">
            {historyLoading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Loading chart data...
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="securityTvlGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
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
                    formatter={(value: number) => [formatCurrency(value), "TVL"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="tvl"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#securityTvlGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No TVL history available
              </div>
            )}
          </div>
        </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Oracles */}
          {proto.oracles && proto.oracles.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-4 md:p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Oracles Used</h3>
              <div className="flex flex-wrap gap-2">
                {proto.oracles.map((oracle) => (
                  <span
                    key={oracle}
                    className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm"
                  >
                    {oracle}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Oracles provide external data feeds to the protocol. The security of these oracles is critical for the protocol's operation.
              </p>
            </div>
          )}

          {/* Chains */}
          {proto.chains && proto.chains.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-4 md:p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Deployed Chains</h3>
              <div className="flex flex-wrap gap-2">
                {proto.chains.map((chain) => (
                  <span
                    key={chain}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm",
                      chain.toLowerCase().includes("xlayer")
                        ? "bg-primary/20 text-primary"
                        : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {chain}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Security Insights */}
        {protoDetails && (
          <div className="rounded-lg border border-border bg-card p-4 md:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Security Insights</h3>

            {/* Risk / score */}
            {(
              protoDetails.riskView || protoDetails.risk || protoDetails.securityScore || protoDetails.security || protoDetails.score
            ) && (
              <div className="mb-4">
                <strong className="text-sm text-muted-foreground block mb-1">Risk / Score</strong>
                <div className="flex items-center gap-3">
                  <div className="font-mono text-foreground">
                    {protoDetails.riskView?.score ?? protoDetails.risk ?? protoDetails.securityScore ?? protoDetails.score ?? "N/A"}
                  </div>
                  <p className="text-sm text-muted-foreground">{protoDetails.riskView?.note || protoDetails.security?.note || "Protocol risk overview from DefiLlama."}</p>
                </div>
              </div>
            )}

            {/* Audits / Reports */}
            {(
              protoDetails.audits || protoDetails.audit_links || protoDetails.audit_urls || protoDetails.reports || protoDetails.auditReports
            ) && (
              <div className="mb-4">
                <strong className="text-sm text-muted-foreground block mb-2">Audits & Reports</strong>
                <div className="flex flex-col gap-2">
                  {Array.isArray(protoDetails.audit_links) && protoDetails.audit_links.map((u: string, i: number) => (
                    <a key={i} href={u} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-2">
                      <ExternalLink className="h-3 w-3" />
                      {u}
                    </a>
                  ))}
                  {Array.isArray(protoDetails.audit_urls) && protoDetails.audit_urls.map((u: string, i: number) => (
                    <a key={i} href={u} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-2">
                      <ExternalLink className="h-3 w-3" />
                      {u}
                    </a>
                  ))}
                  {Array.isArray(protoDetails.reports) && protoDetails.reports.map((r: any, i: number) => (
                    <a key={i} href={r.url || r.link || '#'} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-2">
                      <ExternalLink className="h-3 w-3" />
                      {r.title || r.name || r.url || r.link}
                    </a>
                  ))}
                  {typeof protoDetails.audits === 'string' && (
                    <div className="text-sm text-muted-foreground">{protoDetails.audits}</div>
                  )}
                </div>
              </div>
            )}

            {/* Vulnerabilities / Exploits */}
            {(
              protoDetails.vulnerabilities || protoDetails.vulns || protoDetails.exploits || protoDetails.security?.vulnerabilities
            ) && (
              <div className="mb-4">
                <strong className="text-sm text-muted-foreground block mb-2">Vulnerabilities / Exploits</strong>
                <div className="space-y-2">
                  {(protoDetails.vulnerabilities || protoDetails.vulns || protoDetails.exploits || protoDetails.security?.vulnerabilities).map((v: any, i: number) => (
                    <div key={i} className="p-3 rounded bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground">{v.title || v.name || `Issue #${i + 1}`}</div>
                          <div className="text-xs text-muted-foreground">{v.severity || v.level || v.risk || ''}</div>
                        </div>
                        {v.link && (
                          <a href={v.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                            Details <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      {v.description && <p className="text-sm text-muted-foreground mt-2">{v.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contracts summary (link to Protocol page addresses) */}
            {protoDetails.addresses && Array.isArray(protoDetails.addresses) && (
              <div>
                <strong className="text-sm text-muted-foreground block mb-2">Verified Contracts</strong>
                <div className="text-sm text-muted-foreground">{protoDetails.addresses.length} contract addresses (showing up to 100 on protocol page).</div>
              </div>
            )}
          </div>
        )}

        {/* Protocol Info */}
        <div className="rounded-lg border border-border bg-card p-4 md:p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Protocol Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium text-foreground">{proto.category || "-"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">TVL</span>
                <span className="font-mono text-foreground">{formatCurrency(proto.tvl || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Market Cap</span>
                <span className="font-mono text-foreground">{formatCurrency(proto.mcap || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Audit Status</span>
                <span className={cn("font-medium", isAudited ? "text-success" : "text-warning")}>
                  {isAudited ? "Audited" : "Unaudited"}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              {proto.methodology && (
                <div>
                  <span className="text-sm text-muted-foreground">Methodology</span>
                  <p className="text-foreground mt-1 text-sm">{proto.methodology}</p>
                </div>
              )}
              {protoDetails?.listedAt && (
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Listed</span>
                  <span className="text-foreground">
                    {new Date(protoDetails.listedAt * 1000).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* External Links */}
          <div className="mt-6 pt-4 border-t border-border">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Links</h4>
            <div className="flex flex-wrap gap-2">
              {proto.url && (
                <a href={proto.url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    <Globe className="h-4 w-4 mr-2" />
                    Website
                  </Button>
                </a>
              )}
              {proto.twitter && (
                <a href={`https://twitter.com/${proto.twitter}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    <Twitter className="h-4 w-4 mr-2" />
                    Twitter
                  </Button>
                </a>
              )}
              <a
                href={`https://defillama.com/protocol/${encodeURIComponent(proto.slug || proto.name.toLowerCase())}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  DefiLlama
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
