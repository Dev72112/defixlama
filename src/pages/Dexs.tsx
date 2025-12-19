import { Layout } from "@/components/layout/Layout";
import { DexTable } from "@/components/dashboard/DexTable";
import { StatCard } from "@/components/dashboard/StatCard";
import { useXLayerDexVolumes } from "@/hooks/useDefiData";
import { formatCurrency } from "@/lib/api/defillama";
import { ArrowLeftRight, TrendingUp, Activity, Search, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Dexs() {
  const { data: dexes, isLoading } = useXLayerDexVolumes();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("volume24h");

  // Filter and sort DEXs
  const filteredDexes = useMemo(() => {
    if (!dexes) return [];
    
    let filtered = dexes.filter((d) => {
      return (d.displayName || d.name).toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "volume24h":
          return (b.total24h || 0) - (a.total24h || 0);
        case "volume7d":
          return (b.total7d || 0) - (a.total7d || 0);
        case "change":
          return (b.change_1d || 0) - (a.change_1d || 0);
        case "name":
          return (a.displayName || a.name).localeCompare(b.displayName || b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [dexes, searchQuery, sortBy]);

  // Calculate metrics
  const total24hVolume = dexes?.reduce((acc, d) => acc + (d.total24h || 0), 0) || 0;
  const total7dVolume = dexes?.reduce((acc, d) => acc + (d.total7d || 0), 0) || 0;
  const dexCount = dexes?.length || 0;
  const avgChange = dexes && dexes.length > 0
    ? dexes.reduce((acc, d) => acc + (d.change_1d || 0), 0) / dexes.length
    : 0;

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">DEX Volume</h1>
          <p className="text-muted-foreground mt-1">
            Decentralized exchange trading volume on XLayer
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="24h Volume"
            value={formatCurrency(total24hVolume)}
            icon={ArrowLeftRight}
            loading={isLoading}
          />
          <StatCard
            title="7d Volume"
            value={formatCurrency(total7dVolume)}
            icon={BarChart3}
            loading={isLoading}
          />
          <StatCard
            title="Active DEXs"
            value={dexCount.toString()}
            icon={Activity}
            loading={isLoading}
          />
          <StatCard
            title="Avg. 24h Change"
            value={`${avgChange >= 0 ? "+" : ""}${avgChange.toFixed(2)}%`}
            change={avgChange}
            icon={TrendingUp}
            loading={isLoading}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search DEXs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="volume24h">24h Volume</SelectItem>
              <SelectItem value="volume7d">7d Volume</SelectItem>
              <SelectItem value="change">24h Change</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* DEX Table */}
        <DexTable dexes={filteredDexes} loading={isLoading} />

        {/* Results count */}
        {!isLoading && (
          <p className="text-sm text-muted-foreground">
            Showing {filteredDexes.length} DEXs
          </p>
        )}
      </div>
    </Layout>
  );
}
