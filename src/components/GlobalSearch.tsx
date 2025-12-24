import { useState, useEffect, useMemo, useRef } from "react";
import { Search, X, TrendingUp, Layers, ArrowLeftRight, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useXLayerProtocols, useXLayerDexVolumes, useChainsTVL } from "@/hooks/useDefiData";
import { useTokenPrices } from "@/hooks/useTokenData";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  name: string;
  symbol?: string;
  type: "token" | "protocol" | "dex" | "chain";
  url: string;
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { data: protocols } = useXLayerProtocols();
  const { data: dexes } = useXLayerDexVolumes();
  const { data: chains } = useChainsTVL();
  const { data: tokens } = useTokenPrices();

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const matches: SearchResult[] = [];

    // Search tokens
    tokens?.slice(0, 5).forEach((t) => {
      if (
        t.symbol.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q)
      ) {
        const tokenId = t.contract || t.symbol.toLowerCase();
        matches.push({
          id: tokenId,
          name: t.name,
          symbol: t.symbol,
          type: "token",
          url: `/tokens/${tokenId}`,
        });
      }
    });

    // Search protocols
    protocols?.slice(0, 100).forEach((p) => {
      if (
        p.name.toLowerCase().includes(q) ||
        p.symbol?.toLowerCase().includes(q)
      ) {
        const slug = (p.slug || p.name).toLowerCase().replace(/\s+/g, "-");
        matches.push({
          id: slug,
          name: p.name,
          symbol: p.symbol,
          type: "protocol",
          url: `/protocols/${slug}`,
        });
      }
    });

    // Search DEXs
    dexes?.forEach((d) => {
      const name = d.displayName || d.name;
      if (name.toLowerCase().includes(q)) {
        const slug = name.toLowerCase().replace(/\s+/g, "-");
        matches.push({
          id: slug,
          name,
          type: "dex",
          url: `/dexs/${slug}`,
        });
      }
    });

    // Search chains
    chains?.slice(0, 50).forEach((c) => {
      if (c.name.toLowerCase().includes(q)) {
        const slug = c.name.toLowerCase().replace(/\s+/g, "-");
        matches.push({
          id: slug,
          name: c.name,
          type: "chain",
          url: `/chains/${slug}`,
        });
      }
    });

    return matches.slice(0, 10);
  }, [query, tokens, protocols, dexes, chains]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        if (results[selectedIndex]) {
          navigate(results[selectedIndex].url);
          onOpenChange(false);
        }
        break;
      case "Escape":
        onOpenChange(false);
        break;
    }
  };

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "token":
        return TrendingUp;
      case "protocol":
        return Layers;
      case "dex":
        return ArrowLeftRight;
      case "chain":
        return Globe;
    }
  };

  const getTypeColor = (type: SearchResult["type"]) => {
    switch (type) {
      case "token":
        return "text-amber-500";
      case "protocol":
        return "text-primary";
      case "dex":
        return "text-blue-500";
      case "chain":
        return "text-green-500";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0">
        <div className="flex items-center border-b border-border px-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tokens, protocols, DEXs, chains..."
            className="border-0 focus-visible:ring-0 text-base"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {query && results.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No results found for "{query}"</p>
            </div>
          ) : (
            <div className="py-2">
              {results.map((result, index) => {
                const Icon = getIcon(result.type);
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => {
                      navigate(result.url);
                      onOpenChange(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors",
                      index === selectedIndex && "bg-muted/50"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", getTypeColor(result.type))} />
                    <div className="flex-1 text-left">
                      <p className="font-medium text-foreground">
                        {result.symbol ? `${result.symbol} - ${result.name}` : result.name}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground capitalize px-2 py-1 rounded bg-muted">
                      {result.type}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-border px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span><kbd className="px-1.5 py-0.5 bg-muted rounded">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 bg-muted rounded">↵</kbd> Select</span>
            <span><kbd className="px-1.5 py-0.5 bg-muted rounded">Esc</kbd> Close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
