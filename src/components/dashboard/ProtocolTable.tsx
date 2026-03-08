import { Protocol, formatCurrency, formatPercentage, getChangeColor } from "@/lib/api/defillama";
import { cn } from "@/lib/utils";
import { ExternalLink, TrendingUp, TrendingDown, Shield, ShieldCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { WatchlistButton } from "@/components/WatchlistButton";
import { ResponsiveDataTable, ResponsiveColumn } from "@/components/ui/responsive-table";

interface ProtocolTableProps {
  protocols: Protocol[];
  loading?: boolean;
  showCategory?: boolean;
  showSparkline?: boolean;
  showAuditBadge?: boolean;
  limit?: number;
  className?: string;
}

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

  const columns: ResponsiveColumn<Protocol>[] = [
    {
      key: "watchlist",
      label: "",
      priority: "desktop",
      className: "w-10",
      render: (protocol) => {
        const slug = protocol.slug || protocol.name.toLowerCase().replace(/\s+/g, "-");
        return (
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
        );
      },
    },
    {
      key: "rank",
      label: "#",
      priority: "desktop",
      className: "w-12",
      render: (_p, index) => (
        <span className="text-muted-foreground font-mono text-sm">{index + 1}</span>
      ),
    },
    {
      key: "name",
      label: "Name",
      priority: "always",
      render: (protocol) => (
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
              <span className="text-xs text-muted-foreground">${protocol.symbol}</span>
            )}
          </div>
        </div>
      ),
    },
  ];

  if (showCategory) {
    columns.push({
      key: "category",
      label: "Category",
      priority: "expanded",
      render: (protocol) => (
        <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
          {protocol.category || "DeFi"}
        </span>
      ),
    });
  }

  if (showAuditBadge) {
    columns.push({
      key: "audit",
      label: "Audit",
      priority: "expanded",
      align: "center",
      render: (protocol) => (
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
      ),
    });
  }

  columns.push({
    key: "tvl",
    label: "TVL",
    priority: "always",
    align: "right",
    render: (protocol) => (
      <span className="font-mono font-medium text-foreground whitespace-nowrap">
        {formatCurrency(protocol.tvl)}
      </span>
    ),
  });

  if (showSparkline) {
    columns.push({
      key: "sparkline",
      label: "7d Trend",
      priority: "desktop",
      align: "right",
      render: (protocol) => (
        <div className="flex justify-end">
          <Sparkline
            data={[
              protocol.tvl * (1 - (protocol.change_7d || 0) / 100),
              protocol.tvl * (1 - (protocol.change_7d || 0) / 100 * 0.7),
              protocol.tvl * (1 - (protocol.change_7d || 0) / 100 * 0.5),
              protocol.tvl * (1 - (protocol.change_7d || 0) / 100 * 0.3),
              protocol.tvl * (1 - (protocol.change_7d || 0) / 100 * 0.1),
              protocol.tvl,
            ]}
            positive={(protocol.change_7d || 0) >= 0}
          />
        </div>
      ),
    });
  }

  columns.push(
    {
      key: "change_1d",
      label: "24h",
      priority: "always",
      align: "right",
      render: (protocol) => (
        <div className={cn("inline-flex items-center gap-1 font-mono text-sm whitespace-nowrap", getChangeColor(protocol.change_1d))}>
          {protocol.change_1d !== undefined && protocol.change_1d >= 0 ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          {formatPercentage(protocol.change_1d)}
        </div>
      ),
    },
    {
      key: "change_7d",
      label: "7d",
      priority: "expanded",
      align: "right",
      render: (protocol) => (
        <div className={cn("inline-flex items-center gap-1 font-mono text-sm whitespace-nowrap", getChangeColor(protocol.change_7d))}>
          {protocol.change_7d !== undefined && protocol.change_7d >= 0 ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          {formatPercentage(protocol.change_7d)}
        </div>
      ),
    }
  );

  return (
    <ResponsiveDataTable
      columns={columns}
      data={displayProtocols}
      keyField={(p) => p.id || p.name}
      onRowClick={(protocol) => {
        const slug = protocol.slug || protocol.name.toLowerCase().replace(/\s+/g, "-");
        window.location.href = `/protocols/${slug}`;
      }}
      loading={loading}
      loadingRows={5}
      emptyMessage="No protocols found"
      className={className}
    />
  );
}
