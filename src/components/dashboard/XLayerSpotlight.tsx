import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedCurrency, AnimatedPercentage } from "@/components/ui/AnimatedNumber";
import { useXLayerTVL, useXLayerProtocols, useXLayerDexVolumes } from "@/hooks/useDefiData";
import { formatCurrency } from "@/lib/api/defillama";
import { 
  Star, 
  Layers, 
  ArrowRight, 
  TrendingUp, 
  Database, 
  ArrowLeftRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface XLayerSpotlightProps {
  className?: string;
  compact?: boolean;
}

export function XLayerSpotlight({ className, compact = false }: XLayerSpotlightProps) {
  const { t } = useTranslation();
  const tvl = useXLayerTVL();
  const protocols = useXLayerProtocols();
  const dexVolumes = useXLayerDexVolumes();

  const totalTVL = tvl?.data?.tvl ?? 0;
  const protocolCount = protocols?.data?.length ?? 0;
  const totalDexVolume = dexVolumes?.data?.reduce((acc, dex) => acc + (dex?.total24h ?? 0), 0) ?? 0;
  
  const isLoading = tvl?.isLoading || protocols?.isLoading || dexVolumes?.isLoading;

  // Top protocol by TVL
  const topProtocol = protocols?.data
    ?.slice()
    .sort((a, b) => (b.tvl || 0) - (a.tvl || 0))[0];

  if (compact) {
    return (
      <Card className={cn("relative overflow-hidden", className)}>
        {/* Gradient accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
        
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/20">
                <Star className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-foreground">X Layer</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    Featured
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {isLoading ? (
                    <Skeleton className="h-3 w-16 mt-0.5" />
                  ) : (
                    <AnimatedCurrency value={totalTVL} duration={600} />
                  )}
                  {' TVL'}
                </div>
              </div>
            </div>
            <Link to="/chains/xlayer">
              <Button variant="ghost" size="sm" className="gap-1 text-primary">
                View <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("relative overflow-hidden border-primary/30", className)}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent pointer-events-none" />
      
      {/* Animated corner accent */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/20 rounded-full blur-2xl animate-pulse" />
      
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/20 ring-2 ring-primary/30">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                X Layer Spotlight
                <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                  <Star className="h-2.5 w-2.5 mr-0.5" /> Featured
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Powered by OKX • Layer 2 Ecosystem
              </p>
            </div>
          </div>
          <Link to="/chains/xlayer">
            <Button variant="outline" size="sm" className="gap-1.5 border-primary/30 hover:bg-primary/10 hover:border-primary">
              Explore <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-background/50 border border-border/50">
            <Layers className="h-4 w-4 mx-auto text-primary mb-1" />
            <div className="text-lg font-bold text-foreground">
              {isLoading ? (
                <Skeleton className="h-6 w-16 mx-auto" />
              ) : (
                <AnimatedCurrency value={totalTVL} duration={600} />
              )}
            </div>
            <div className="text-xs text-muted-foreground">Total TVL</div>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-background/50 border border-border/50">
            <Database className="h-4 w-4 mx-auto text-primary mb-1" />
            <div className="text-lg font-bold text-foreground">
              {isLoading ? (
                <Skeleton className="h-6 w-10 mx-auto" />
              ) : (
                protocolCount
              )}
            </div>
            <div className="text-xs text-muted-foreground">Protocols</div>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-background/50 border border-border/50">
            <ArrowLeftRight className="h-4 w-4 mx-auto text-primary mb-1" />
            <div className="text-lg font-bold text-foreground">
              {isLoading ? (
                <Skeleton className="h-6 w-16 mx-auto" />
              ) : (
                <AnimatedCurrency value={totalDexVolume} duration={600} />
              )}
            </div>
            <div className="text-xs text-muted-foreground">24h Volume</div>
          </div>
        </div>

        {/* Top Protocol */}
        {topProtocol && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
            <div className="flex items-center gap-3">
              {topProtocol.logo ? (
                <img 
                  src={topProtocol.logo} 
                  alt={topProtocol.name}
                  className="h-8 w-8 rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  {topProtocol.name?.charAt(0)}
                </div>
              )}
              <div>
                <div className="font-medium text-foreground text-sm">{topProtocol.name}</div>
                <div className="text-xs text-muted-foreground">Top Protocol by TVL</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono font-medium text-foreground">
                {formatCurrency(topProtocol.tvl || 0)}
              </div>
              {topProtocol.change_1d !== undefined && (
                <div className={cn(
                  "text-xs font-mono",
                  topProtocol.change_1d >= 0 ? "text-success" : "text-destructive"
                )}>
                  {topProtocol.change_1d >= 0 ? '+' : ''}{topProtocol.change_1d.toFixed(2)}%
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="flex flex-wrap gap-2">
          <Link to="/protocols">
            <Badge variant="outline" className="cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-colors">
              All Protocols
            </Badge>
          </Link>
          <Link to="/dexs">
            <Badge variant="outline" className="cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-colors">
              DEXs
            </Badge>
          </Link>
          <Link to="/tokens">
            <Badge variant="outline" className="cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-colors">
              Tokens
            </Badge>
          </Link>
          <Link to="/yields">
            <Badge variant="outline" className="cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-colors">
              Yields
            </Badge>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact inline badge for X Layer items in lists
export function XLayerBadge({ className }: { className?: string }) {
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "text-[10px] px-1.5 py-0 border-primary/40 bg-primary/10 text-primary",
        className
      )}
    >
      <Star className="h-2 w-2 mr-0.5" />
      X Layer
    </Badge>
  );
}

export default XLayerSpotlight;
