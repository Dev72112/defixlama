import { Protocol, formatCurrency, formatPercentage, getChangeColor } from "@/lib/api/defillama";
import { cn } from "@/lib/utils";
import { ExternalLink, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";

interface ProtocolTableProps {
  protocols: Protocol[];
  loading?: boolean;
  showCategory?: boolean;
  limit?: number;
  className?: string;
}

export function ProtocolTable({
  protocols,
  loading = false,
  showCategory = true,
  limit,
  className,
}: ProtocolTableProps) {
  const displayProtocols = limit ? protocols.slice(0, limit) : protocols;

  if (loading) {
    return (
      <div className={cn("rounded-lg border border-border bg-card overflow-hidden", className)}>
        <table className="data-table">
          <thead>
            <tr className="bg-muted/30">
              <th className="w-12">#</th>
              <th>Name</th>
              {showCategory && <th>Category</th>}
              <th className="text-right">TVL</th>
              <th className="text-right">24h Change</th>
              <th className="text-right">7d Change</th>
            </tr>
          </thead>
          <tbody>
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <tr key={i}>
                  <td><div className="skeleton h-4 w-6" /></td>
                  <td><div className="skeleton h-4 w-32" /></td>
                  {showCategory && <td><div className="skeleton h-4 w-20" /></td>}
                  <td><div className="skeleton h-4 w-24 ml-auto" /></td>
                  <td><div className="skeleton h-4 w-16 ml-auto" /></td>
                  <td><div className="skeleton h-4 w-16 ml-auto" /></td>
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
    <div className={cn("rounded-lg border border-border bg-card overflow-hidden", className)}>
      <table className="data-table">
        <thead>
          <tr className="bg-muted/30">
            <th className="w-12">#</th>
            <th>Name</th>
            {showCategory && <th>Category</th>}
            <th className="text-right">TVL</th>
            <th className="text-right">24h Change</th>
            <th className="text-right">7d Change</th>
          </tr>
        </thead>
        <tbody>
          {displayProtocols.map((protocol, index) => {
            const slug = protocol.slug || protocol.name.toLowerCase().replace(/\s+/g, "-");
            return (
            <tr key={protocol.id || protocol.name} className="group cursor-pointer" onClick={() => window.location.href = `/protocols/${slug}`}>
              <td className="text-muted-foreground font-mono text-sm">
                {index + 1}
              </td>
              <td>
                <div className="flex items-center gap-3">
                  {protocol.logo ? (
                    <img
                      src={protocol.logo}
                      alt={protocol.name}
                      className="h-8 w-8 rounded-full bg-muted"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${protocol.name}&background=1a1a2e&color=2dd4bf&size=32`;
                      }}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                      {protocol.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {protocol.name}
                      </span>
                      {protocol.url && (
                        <a
                          href={protocol.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
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
                <td>
                  <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                    {protocol.category || "DeFi"}
                  </span>
                </td>
              )}
              <td className="text-right font-mono font-medium text-foreground">
                {formatCurrency(protocol.tvl)}
              </td>
              <td className="text-right">
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
              <td className="text-right">
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
