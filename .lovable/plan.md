

# Fix Remaining Mobile Table Overflow — DexTable, ProtocolTable, YieldTable, YieldIntelligence

## Problem
Screenshots show 4 remaining tables with horizontal overflow/cutoff at 375px:
1. **Protocols** (`ProtocolTable.tsx`) — "24H" column partially cut off
2. **Dexs** (`DexTable.tsx`) — "24H CHANGE" header truncated  
3. **Yields** (`YieldTable.tsx`) — APY/TVL values cut off at right edge
4. **Yield Intelligence** (`YieldIntelligence.tsx`) — TVL values in risk table cut off

## Root Cause
These 3 dashboard table components and 1 page table still use raw `<table>` without `table-fixed` layout. Even with `hidden sm:table-cell` on some columns, the remaining visible columns (name with logo + 2 data columns) exceed 375px due to flexible column widths and `font-mono` values.

## Solution
Convert all 4 to use `ResponsiveDataTable` — renders as stacked cards on mobile (<768px), standard table on desktop. This matches the pattern already used on 5 other pages.

### DexTable.tsx → ResponsiveDataTable
- **Mobile card (always):** Name (with logo + chains), 24h Volume
- **Expanded:** 7d Volume, 24h Change
- **Desktop columns:** Watchlist, #, Name, 24h Volume, 7d Volume, 24h Change

### ProtocolTable.tsx → ResponsiveDataTable  
- **Mobile card (always):** Name (with logo + symbol), TVL, 24h Change
- **Expanded:** Category, 7d Change, Audit badge
- **Desktop columns:** Watchlist, #, Name, Category, Audit, TVL, Sparkline, 24h, 7d

### YieldTable.tsx → ResponsiveDataTable
- **Mobile card (always):** Pool (symbol + meta), APY
- **Expanded:** Project, TVL
- **Desktop columns:** #, Pool, Project, TVL, APY

### YieldIntelligence.tsx risk table → ResponsiveDataTable
- **Mobile card (always):** Pool, APY
- **Expanded:** Project, Chain, TVL, Risk Score
- **Desktop columns:** #, Pool, Project, Chain, APY, TVL, Risk Score

## Files Modified (4)
| File | Change |
|------|--------|
| `src/components/dashboard/DexTable.tsx` | Rewrite with ResponsiveDataTable |
| `src/components/dashboard/ProtocolTable.tsx` | Rewrite with ResponsiveDataTable |
| `src/components/dashboard/YieldTable.tsx` | Rewrite with ResponsiveDataTable |
| `src/pages/YieldIntelligence.tsx` | Replace risk table with ResponsiveDataTable |

