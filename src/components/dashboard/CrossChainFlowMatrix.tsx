import { useMemo } from "react";
import { formatCurrency } from "@/lib/api/defillama";
import { cn } from "@/lib/utils";

interface Protocol {
  name: string;
  tvl?: number;
  chainTvls?: Record<string, number>;
  change_1d?: number | null;
  category?: string;
}

interface Props {
  protocols: Protocol[];
  loading?: boolean;
}

export function CrossChainFlowMatrix({ protocols, loading }: Props) {
  const matrixData = useMemo(() => {
    // Find protocols with multi-chain TVL data
    const multiChain = protocols
      .filter((p) => p.chainTvls && Object.keys(p.chainTvls).length > 1 && p.tvl && p.tvl > 1_000_000)
      .sort((a, b) => (b.tvl || 0) - (a.tvl || 0))
      .slice(0, 10);

    if (!multiChain.length) return { protocols: [], chains: [] };

    // Collect all chains
    const chainSet = new Set<string>();
    for (const p of multiChain) {
      if (p.chainTvls) {
        for (const chain of Object.keys(p.chainTvls)) {
          // Skip aggregate keys like "borrowed", "staking", etc.
          if (!chain.includes("-") && !["borrowed", "staking", "pool2", "vesting"].includes(chain.toLowerCase())) {
            chainSet.add(chain);
          }
        }
      }
    }

    // Take top 6 chains by total TVL across these protocols
    const chainTotals = Array.from(chainSet).map((chain) => ({
      chain,
      total: multiChain.reduce((acc, p) => acc + (p.chainTvls?.[chain] || 0), 0),
    }));
    const topChains = chainTotals.sort((a, b) => b.total - a.total).slice(0, 6).map((c) => c.chain);

    return { protocols: multiChain, chains: topChains };
  }, [protocols]);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-base font-semibold text-foreground mb-1">Cross-Chain Capital Distribution</h3>
      <p className="text-xs text-muted-foreground mb-3">Multi-chain protocol TVL breakdown by chain</p>
      {loading ? (
        <div className="skeleton h-[280px] w-full rounded-lg" />
      ) : matrixData.protocols.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 text-sm">No multi-chain protocol data available</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-left font-medium py-1.5 pr-2 min-w-[100px]">Protocol</th>
                {matrixData.chains.map((chain) => (
                  <th key={chain} className="text-right font-medium py-1.5 px-1.5 min-w-[70px]">{chain}</th>
                ))}
                <th className="text-right font-medium py-1.5 pl-2 min-w-[80px]">Total</th>
              </tr>
            </thead>
            <tbody>
              {matrixData.protocols.map((p) => {
                const total = matrixData.chains.reduce((acc, c) => acc + (p.chainTvls?.[c] || 0), 0);
                return (
                  <tr key={p.name} className="border-t border-border/30">
                    <td className="py-1.5 pr-2 font-medium text-foreground truncate max-w-[120px]">{p.name}</td>
                    {matrixData.chains.map((chain) => {
                      const val = p.chainTvls?.[chain] || 0;
                      const share = total > 0 ? (val / total) * 100 : 0;
                      return (
                        <td key={chain} className="py-1.5 px-1.5 text-right">
                          {val > 0 ? (
                            <div className="flex flex-col items-end">
                              <span className="font-mono text-foreground">{formatCurrency(val)}</span>
                              <span className="text-[9px] text-muted-foreground">{share.toFixed(0)}%</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/50">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-1.5 pl-2 text-right font-mono font-medium text-foreground">{formatCurrency(p.tvl)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
