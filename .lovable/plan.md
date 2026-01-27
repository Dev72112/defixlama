
# CountUp Animations & Multi-Chain Expansion Plan

## Overview

This plan implements two key enhancements:
1. **CountUp animations** on dashboard stat cards for smooth number transitions
2. **Multi-chain expansion** across the platform while keeping X Layer as the highlighted/featured chain

---

## Part 1: CountUp Animations for Stat Cards

### 1.1 Enhanced CountUp Component
**File: `src/components/ui/AnimatedCard.tsx`**

Improve the existing `CountUp` component to:
- Accept formatted string values (currency, percentages)
- Support live value updates (re-animate on data change)
- Add optional easing options (ease-out, spring, linear)
- Parse and animate formatted numbers (e.g., "$1.2B" → animate the number, keep prefix/suffix)

### 1.2 New AnimatedNumber Wrapper
**File: `src/components/ui/AnimatedNumber.tsx`**

Create a dedicated component for animated number display:
- Parse currency strings like "$1,234.56B"
- Animate the numeric portion
- Preserve formatting (commas, decimals, units)
- Support price flash effects (green/red on change direction)

### 1.3 StatCard Integration
**File: `src/components/dashboard/StatCard.tsx`**

Update StatCard to use animated numbers:
- Parse the `value` prop to extract numeric portion
- Use AnimatedNumber for the main value display
- Animate on initial load and when value changes
- Add optional `animate` prop to disable if needed

### 1.4 Dashboard Implementation
**File: `src/pages/Dashboard.tsx`**

Pass raw numeric values to StatCard instead of pre-formatted strings:
- Pass `rawValue` prop for animation
- Let StatCard handle formatting internally
- Ensure all stat cards animate on data refresh

---

## Part 2: Multi-Chain Expansion

### 2.1 Chain Configuration System
**New File: `src/lib/chains.ts`**

Create a centralized chain configuration:
```typescript
export const SUPPORTED_CHAINS = [
  { id: 'xlayer', name: 'X Layer', index: '196', featured: true, logo: '...' },
  { id: 'ethereum', name: 'Ethereum', index: '1', featured: false, logo: '...' },
  { id: 'arbitrum', name: 'Arbitrum', index: '42161', featured: false, logo: '...' },
  // ... more chains
];

export const DEFAULT_CHAIN = 'xlayer';
export const FEATURED_CHAIN = 'xlayer';
```

### 2.2 Global Chain Selector Context
**New File: `src/contexts/ChainContext.tsx`**

Create a React context for global chain selection:
- Store selected chain in localStorage for persistence
- Provide `useChainContext` hook for components
- Include helper functions: `isXLayer()`, `getFeaturedChain()`
- Support multi-chain mode vs single-chain mode

### 2.3 Enhanced ChainSelector Component
**File: `src/components/ChainSelector.tsx`**

Upgrade the existing chain selector:
- Add chain logos/icons
- Show "Featured" badge on X Layer
- Add "All Chains" option for aggregate views
- Group chains by category (L1, L2, etc.)
- Persist selection in localStorage

### 2.4 Multi-Chain Token Data Hook
**File: `src/hooks/useTokenData.ts`**

Expand token fetching to support multiple chains:
- Accept `chainId` parameter
- Fetch tokens from DefiLlama for any supported chain
- Merge with chain-specific community tokens
- Add chain identifier to token objects

### 2.5 Multi-Chain Dashboard
**File: `src/pages/Dashboard.tsx`**

Add multi-chain support to dashboard:
- Add chain selector in header area
- Show aggregate stats when "All Chains" selected
- Highlight X Layer data when viewing other chains (e.g., "X Layer: $X TVL")
- Keep TopGainersLosers configurable per chain

### 2.6 Multi-Chain Token Ranking
**File: `src/pages/TokenRanking.tsx`**

Already has chain selector - enhance it:
- Show X Layer badge/highlight in the selector
- Add quick filter chips for popular chains
- Remember last selected chain

### 2.7 Multi-Chain Tokens Page
**File: `src/pages/Tokens.tsx`**

Add chain filtering:
- Chain selector in page header
- Filter tokens by chain
- Show chain badge on each token row
- Keep X Layer tokens highlighted with special styling

