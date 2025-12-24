import { useState } from "react";
import { X, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Token {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  logo?: string;
}

interface PriceComparisonProps {
  tokens: Token[];
  isOpen: boolean;
  onClose: () => void;
}

export function PriceComparison({ tokens, isOpen, onClose }: PriceComparisonProps) {
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  
  if (!isOpen) return null;

  const addToken = (symbol: string) => {
    if (selectedTokens.length < 4 && !selectedTokens.includes(symbol)) {
      setSelectedTokens([...selectedTokens, symbol]);
    }
  };

  const removeToken = (symbol: string) => {
    setSelectedTokens(selectedTokens.filter((s) => s !== symbol));
  };

  const comparisonTokens = tokens.filter((t) => selectedTokens.includes(t.symbol));
  const availableTokens = tokens.filter((t) => !selectedTokens.includes(t.symbol));

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Price Comparison</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Token selector */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-muted-foreground">Compare:</span>
            {selectedTokens.map((symbol) => {
              const token = tokens.find((t) => t.symbol === symbol);
              return (
                <div 
                  key={symbol} 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm"
                >
                  {token?.logo && (
                    <img src={token.logo} alt={symbol} className="h-4 w-4 rounded-full" />
                  )}
                  {symbol}
                  <button onClick={() => removeToken(symbol)} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
            {selectedTokens.length < 4 && availableTokens.length > 0 && (
              <Select onValueChange={addToken}>
                <SelectTrigger className="w-[140px] h-8">
                  <Plus className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="Add token" />
                </SelectTrigger>
                <SelectContent>
                  {availableTokens.map((t) => (
                    <SelectItem key={t.symbol} value={t.symbol}>
                      <div className="flex items-center gap-2">
                        {t.logo && (
                          <img src={t.logo} alt={t.symbol} className="h-4 w-4 rounded-full" />
                        )}
                        {t.symbol}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Comparison grid */}
          {comparisonTokens.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {comparisonTokens.map((token) => (
                <div 
                  key={token.symbol}
                  className="rounded-lg border border-border bg-card p-4 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    {token.logo && (
                      <img src={token.logo} alt={token.symbol} className="h-8 w-8 rounded-full" />
                    )}
                    <div>
                      <p className="font-medium text-foreground">{token.symbol}</p>
                      <p className="text-xs text-muted-foreground truncate">{token.name}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xl font-bold">
                      ${token.price >= 1 
                        ? token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : token.price.toFixed(8).replace(/\.?0+$/, '')}
                    </p>
                    <p className={cn(
                      "flex items-center gap-1 text-sm",
                      token.change24h >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {token.change24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {token.change24h >= 0 ? "+" : ""}{token.change24h.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Select tokens to compare their prices</p>
            </div>
          )}

          {/* Quick comparison table */}
          {comparisonTokens.length >= 2 && (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="text-left p-3">Metric</th>
                    {comparisonTokens.map((t) => (
                      <th key={t.symbol} className="text-right p-3">{t.symbol}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="p-3 text-muted-foreground">Price</td>
                    {comparisonTokens.map((t) => (
                      <td key={t.symbol} className="p-3 text-right font-mono">
                        ${t.price >= 1 ? t.price.toFixed(2) : t.price.toFixed(6)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 text-muted-foreground">24h Change</td>
                    {comparisonTokens.map((t) => (
                      <td 
                        key={t.symbol} 
                        className={cn(
                          "p-3 text-right font-mono",
                          t.change24h >= 0 ? "text-success" : "text-destructive"
                        )}
                      >
                        {t.change24h >= 0 ? "+" : ""}{t.change24h.toFixed(2)}%
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
