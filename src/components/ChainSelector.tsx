import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Star, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUPPORTED_CHAINS, ALL_CHAINS_ID, isXLayerChain, ChainConfig } from "@/lib/chains";

interface ChainOption {
  index: string;
  name: string;
  logo?: string;
  featured?: boolean;
  type?: 'L1' | 'L2' | 'sidechain';
}

// Map from SUPPORTED_CHAINS for backwards compatibility
export const POPULAR_CHAINS: ChainOption[] = SUPPORTED_CHAINS.map(c => ({
  index: c.index,
  name: c.name,
  featured: c.featured,
  type: c.type,
}));

interface ChainSelectorProps {
  value: string;
  onChange: (chainIndex: string) => void;
  className?: string;
  showAllChains?: boolean;
  highlightFeatured?: boolean;
  compact?: boolean;
}

export function ChainSelector({ 
  value, 
  onChange, 
  className,
  showAllChains = false,
  highlightFeatured = true,
  compact = false,
}: ChainSelectorProps) {
  const selectedChain = POPULAR_CHAINS.find(c => c.index === value);
  const isFeaturedSelected = isXLayerChain(value);

  // Group chains by type
  const l1Chains = POPULAR_CHAINS.filter(c => c.type === 'L1');
  const l2Chains = POPULAR_CHAINS.filter(c => c.type === 'L2');

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger 
        className={cn(
          "transition-all",
          isFeaturedSelected && highlightFeatured && "border-primary/50 ring-1 ring-primary/20",
          className
        )}
      >
        <SelectValue placeholder="Select chain">
          {selectedChain && (
            <div className="flex items-center gap-2">
              {selectedChain.featured && highlightFeatured && (
                <Star className="h-3 w-3 text-primary fill-primary" />
              )}
              <span>{compact ? selectedChain.name.split(' ')[0] : selectedChain.name}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {/* All Chains option */}
        {showAllChains && (
          <>
            <SelectItem value={ALL_CHAINS_ID}>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span>All Chains</span>
              </div>
            </SelectItem>
            <div className="h-px bg-border my-1" />
          </>
        )}
        
        {/* Featured Chain (X Layer) first */}
        {POPULAR_CHAINS.filter(c => c.featured).map((chain) => (
          <SelectItem key={chain.index} value={chain.index}>
            <div className="flex items-center gap-2">
              <Star className="h-3.5 w-3.5 text-primary fill-primary" />
              <span className="font-medium">{chain.name}</span>
              <Badge variant="secondary" className="text-[9px] px-1 py-0 ml-1">
                Featured
              </Badge>
            </div>
          </SelectItem>
        ))}
        
        <div className="h-px bg-border my-1" />
        
        {/* Layer 2 chains */}
        <div className="px-2 py-1 text-xs text-muted-foreground font-medium">Layer 2</div>
        {l2Chains.filter(c => !c.featured).map((chain) => (
          <SelectItem key={chain.index} value={chain.index}>
            <div className="flex items-center gap-2">
              <span>{chain.name}</span>
            </div>
          </SelectItem>
        ))}
        
        <div className="h-px bg-border my-1" />
        
        {/* Layer 1 chains */}
        <div className="px-2 py-1 text-xs text-muted-foreground font-medium">Layer 1</div>
        {l1Chains.map((chain) => (
          <SelectItem key={chain.index} value={chain.index}>
            <div className="flex items-center gap-2">
              <span>{chain.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { SUPPORTED_CHAINS };
export type { ChainConfig };
export default ChainSelector;
