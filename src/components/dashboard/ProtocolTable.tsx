import { Protocol, formatCurrency, formatPercentage, getChangeColor } from "@/lib/api/defillama";
import { cn } from "@/lib/utils";
import { ExternalLink, TrendingUp, TrendingDown, Shield, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { WatchlistButton } from "@/components/WatchlistButton";

interface ProtocolTableProps {
  protocols: Protocol[];
  loading?: boolean;
  showCategory?: boolean;
  showSparkline?: boolean;
  showAuditBadge?: boolean;
  limit?: number;
  className?: string;
}

// Simple sparkline component
function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (!data || data.length < 2) return null;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 40;
    const y = 12 - ((v - min) / range) * 10;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width="40" height="14" className="flex-shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "hsl(var(--success))" : "hsl(var(--destructive))"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProtocolTable({
  protocols,
  loading = false,
  showCategory = true,
  showSparkline = false,
  showAuditBadge = false,
  limit,
  className,
}: ProtocolTableProps) {
  const displayProtocols = limit ? protocols.slice(0, limit) : protocols;

  if (loading) {
    return (
      <div className={cn("rounded-lg border border-border bg-card overflow-hidden", className)}>
        {/* Mobile loading skeleton */}
        <div className="sm:hidden divide-y divide-border">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="skeleton h-8 w-8 rounded-full flex-shrink-0" />
                <div className="space-y-1.5">
                  <div className="skeleton h-3.5 w-24" />
                  <div className="skeleton h-3 w-20" />
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <div className="skeleton h-3.5 w-20" />
                <div className="skeleton h-3 w-14" />
              </div>
            </div>
          ))}
        </div>
        {/* Desktop loading skeleton */}
        <table className="data-table w-full hidden sm:table">
          <thead>
            <tr className="bg-muted/30">
              <th className="w-12 hidden sm:table-cell">#</th>
              <th>Name</th>
              {showCategory && <th className="hidden md:table-cell">Category</th>}
              <th className="text-right">TVL</th>
              <th className="text-right">24h</th>
              <th className="text-right hidden sm:table-cell">7d</th>
            </tr>
          </thead>
          <tbody>
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <tr key={i}>
                  <td className="hidden sm:table-cell"><div className="skeleton h-4 w-6" /></td>
                  <td><div className="skeleton h-4 w-32" /></td>
                  {showCategory && <td className="hidden md:table-cell"><div className="skeleton h-4 w-20" /></td>}
                  <td><div className="skeleton h-4 w-24 ml-auto" /></td>
                  <td><div className="skeleton h-4 w-16 ml-auto" /></td>
                  <td className="hidden sm:table-cell"><div className="skeleton h-4 w-16 ml-auto" /></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (displayProtocols.length === 0) {
    return (
      <div className={cn("rounded-lg border border-border bg-card p-8 text-center", className)}>
        <p className="text-muted-foreground">No protocols found</p>
        <p className="text-sm text-muted-foreground mt-2">
          No protocol data available for this chain
        </p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border border-border bg-card overflow-hidden", className)}>
      {/* ── MOBILE CARD LIST (hidden on sm+) ── */}
      <div className="sm:hidden divide-y divide-border">
        {displayProtocols.map((protocol, index) => {
          const slug = protocol.slug || protocol.name.toLowerCase().replace(/\s+/g, "-");
          const changeColor1d = getChangeColor(protocol.change_1d);
          const changeColor7d = getChangeColor(protocol.change_7d);
          const isPositive1d = protocol.change_1d !== undefined && protocol.change_1d >= 0;
          const isPositive7d = protocol.change_7d !== undefined && protocol.change_7d >= 0;

          return (
            <div
              key={protocol.id || protocol.name}
              className="flex items-center justify-between gap-3 px-3 py-2.5 active:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => window.location.href = `/protocols/${slug}`}
              role="button"
              tabIndex={0}
            >
              {/* Left — logo + name + category */}
              <div className="flex items-center gap-2.5 min-w-0">
                {protocol.logo ? (
                  <img
                    src={protocol.logo}
                    alt={protocol.name}
                    className="h-8 w-8 rounded-full bg-muted flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${protocol.name}&background=1a1a2e&color=2dd4bf&size=32`;
                    }}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                    {protocol.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground truncate leading-tight">
                    {protocol.name}
                  </p>
                  {showCategory && (
                    <p className="text-[11px] text-muted-foreground truncate leading-tight">
                      {protocol.category || "DeFi"}
                    </p>
                  )}
                </div>
              </div>

              {/* Right — tvl + changes stacked */}
              <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                <span className="font-mono text-sm font-medium text-foreground">
                  {formatCurrency(protocol.tvl)}
                </span>
                <span className={cn("inline-flex items-center gap-0.5 font-mono text-[11px]", changeColor1d)}>
                  {isPositive1d
                    ? <TrendingUp className="h-3 w-3" />
                    : <TrendingDown className="h-3 w-3" />
                  }
                  {formatPercentage(protocol.change_1d)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── DESKTOP TABLE (hidden below sm) ── */}
      <table className="data-table w-full hidden sm:table">
        <thead>
          <tr className="sticky top-0 bg-card z-20 backdrop-blur-sm bg-muted/30 border-b border-border">
            <th className="w-10 hidden sm:table-cell"></th>
            <th className="w-12 hidden sm:table-cell">#</th>
            <th>Name</th>
            {showCategory && <th className="hidden md:table-cell">Category</th>}
            {showAuditBadge && <th className="hidden lg:table-cell text-center">Audit</th>}
            <th className="text-right">TVL</th>
            {showSparkline && <th className="text-right hidden lg:table-cell">7d Trend</th>}
            <th className="text-right">24h</th>
            <th className="text-right hidden sm:table-cell">7d</th>
          </tr>
        </thead>
        <tbody>
          {displayProtocols.map((protocol, index) => {
            const slug = protocol.slug || protocol.name.toLowerCase().replace(/\s+/g, "-");
            return (
            <tr key={protocol.id || protocol.name} className="group cursor-pointer" onClick={() => window.location.href = `/protocols/${slug}`}>
              <td className="hidden sm:table-cell" onClick={(e) => e.stopPropagation()}>
                <WatchlistButton
                  item={{
                    id: slug,
                    symbol: protocol.symbol || protocol.name.slice(0, 4).toUpperCase(),
                    name: protocol.name,
                    type: "protocol",
                  }}
                />
              </td>
              <td className="text-muted-foreground font-mono text-sm hidden sm:table-cell">
                {index + 1}
              </td>
              <td>
                <div className="flex items-center gap-3">
                  {protocol.logo ? (
                    <img
                      src={protocol.logo}
                      alt={protocol.name}
                      className="h-8 w-8 rounded-full bg-muted flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${protocol.name}&background=1a1a2e&color=2dd4bf&size=32`;
                      }}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                      {protocol.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground truncate max-w-[120px] sm:max-w-none">
                        {protocol.name}
                      </span>
                      {protocol.url && (
                        <a
                          href={protocol.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                    {protocol.symbol && (
                      <span className="text-xs text-muted-foreground">
                        ${protocol.symbol}
                      </span>
                    )}
                  </div>
                </div>
              </td>
              {showCategory && (
                <td className="hidden md:table-cell">
                  <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                    {protocol.category || "DeFi"}
                  </span>
                </td>
              )}
              {showAuditBadge && (
                <td className="hidden lg:table-cell text-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        {protocol.audits && Number(protocol.audits) > 0 ? (
                          <ShieldCheck className="h-4 w-4 text-success inline-block" />
                        ) : (
                          <Shield className="h-4 w-4 text-muted-foreground inline-block" />
                        )}
                      </TooltipTrigger>
                      <TooltipContent>
                        {protocol.audits && Number(protocol.audits) > 0
                          ? `${protocol.audits} audit(s) completed`
                          : "No audit info available"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </td>
              )}
              <td className="text-right font-mono font-medium text-foreground whitespace-nowrap">
                {formatCurrency(protocol.tvl)}
              </td>
              {showSparkline && (
                <td className="text-right hidden lg:table-cell">
                  <div className="flex justify-end">
                    <Sparkline
                      data={[
                        protocol.tvl * (1 - (protocol.change_7d || 0) / 100),
                        protocol.tvl * (1 - (protocol.change_7d || 0) / 100 * 0.7),
                        protocol.tvl * (1 - (protocol.change_7d || 0) / 100 * 0.5),
                        protocol.tvl * (1 - (protocol.change_7d || 0) / 100 * 0.3),
                        protocol.tvl * (1 - (protocol.change_7d || 0) / 100 * 0.1),
                        protocol.tvl
                      ]}
                      positive={(protocol.change_7d || 0) >= 0}
                    />
                  </div>
                </td>
              )}
              <td className="text-right whitespace-nowrap">
                <div
                  className={cn(
                    "inline-flex items-center gap-1 font-mono text-sm",
                    getChangeColor(protocol.change_1d)
                  )}
                >
                  {protocol.change_1d !== undefined && protocol.change_1d >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {formatPercentage(protocol.change_1d)}
                </div>
              </td>
              <td className="text-right hidden sm:table-cell whitespace-nowrap">
                <div
                  className={cn(
                    "inline-flex items-center gap-1 font-mono text-sm",
                    getChangeColor(protocol.change_7d)
                  )}
                >
                  {protocol.change_7d !== undefined && protocol.change_7d >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {formatPercentage(protocol.change_7d)}
                </div>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>

    </div>
  );
}
