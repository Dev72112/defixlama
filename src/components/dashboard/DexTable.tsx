import { DexVolume, formatCurrency, formatPercentage, getChangeColor } from "@/lib/api/defillama";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, ArrowLeftRight } from "lucide-react";
import { WatchlistButton } from "@/components/WatchlistButton";
import { ResponsiveDataTable, ResponsiveColumn } from "@/components/ui/responsive-table";

interface DexTableProps {
  dexes: DexVolume[];
  loading?: boolean;
  limit?: number;
  className?: string;
}

export function DexTable({
  dexes,
  loading = false,
  limit,
  className,
}: DexTableProps) {
  const displayDexes = limit ? dexes.slice(0, limit) : dexes;
  const navigate = useNavigate();

  const columns: ResponsiveColumn<DexVolume>[] = [
    {
      key: "watchlist",
      label: "",
      priority: "desktop",
      className: "w-10",
      render: (dex) => {
        const slug = (dex.displayName || dex.name).toLowerCase().replace(/\s+/g, '-');
        return (
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
        );
      },
    },
    {
      key: "rank",
      label: "#",
      priority: "desktop",
      className: "w-12",
      render: (_dex, index) => (
        <span className="text-muted-foreground font-mono text-sm">{index + 1}</span>
      ),
    },
    {
      key: "name",
      label: "Name",
      priority: "always",
      render: (dex) => (
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
            <span className="font-medium text-foreground truncate block max-w-[140px] sm:max-w-none">
              {dex.displayName || dex.name}
            </span>
            {dex.chains && dex.chains.length > 0 && (
              <p className="text-xs text-muted-foreground truncate max-w-[140px] sm:max-w-none">
                {dex.chains.slice(0, 3).join(", ")}
                {dex.chains.length > 3 && ` +${dex.chains.length - 3}`}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "total24h",
      label: "24h Volume",
      priority: "always",
      align: "right",
      render: (dex) => (
        <span className="font-mono font-medium text-foreground whitespace-nowrap">
          {dex.total24h && dex.total24h > 0 ? formatCurrency(dex.total24h) : <span className="text-muted-foreground italic">No data</span>}
        </span>
      ),
    },
    {
      key: "total7d",
      label: "7d Volume",
      priority: "expanded",
      align: "right",
      render: (dex) => (
        <span className="font-mono text-muted-foreground whitespace-nowrap">
          {dex.total7d && dex.total7d > 0 ? formatCurrency(dex.total7d) : <span className="italic">No data</span>}
        </span>
      ),
    },
    {
      key: "change_1d",
      label: "24h Change",
      priority: "expanded",
      align: "right",
      render: (dex) => (
        <div className={cn("inline-flex items-center gap-1 font-mono text-sm", getChangeColor(dex.change_1d))}>
          {dex.change_1d !== undefined && dex.change_1d >= 0 ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          {formatPercentage(dex.change_1d)}
        </div>
      ),
    },
  ];

  return (
    <ResponsiveDataTable
      columns={columns}
      data={displayDexes}
      keyField={(dex) => dex.name}
      onRowClick={(dex) => {
        const slug = (dex.displayName || dex.name).toLowerCase().replace(/\s+/g, '-');
        navigate(`/dexs/${slug}`);
      }}
      loading={loading}
      loadingRows={5}
      emptyMessage="No DEX data available"
      emptyIcon={<ArrowLeftRight className="h-12 w-12 text-muted-foreground" />}
      className={className}
    />
  );
}
