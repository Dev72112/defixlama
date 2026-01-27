import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Search, X, Loader2, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTokenSearch, MultiChainToken } from "@/hooks/useMultiChainTokens";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { isXLayerChain, getChainExplorerUrlByIndex } from "@/lib/chains";

interface TokenSearchInputProps {
  chainIndex?: string;
  onSelect?: (token: MultiChainToken) => void;
  placeholder?: string;
  className?: string;
}

export function TokenSearchInput({ 
  chainIndex, 
  onSelect,
  placeholder,
  className,
}: TokenSearchInputProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { data: results, isLoading } = useTokenSearch(query, chainIndex, query.length >= 2);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (token: MultiChainToken) => {
    if (onSelect) {
      onSelect(token);
    } else {
      navigate(`/tokens/${token.contractAddress}`);
    }
    setQuery("");
    setIsOpen(false);
  };

  const isAddressQuery = /^0x[a-fA-F0-9]+$/i.test(query);

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={placeholder || t("tokens.searchByNameOrAddress", "Search by name or address...")}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(e.target.value.length >= 2);
          }}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-[400px] overflow-auto"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                {isAddressQuery ? "Looking up address..." : "Searching..."}
              </span>
            </div>
          ) : results && results.length > 0 ? (
            <ul className="py-1">
              {results.map((token) => {
                const isXLayer = isXLayerChain(token.chainIndex);
                const explorerUrl = getChainExplorerUrlByIndex(token.chainIndex, token.contractAddress);
                
                return (
                  <li 
                    key={token.id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors",
                      isXLayer && "bg-primary/5"
                    )}
                    onClick={() => handleSelect(token)}
                  >
                    {token.logo ? (
                      <img 
                        src={token.logo} 
                        alt={token.symbol}
                        className="h-8 w-8 rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                        {token.symbol.slice(0, 2)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground truncate">{token.name}</span>
                        <span className="text-xs text-muted-foreground">{token.symbol}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className={cn(
                          "text-[9px] px-1 py-0",
                          isXLayer && "border-primary/40 bg-primary/10 text-primary"
                        )}>
                          {token.chainName}
                        </Badge>
                        <span className="truncate font-mono text-[10px]">
                          {token.contractAddress.slice(0, 6)}...{token.contractAddress.slice(-4)}
                        </span>
                      </div>
                    </div>
                    {explorerUrl && (
                      <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : query.length >= 2 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p className="text-sm">No tokens found for "{query}"</p>
              {isAddressQuery && (
                <p className="text-xs mt-1">Try pasting the full contract address</p>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default TokenSearchInput;
