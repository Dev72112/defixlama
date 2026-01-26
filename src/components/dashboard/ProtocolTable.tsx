import { Protocol, formatCurrency, formatPercentage, getChangeColor } from "@/lib/api/defillama";
import { cn } from "@/lib/utils";
import { ExternalLink, TrendingUp, TrendingDown, Shield, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { WatchlistButton } from "@/components/WatchlistButton";
import { useIsMobile } from "@/hooks/use-mobile";

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

// Mobile card component for Protocol
function ProtocolMobileCard({ 
  protocol, 
  index,
  showCategory,
  showAuditBadge,
  onNavigate
}: { 
  protocol: Protocol; 
  index: number;
  showCategory?: boolean;
  showAuditBadge?: boolean;
  onNavigate: (slug: string) => void;
}) {
  const slug = protocol.slug || protocol.name.toLowerCase().replace(/\s+/g, "-");
  
  return (
    <div
      className="rounded-lg border border-border bg-card p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-sm cursor-pointer active:scale-[0.99]"
      onClick={() => onNavigate(slug)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onNavigate(slug); }}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {protocol.logo ? (
            <img
              src={protocol.logo}
              alt={protocol.name}
              className="h-10 w-10 rounded-full bg-muted flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${protocol.name}&background=1a1a2e&color=2dd4bf&size=40`;
              }}
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0">
              {protocol.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs font-mono">#{index + 1}</span>
              <span className="font-medium text-foreground truncate">
                {protocol.name}
              </span>
              {showAuditBadge && protocol.audits && Number(protocol.audits) > 0 && (
                <ShieldCheck className="h-3.5 w-3.5 text-success flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2">
              {protocol.symbol && (
                <span className="text-xs text-muted-foreground">
                  ${protocol.symbol}
                </span>
              )}
              {showCategory && protocol.category && (
                <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                  {protocol.category}
                </span>
              )}
            </div>
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <WatchlistButton
            item={{
              id: slug,
              symbol: protocol.symbol || protocol.name.slice(0, 4).toUpperCase(),
              name: protocol.name,
              type: "protocol",
            }}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-x-3 gap-y-2">
        <div className="text-center">
          <span className="text-xs text-muted-foreground block">TVL</span>
          <span className="text-sm font-mono font-medium">
            {formatCurrency(protocol.tvl)}
          </span>
        </div>
        <div className="text-center">
          <span className="text-xs text-muted-foreground block">24h</span>
          <span className={cn(
            "text-sm font-mono inline-flex items-center justify-center gap-0.5",
            getChangeColor(protocol.change_1d)
          )}>
            {protocol.change_1d !== undefined && protocol.change_1d >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {formatPercentage(protocol.change_1d)}
          </span>
        </div>
        <div className="text-center">
          <span className="text-xs text-muted-foreground block">7d</span>
          <span className={cn(
            "text-sm font-mono inline-flex items-center justify-center gap-0.5",
            getChangeColor(protocol.change_7d)
          )}>
            {protocol.change_7d !== undefined && protocol.change_7d >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {formatPercentage(protocol.change_7d)}
          </span>
        </div>
      </div>
    </div>
  );
}

// Mobile loading skeleton
function MobileCardSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      {Array(count).fill(0).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-4 animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="skeleton h-10 w-10 rounded-full" />
            <div className="flex-1">
              <div className="skeleton h-4 w-28 mb-2" />
              <div className="skeleton h-3 w-16" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="skeleton h-8 w-full" />
            <div className="skeleton h-8 w-full" />
            <div className="skeleton h-8 w-full" />
          </div>
        </div>
      ))}
    </div>
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
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleNavigate = (slug: string) => {
    navigate(`/protocols/${slug}`);
  };

  // Mobile view
  if (isMobile) {
    if (loading) {
      return <MobileCardSkeleton count={5} />;
    }

    if (displayProtocols.length === 0) {
      return (
        <div className={cn("rounded-lg border border-border bg-card p-8 text-center", className)}>
          <p className="text-muted-foreground">No protocols found for XLayer</p>
          <p className="text-sm text-muted-foreground mt-2">
            Be the first to deploy on XLayer!
          </p>
        </div>
      );
    }

    return (
      <div className={cn("space-y-3", className)}>
        {displayProtocols.map((protocol, index) => (
          <ProtocolMobileCard 
            key={protocol.id || protocol.name} 
            protocol={protocol} 
            index={index}
            showCategory={showCategory}
            showAuditBadge={showAuditBadge}
            onNavigate={handleNavigate}
          />
        ))}
      </div>
    );
  }

  // Desktop view - Original table
  if (loading) {
    return (
      <div className={cn("rounded-lg border border-border bg-card overflow-x-auto", className)}>
        <table className="data-table w-full min-w-[500px]">
          <thead>
            <tr className="bg-muted/30">
              <th className="w-12">#</th>
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
                  <td><div className="skeleton h-4 w-6" /></td>
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
        <p className="text-muted-foreground">No protocols found for XLayer</p>
        <p className="text-sm text-muted-foreground mt-2">
          Be the first to deploy on XLayer!
        </p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border border-border bg-card overflow-x-auto", className)}>
      <table className="data-table w-full min-w-[500px]">
        <thead>
          <tr className="bg-muted/30">
            <th className="w-10"></th>
            <th className="w-12">#</th>
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
            <tr key={protocol.id || protocol.name} className="group cursor-pointer" onClick={() => handleNavigate(slug)}>
              <td onClick={(e) => e.stopPropagation()}>
                <WatchlistButton
                  item={{
                    id: slug,
                    symbol: protocol.symbol || protocol.name.slice(0, 4).toUpperCase(),
                    name: protocol.name,
                    type: "protocol",
                  }}
                />
              </td>
              <td className="text-muted-foreground font-mono text-sm">
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
