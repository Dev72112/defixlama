import { useState, useEffect, useMemo, useRef } from "react";
import { 
  Search, 
  X, 
  TrendingUp, 
  Layers, 
  ArrowLeftRight, 
  Globe, 
  Moon, 
  Sun, 
  RefreshCw, 
  Download,
  Home,
  BarChart3,
  Wallet,
  Shield,
  Bell,
  FileText,
  Heart,
  Coins,
  Activity,
  Command
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useXLayerProtocols, useXLayerDexVolumes, useChainsTVL } from "@/hooks/useDefiData";
import { useTokenPrices } from "@/hooks/useTokenData";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useTokenSearch, MultiChainToken } from "@/hooks/useMultiChainTokens";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchResult {
  id: string;
  name: string;
  symbol?: string;
  type: "token" | "protocol" | "dex" | "chain" | "page" | "action";
  url?: string;
  action?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  shortcut?: string;
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Quick navigation pages
const pages: SearchResult[] = [
  { id: "home", name: "Dashboard", type: "page", url: "/", icon: Home, shortcut: "D" },
  { id: "protocols", name: "Protocols", type: "page", url: "/protocols", icon: Layers },
  { id: "dexs", name: "DEXs", type: "page", url: "/dexs", icon: ArrowLeftRight },
  { id: "tokens", name: "Tokens", type: "page", url: "/tokens", icon: Wallet },
  { id: "ranking", name: "Token Ranking", type: "page", url: "/token-ranking", icon: BarChart3 },
  { id: "stablecoins", name: "Stablecoins", type: "page", url: "/stablecoins", icon: Coins },
  { id: "chains", name: "Chains", type: "page", url: "/chains", icon: Globe },
  { id: "fees", name: "Fees", type: "page", url: "/fees", icon: Activity },
  { id: "yields", name: "Yields", type: "page", url: "/yields", icon: TrendingUp },
  { id: "security", name: "Security", type: "page", url: "/security", icon: Shield },
  { id: "portfolio", name: "Portfolio", type: "page", url: "/portfolio", icon: Wallet },
  { id: "alerts", name: "Alerts", type: "page", url: "/alerts", icon: Bell },
  { id: "docs", name: "Documentation", type: "page", url: "/docs", icon: FileText },
  { id: "donations", name: "Donations", type: "page", url: "/donations", icon: Heart },
];

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Debounce search query for API calls
  const debouncedQuery = useDebounce(query, 300);

  const { data: protocols } = useXLayerProtocols();
  const { data: dexes } = useXLayerDexVolumes();
  const { data: chains } = useChainsTVL();
  const { data: tokens } = useTokenPrices();
  
  // Use multi-chain token search for better results
  const { data: searchedTokens, isLoading: isSearchingTokens } = useTokenSearch(
    debouncedQuery,
    undefined, // Search all chains
    debouncedQuery.length >= 2
  );

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("recent-searches");
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      } catch { }
    }
  }, []);

  // Quick actions
  const actions: SearchResult[] = useMemo(() => [
    {
      id: "toggle-theme",
      name: "Toggle Theme",
      type: "action" as const,
      icon: document.documentElement.getAttribute("data-theme") === "dark" ? Sun : Moon,
      action: () => {
        const current = document.documentElement.getAttribute("data-theme");
        document.documentElement.setAttribute("data-theme", current === "dark" ? "bright" : "dark");
      },
      shortcut: "T",
    },
    {
      id: "refresh",
      name: "Refresh Data",
      type: "action" as const,
      icon: RefreshCw,
      action: () => queryClient.invalidateQueries(),
      shortcut: "R",
    },
    {
      id: "export",
      name: "Export Data",
      type: "action" as const,
      icon: Download,
      action: () => {
        // Trigger export dialog or action
        navigate("/");
      },
    },
  ], [queryClient, navigate]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.toLowerCase().trim();
    
    // If no query, show pages and actions
    if (!q) {
      return [
        ...pages.slice(0, 6),
        ...actions,
      ];
    }

    const matches: SearchResult[] = [];

    // Search pages first
    pages.forEach((page) => {
      if (page.name.toLowerCase().includes(q)) {
        matches.push(page);
      }
    });

    // Search actions
    actions.forEach((action) => {
      if (action.name.toLowerCase().includes(q)) {
        matches.push(action);
      }
    });

    // Search tokens - prefer multi-chain search results
    if (searchedTokens && searchedTokens.length > 0) {
      searchedTokens.slice(0, 8).forEach((t: MultiChainToken) => {
        matches.push({
          id: t.contractAddress,
          name: t.name,
          symbol: t.symbol,
          type: "token",
          url: `/tokens/${t.contractAddress}?chain=${t.chainIndex}`,
        });
      });
    } else {
      // Fallback to old token data
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
    }

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

    return matches.slice(0, 12);
  }, [query, tokens, searchedTokens, protocols, dexes, chains, actions]);

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

  const executeResult = (result: SearchResult) => {
    // Save to recent searches
    if (query && !recentSearches.includes(query)) {
      const updated = [query, ...recentSearches].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem("recent-searches", JSON.stringify(updated));
    }

    if (result.action) {
      result.action();
    } else if (result.url) {
      navigate(result.url);
    }
    onOpenChange(false);
  };

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
          executeResult(results[selectedIndex]);
        }
        break;
      case "Escape":
        onOpenChange(false);
        break;
    }
  };

  const getIcon = (result: SearchResult) => {
    if (result.icon) return result.icon;
    switch (result.type) {
      case "token":
        return TrendingUp;
      case "protocol":
        return Layers;
      case "dex":
        return ArrowLeftRight;
      case "chain":
        return Globe;
      case "page":
        return FileText;
      case "action":
        return Command;
    }
  };

  const getTypeColor = (type: SearchResult["type"]) => {
    switch (type) {
      case "token":
        return "text-amber-500 bg-amber-500/10";
      case "protocol":
        return "text-primary bg-primary/10";
      case "dex":
        return "text-blue-500 bg-blue-500/10";
      case "chain":
        return "text-green-500 bg-green-500/10";
      case "page":
        return "text-purple-500 bg-purple-500/10";
      case "action":
        return "text-orange-500 bg-orange-500/10";
    }
  };

  const getTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "page":
        return "Go to";
      case "action":
        return "Run";
      default:
        return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center border-b border-border px-3 bg-card">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search or type a command..."
            className="border-0 focus-visible:ring-0 text-base bg-transparent"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
              onClick={() => setQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <div className="px-2 py-2 border-b border-border">
              <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Recent
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {recentSearches.map((search) => (
                  <button
                    key={search}
                    onClick={() => setQuery(search)}
                    className="px-2 py-1 text-xs rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Grouped Results */}
          {results.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground animate-fade-in">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No results found for "{query}"</p>
            </div>
          ) : (
            <div className="py-2">
              {/* Group by type */}
              {["page", "action", "token", "protocol", "dex", "chain"].map((type) => {
                const typeResults = results.filter((r) => r.type === type);
                if (typeResults.length === 0) return null;

                return (
                  <div key={type} className="mb-2">
                    <p className="px-4 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {type === "page" ? "Pages" : type === "action" ? "Actions" : `${type}s`}
                    </p>
                    {typeResults.map((result) => {
                      const index = results.indexOf(result);
                      const Icon = getIcon(result);
                      return (
                        <button
                          key={`${result.type}-${result.id}`}
                          onClick={() => executeResult(result)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-all duration-200",
                            index === selectedIndex && "bg-muted/50 border-l-2 border-l-primary"
                          )}
                        >
                          <div className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0",
                            getTypeColor(result.type),
                            index === selectedIndex && "scale-110"
                          )}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {result.symbol ? `${result.symbol} - ${result.name}` : result.name}
                            </p>
                          </div>
                          {result.shortcut && (
                            <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 text-[10px] text-muted-foreground">
                              {result.shortcut}
                            </kbd>
                          )}
                          <span className={cn(
                            "text-xs capitalize px-2 py-0.5 rounded-full shrink-0",
                            getTypeColor(result.type)
                          )}>
                            {getTypeLabel(result.type)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2.5 flex items-center justify-between text-xs text-muted-foreground bg-muted/30">
          <div className="flex items-center gap-4">
            <span><kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px]">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px]">↵</kbd> Select</span>
            <span><kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px]">Esc</kbd> Close</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-muted-foreground/60">
            <Command className="h-3 w-3" />
            <span>Command Palette</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
