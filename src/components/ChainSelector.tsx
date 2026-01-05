import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OKX_CHAIN_INDEX } from "@/lib/api/okx";

interface ChainOption {
  index: string;
  name: string;
  logo?: string;
}

// Commonly used chains with display names
const POPULAR_CHAINS: ChainOption[] = [
  { index: '196', name: 'X Layer' },
  { index: '1', name: 'Ethereum' },
  { index: '56', name: 'BSC' },
  { index: '137', name: 'Polygon' },
  { index: '42161', name: 'Arbitrum' },
  { index: '10', name: 'Optimism' },
  { index: '8453', name: 'Base' },
  { index: '43114', name: 'Avalanche' },
  { index: '501', name: 'Solana' },
  { index: '324', name: 'zkSync' },
  { index: '59144', name: 'Linea' },
  { index: '534352', name: 'Scroll' },
  { index: '81457', name: 'Blast' },
  { index: '250', name: 'Fantom' },
];

interface ChainSelectorProps {
  value: string;
  onChange: (chainIndex: string) => void;
  className?: string;
}

export function ChainSelector({ value, onChange, className }: ChainSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select chain" />
      </SelectTrigger>
      <SelectContent>
        {POPULAR_CHAINS.map((chain) => (
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

export { POPULAR_CHAINS };
export default ChainSelector;
