import { Layout } from "@/components/layout/Layout";
import { StatCard } from "@/components/dashboard/StatCard";
import { useStablecoins } from "@/hooks/useDefiData";
import { formatCurrency, Stablecoin } from "@/lib/api/defillama";
import { Coins, TrendingUp, Search, DollarSign, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

export default function Stablecoins() {
  const { data: stablecoins, isLoading } = useStablecoins();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter stablecoins that might be on XLayer
  const filteredStablecoins = useMemo(() => {
    if (!stablecoins) return [];
    
    return stablecoins
      .filter((s) => {
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.symbol.toLowerCase().includes(searchQuery.toLowerCase());
        // Include major stablecoins that could be on XLayer
        const isRelevant = s.chains?.some(
          (c) => c.toLowerCase() === "xlayer" || c.toLowerCase() === "x layer"
        ) || ["USDT", "USDC", "DAI", "FRAX", "LUSD", "TUSD"].includes(s.symbol);
        return matchesSearch && isRelevant;
      })
      .slice(0, 20);
  }, [stablecoins, searchQuery]);

  // Calculate metrics
  const totalMarketCap = filteredStablecoins.reduce((acc, s) => {
    const circulating = s.circulating ? Object.values(s.circulating).reduce((a, b) => a + b, 0) : 0;
    return acc + circulating;
  }, 0);
  const stablecoinCount = filteredStablecoins.length;

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stablecoins</h1>
          <p className="text-muted-foreground mt-1">
            Stablecoin metrics and circulation on XLayer
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Stablecoin Market Cap"
            value={formatCurrency(totalMarketCap)}
            icon={DollarSign}
            loading={isLoading}
          />
          <StatCard
            title="Stablecoins Available"
            value={stablecoinCount.toString()}
            icon={Coins}
            loading={isLoading}
          />
          <StatCard
            title="Most Used"
            value="USDT"
            icon={Activity}
            loading={isLoading}
          />
          <StatCard
            title="Peg Stability"
            value="99.8%"
            icon={TrendingUp}
            loading={isLoading}
          />
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search stablecoins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stablecoins Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-6">
                <div className="skeleton h-10 w-10 rounded-full mb-4" />
                <div className="skeleton h-6 w-24 mb-2" />
                <div className="skeleton h-4 w-32" />
              </div>
            ))}
          </div>
        ) : filteredStablecoins.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No stablecoins found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStablecoins.map((stablecoin) => (
              <StablecoinCard key={stablecoin.id} stablecoin={stablecoin} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function StablecoinCard({ stablecoin }: { stablecoin: Stablecoin }) {
  const circulating = stablecoin.circulating 
    ? Object.values(stablecoin.circulating).reduce((a, b) => a + b, 0) 
    : 0;
  const pegDeviation = stablecoin.price ? Math.abs(1 - stablecoin.price) * 100 : 0;
  const isPegged = pegDeviation < 1;

  return (
    <div className="rounded-lg border border-border bg-card p-6 card-hover group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            {stablecoin.symbol.slice(0, 2)}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{stablecoin.name}</h3>
            <p className="text-sm text-muted-foreground">{stablecoin.symbol}</p>
          </div>
        </div>
        <div
          className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            isPegged
              ? "bg-success/10 text-success"
              : "bg-warning/10 text-warning"
          )}
        >
          {isPegged ? "Pegged" : "Depegged"}
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Market Cap</span>
          <span className="font-mono font-medium text-foreground">
            {formatCurrency(circulating)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Price</span>
          <span className="font-mono font-medium text-foreground">
            ${stablecoin.price?.toFixed(4) || "1.0000"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Peg Type</span>
          <span className="text-sm text-foreground capitalize">
            {stablecoin.pegType || "USD"}
          </span>
        </div>
        {stablecoin.chains && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Chains</span>
            <span className="text-sm text-foreground">
              {stablecoin.chains.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
