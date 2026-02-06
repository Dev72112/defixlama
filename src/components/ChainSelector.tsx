import { memo } from "react";
import { ChevronDown, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChain } from "@/contexts/ChainContext";
import { Chain, ALL_CHAINS, SUPPORTED_CHAINS } from "@/lib/chains";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface ChainSelectorProps {
  className?: string;
  compact?: boolean;
}

export const ChainSelector = memo(function ChainSelector({ 
  className, 
  compact = false 
}: ChainSelectorProps) {
  const { selectedChain, setSelectedChain } = useChain();

  const renderChainItem = (chain: Chain, isSelected: boolean) => (
    <DropdownMenuItem
      key={chain.id}
      onClick={() => setSelectedChain(chain)}
      className={cn(
        "flex items-center gap-2 cursor-pointer",
        isSelected && "bg-primary/10 text-primary"
      )}
    >
      <span className="text-base">{chain.icon}</span>
      <span className="flex-1">{chain.name}</span>
      {chain.isFeatured && (
        <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-[hsl(348_83%_47%/0.15)] text-[hsl(348_83%_60%)] border border-[hsl(348_83%_47%/0.3)]">
          <Star className="h-2.5 w-2.5" />
          Featured
        </span>
      )}
      {isSelected && (
        <span className="h-2 w-2 rounded-full bg-primary" />
      )}
    </DropdownMenuItem>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={compact ? "sm" : "default"}
          className={cn(
            "flex items-center gap-2 bg-card hover:bg-muted/50 border-border",
            "transition-all duration-200",
            "[data-theme='matrix'] &:hover { box-shadow: 0 0 10px hsl(var(--primary) / 0.2); }",
            className
          )}
        >
          <span className="text-base">{selectedChain.icon}</span>
          {!compact && (
            <span className="hidden sm:inline text-sm font-medium">
              {selectedChain.name}
            </span>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-[200px] max-h-[400px] overflow-y-auto"
      >
        {/* All Chains option */}
        {renderChainItem(ALL_CHAINS, selectedChain.id === ALL_CHAINS.id)}
        
        <DropdownMenuSeparator />
        
        {/* Featured chain first */}
        {SUPPORTED_CHAINS.filter(c => c.isFeatured).map(chain => 
          renderChainItem(chain, selectedChain.id === chain.id)
        )}
        
        <DropdownMenuSeparator />
        
        {/* Other chains */}
        {SUPPORTED_CHAINS.filter(c => !c.isFeatured).map(chain => 
          renderChainItem(chain, selectedChain.id === chain.id)
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
