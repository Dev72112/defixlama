import { DexVolume, formatCurrency, formatPercentage, getChangeColor } from "@/lib/api/defillama";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, ArrowLeftRight } from "lucide-react";
import { WatchlistButton } from "@/components/WatchlistButton";
import { useIsMobile } from "@/hooks/use-mobile";

interface DexTableProps {
  dexes: DexVolume[];
  loading?: boolean;
  limit?: number;
  className?: string;
}

// Mobile card component for DEX
function DexMobileCard({ 
  dex, 
  index, 
  onNavigate 
}: { 
  dex: DexVolume; 
  index: number; 
  onNavigate: (slug: string) => void;
}) {
  const slug = (dex.displayName || dex.name).toLowerCase().replace(/\s+/g, '-');
  
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
          {dex.logo ? (
            <img
              src={dex.logo}
              alt={dex.displayName || dex.name}
              className="h-10 w-10 rounded-full bg-muted flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${dex.name}&background=1a1a2e&color=2dd4bf&size=40`;
              }}
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0">
              {(dex.displayName || dex.name).charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs font-mono">#{index + 1}</span>
              <span className="font-medium text-foreground truncate">
                {dex.displayName || dex.name}
              </span>
            </div>
            {dex.chains && dex.chains.length > 0 && (
              <p className="text-xs text-muted-foreground truncate">
                {dex.chains.slice(0, 2).join(", ")}
                {dex.chains.length > 2 && ` +${dex.chains.length - 2}`}
              </p>
            )}
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <WatchlistButton
            item={{
              id: slug,
              symbol: (dex.displayName || dex.name).slice(0, 4).toUpperCase(),
              name: dex.displayName || dex.name,
              type: "dex",
            }}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">24h Vol</span>
          <span className="text-sm font-mono font-medium">
            {dex.total24h && dex.total24h > 0 
              ? formatCurrency(dex.total24h) 
              : <span className="text-muted-foreground italic text-xs">N/A</span>
            }
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">24h Δ</span>
          <span className={cn(
            "text-sm font-mono inline-flex items-center gap-1",
            getChangeColor(dex.change_1d)
          )}>
            {dex.change_1d !== undefined && dex.change_1d >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {formatPercentage(dex.change_1d)}
          </span>
        </div>
        <div className="flex justify-between items-center col-span-2">
          <span className="text-xs text-muted-foreground">7d Vol</span>
          <span className="text-sm font-mono text-muted-foreground">
            {dex.total7d && dex.total7d > 0 
              ? formatCurrency(dex.total7d) 
              : <span className="italic text-xs">N/A</span>
            }
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
              <div className="skeleton h-4 w-24 mb-2" />
              <div className="skeleton h-3 w-16" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DexTable({
  dexes,
  loading = false,
  limit,
  className,
}: DexTableProps) {
  const displayDexes = limit ? dexes.slice(0, limit) : dexes;
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleNavigate = (slug: string) => {
    navigate(`/dexs/${slug}`);
  };

  // Mobile view
  if (isMobile) {
    if (loading) {
      return <MobileCardSkeleton count={5} />;
    }

    if (displayDexes.length === 0) {
      return (
        <div className={cn("rounded-lg border border-border bg-card p-8 text-center", className)}>
          <ArrowLeftRight className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No DEX data available for XLayer</p>
          <p className="text-sm text-muted-foreground mt-2">
            Launch a DEX on XLayer to see it here!
          </p>
        </div>
      );
    }

    return (
      <div className={cn("space-y-3", className)}>
        {displayDexes.map((dex, index) => (
          <DexMobileCard 
            key={dex.name} 
            dex={dex} 
            index={index} 
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
              <th className="w-10"></th>
              <th className="w-12">#</th>
              <th>Name</th>
              <th className="text-right">24h Volume</th>
              <th className="text-right">7d Volume</th>
              <th className="text-right">24h Change</th>
            </tr>
          </thead>
          <tbody>
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <tr key={i}>
                  <td><div className="skeleton h-4 w-6" /></td>
                  <td><div className="skeleton h-4 w-6" /></td>
                  <td><div className="skeleton h-4 w-32" /></td>
                  <td><div className="skeleton h-4 w-24 ml-auto" /></td>
                  <td><div className="skeleton h-4 w-24 ml-auto" /></td>
                  <td><div className="skeleton h-4 w-16 ml-auto" /></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (displayDexes.length === 0) {
    return (
      <div className={cn("rounded-lg border border-border bg-card p-8 text-center", className)}>
        <ArrowLeftRight className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No DEX data available for XLayer</p>
        <p className="text-sm text-muted-foreground mt-2">
          Launch a DEX on XLayer to see it here!
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
            <th className="text-right">24h Volume</th>
            <th className="text-right hidden lg:table-cell">7d Volume</th>
            <th className="text-right">24h Change</th>
          </tr>
        </thead>
        <tbody>
          {displayDexes.map((dex, index) => {
            const slug = (dex.displayName || dex.name).toLowerCase().replace(/\s+/g, '-');
            return (
              <tr
                key={dex.name}
                className="group cursor-pointer"
                onClick={() => handleNavigate(slug)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') handleNavigate(slug); }}
              >
                <td onClick={(e) => e.stopPropagation()}>
                  <WatchlistButton
                    item={{
                      id: slug,
                      symbol: (dex.displayName || dex.name).slice(0, 4).toUpperCase(),
                      name: dex.displayName || dex.name,
                      type: "dex",
                    }}
                  />
                </td>
                <td className="text-muted-foreground font-mono text-sm">
                  {index + 1}
                </td>
                <td>
                  <div className="flex items-center gap-3">
                    {dex.logo ? (
                      <img
                        src={dex.logo}
                        alt={dex.displayName || dex.name}
                        className="h-8 w-8 rounded-full bg-muted flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${dex.name}&background=1a1a2e&color=2dd4bf&size=32`;
                        }}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                        {(dex.displayName || dex.name).charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="font-medium text-foreground truncate block">
                        {dex.displayName || dex.name}
                      </span>
                      {dex.chains && dex.chains.length > 0 && (
                        <p className="text-xs text-muted-foreground truncate">
                          {dex.chains.slice(0, 3).join(", ")}
                          {dex.chains.length > 3 && ` +${dex.chains.length - 3}`}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="text-right font-mono font-medium text-foreground whitespace-nowrap">
                  {dex.total24h && dex.total24h > 0 ? formatCurrency(dex.total24h) : <span className="text-muted-foreground italic">No data</span>}
                </td>
                <td className="text-right font-mono text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                  {dex.total7d && dex.total7d > 0 ? formatCurrency(dex.total7d) : <span className="text-muted-foreground italic">No data</span>}
                </td>
                <td className="text-right whitespace-nowrap">
                  <div
                    className={cn(
                      "inline-flex items-center gap-1 font-mono text-sm",
                      getChangeColor(dex.change_1d)
                    )}
                  >
                    {dex.change_1d !== undefined && dex.change_1d >= 0 ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5" />
                    )}
                    {formatPercentage(dex.change_1d)}
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