### 2.8 Community Tokens Per Chain
**File: `src/lib/api/coingecko.ts`**

Expand community tokens to support multiple chains:
```typescript
export const COMMUNITY_TOKENS = {
  xlayer: [ /* existing X Layer tokens */ ],
  ethereum: [ /* popular ETH tokens */ ],
  arbitrum: [ /* popular ARB tokens */ ],
  // ...
};
```

### 2.9 Chain-Aware Explorer Links
**File: `src/pages/TokenDetail.tsx`** and related

Update explorer links to be chain-aware:
- X Layer → okx.com/explorer/xlayer
- Ethereum → etherscan.io
- Arbitrum → arbiscan.io
- etc.

---

## Part 3: X Layer Highlighting

### 3.1 Visual Distinction for X Layer
Throughout the site, X Layer elements get special treatment:
- **ChainSelector**: X Layer has crimson accent/star icon
- **Token cards**: X Layer tokens have subtle crimson border
- **Dashboard widgets**: "X Layer Spotlight" section remains prominent
- **Chain stats**: X Layer row highlighted in chain comparison tables

### 3.2 X Layer Spotlight Widget
**New File: `src/components/dashboard/XLayerSpotlight.tsx`**

Dedicated widget for X Layer highlights:
- Quick stats: TVL, protocols, DEXs, top token
- "View X Layer" quick link
- Always visible regardless of selected chain

### 3.3 "Featured on X Layer" Badge
Add a reusable badge component for X Layer entities:
- Protocols native to X Layer
- Tokens with X Layer contracts
- DEXs with X Layer support

---

## Files to Create

| File Path | Purpose |
|-----------|---------|
| `src/lib/chains.ts` | Centralized chain configuration |
| `src/contexts/ChainContext.tsx` | Global chain selection context |
| `src/components/ui/AnimatedNumber.tsx` | Animated number display component |
| `src/components/dashboard/XLayerSpotlight.tsx` | X Layer highlight widget |

## Files to Modify

| File Path | Changes |
|-----------|---------|
| `src/components/ui/AnimatedCard.tsx` | Enhance CountUp with value parsing |
| `src/components/dashboard/StatCard.tsx` | Integrate AnimatedNumber |
| `src/components/ChainSelector.tsx` | Add logos, featured badge, grouping |
| `src/hooks/useTokenData.ts` | Multi-chain token fetching |
| `src/hooks/useDefiData.ts` | Parameterize chain in data hooks |
| `src/pages/Dashboard.tsx` | Add chain context, animated stats |
| `src/pages/Tokens.tsx` | Chain filter, multi-chain display |
| `src/pages/TokenRanking.tsx` | X Layer highlight in selector |
| `src/lib/api/coingecko.ts` | Multi-chain community tokens |
| `src/App.tsx` | Wrap app in ChainContext provider |

---

## Technical Implementation Details

### CountUp Animation Logic
```typescript
// Parse formatted currency: "$1.23B" → { prefix: "$", value: 1.23, suffix: "B" }
function parseFormattedNumber(str: string) {
  const match = str.match(/^([^0-9.-]*)(-?[\d,]+\.?\d*)(.*)$/);
  return {
    prefix: match?.[1] || '',
    value: parseFloat(match?.[2]?.replace(/,/g, '') || '0'),
    suffix: match?.[3] || '',
  };
}
```

### Chain Context Usage
```typescript
const { selectedChain, setSelectedChain, isXLayer } = useChainContext();

// In components:
<ChainSelector 
  value={selectedChain} 
  onChange={setSelectedChain}
  highlightChain="xlayer"
/>
```

### Data Hook Chain Parameter
```typescript
// Before:
export function useXLayerProtocols() { ... }

// After:
export function useProtocols(chainId?: string) {
  const { selectedChain } = useChainContext();
  const chain = chainId || selectedChain;
  // Fetch for specific chain or aggregate
}
```

---

## Expected Outcomes

1. **Animated Numbers**: All dashboard stat values animate smoothly on load and data updates
2. **Multi-Chain Support**: Users can explore tokens, protocols, and stats across 10+ chains
3. **X Layer Focus**: X Layer remains prominently featured with visual distinction
4. **Consistent UX**: Chain selection persists across pages and sessions
5. **Performance**: Lazy loading of chain-specific data to avoid over-fetching
