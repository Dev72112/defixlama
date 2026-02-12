

# Fix Dashboard Charts, Mobile UX, and Build Whale Activity

## Issues Identified

### 1. All Chains TVL History Charts Show Blank
**Root cause**: In `useDefiData.ts` line 240, when `chainId === "all"`, `null` is passed to `useChainTVLHistory`, which sets `enabled: false` -- so no data is fetched at all. DefiLlama has a global TVL history endpoint (`/v2/historicalChainTvl` with no chain param) that returns aggregate data.

### 2. Dashboard Still Shows "X Layer" XLayerSpotlight in All Chains Mode
The `<XLayerSpotlight />` component renders unconditionally on line 214. It should only show when X Layer is selected or when "All Chains" is selected (where it serves as a featured spotlight), but the double-title issue ("X Layer DeFi Overview" with XLayer spotlight below) creates visual confusion.

### 3. Dashboard Title Still Doubles
Line 196: `{selectedChain.name} {t("dashboard.title")}` -- if `dashboard.title` was updated to "DeFi Overview" this should now show "All Chains DeFi Overview" which is correct. But checking the i18n key may still contain "XLayer".

---

## Implementation Plan

### Fix 1: Global TVL History for "All Chains" Mode

**File: `src/lib/api/defillama.ts`**
- Add a new function `fetchGlobalTVLHistory()` that calls `https://api.llama.fi/v2/historicalChainTvl` (no chain path) and returns the aggregate global TVL over time.

**File: `src/hooks/useDefiData.ts`**
- In `useDashboardData()` line 240: Instead of passing `null` when `chainId === "all"`, call a new `useGlobalTVLHistory()` hook that fetches from the global endpoint.
- Add `useGlobalTVLHistory()` hook that calls `fetchGlobalTVLHistory()`.
- Modify line 240 logic:
  - If `chainId === "all"` -> use `useGlobalTVLHistory()`
  - Otherwise -> use `useChainTVLHistory(getChainSlug(chainId))`

### Fix 2: Conditional XLayerSpotlight

**File: `src/pages/Dashboard.tsx`**
- Line 214: Wrap `<XLayerSpotlight />` with a condition: only show when `selectedChain.id === "xlayer"` (similar to the CTA on line 444).

### Fix 3: Remaining Mobile Overflow Audit

Tables look good now with `hidden sm:table-cell` patterns. The main remaining issue is the `data-table` CSS class -- verify it doesn't have `min-width` set. Also ensure the `table-layout` allows cells to shrink on mobile.

**File: `src/index.css`**
- Check `.data-table` CSS -- ensure `table-layout: auto` and no min-width constraints.
- Add `overflow-x: auto` wrapper styling for safety.

### Fix 4: Build Whale Activity Page with Real Data

Replace the placeholder with a functional page using DefiLlama data to simulate whale-level analytics:

**File: `src/pages/WhaleActivity.tsx`** -- Complete rebuild with:

1. **Top Protocols by TVL Concentration** -- Use protocol data to show which protocols hold the most TVL (proxy for "whale-sized" capital). Show top 10 protocols with their TVL share of total ecosystem TVL as a horizontal bar chart.

2. **TVL Flow Analysis** -- Use protocol `change_1d` and `change_7d` to identify large TVL movements (inflows/outflows). Show protocols with the biggest absolute TVL changes as a "flow analysis" table -- positive = accumulation, negative = distribution.

3. **Chain Capital Distribution** -- Use chains TVL data to show capital concentration across chains (Herfindahl index or top-N share). Pie/donut chart showing how concentrated capital is.

4. **Protocol Category Breakdown** -- Group protocols by category and show TVL per category -- reveals where institutional capital clusters (lending, DEX, derivatives, etc.)

5. **Large TVL Movement Feed** -- A real-time-styled feed showing protocols with >5% TVL change in the last 24h, sorted by absolute change amount. This serves as a "whale alert" proxy.

**Data sources (all from existing DefiLlama hooks)**:
- `useChainProtocols(chainId)` -- protocol TVL + changes
- `useChainsTVL()` -- chain-level capital distribution
- `useChainDexVolumes(chainId)` -- DEX volume concentration

**New components needed:**
- `src/components/dashboard/TVLFlowTable.tsx` -- Table showing top TVL movers (inflows/outflows)
- `src/components/dashboard/CapitalConcentrationChart.tsx` -- Donut chart of TVL distribution by chain or protocol

### Fix 5: Build Market Structure Page with Real Data

**File: `src/pages/MarketStructure.tsx`** -- Complete rebuild with:

1. **Liquidity Depth Overview** -- Use DEX volume data to show volume concentration across DEXs. Bar chart of top DEXs by volume share.

2. **DEX vs Lending TVL Split** -- Use protocol categories to separate DEX protocols from lending protocols. Show the ratio as a stacked bar or comparison.

3. **Volume-to-TVL Ratio** -- Calculate and display the volume/TVL ratio per chain -- a key market structure metric. Higher ratio = more active trading relative to locked capital.

4. **Protocol Diversity Score** -- Using category distribution data, calculate a diversity index (how spread out capital is across protocol types). Display as a score card.

5. **Fee Revenue Distribution** -- Use fees data to show which protocols capture the most fees -- a proxy for protocol "stickiness" and real usage.

**Data sources (all existing)**:
- `useChainProtocols(chainId)` -- for category breakdown
- `useChainDexVolumes(chainId)` -- for DEX concentration
- `useChainFees(chainId)` -- for fee revenue analysis
- `useChainsTVL()` -- for cross-chain comparison

---

## File Changes Summary

| File | Change | Priority |
|------|--------|----------|
| `src/lib/api/defillama.ts` | Add `fetchGlobalTVLHistory()` function | Critical |
| `src/hooks/useDefiData.ts` | Add `useGlobalTVLHistory()`, fix `useDashboardData` for "all" | Critical |
| `src/pages/Dashboard.tsx` | Conditional XLayerSpotlight | High |
| `src/pages/WhaleActivity.tsx` | Full rebuild with real protocol data | High |
| `src/pages/MarketStructure.tsx` | Full rebuild with real DEX/fee data | High |
| `src/components/dashboard/TVLFlowTable.tsx` | New -- TVL movers table | High |
| `src/components/dashboard/CapitalConcentrationChart.tsx` | New -- donut chart for capital distribution | High |

### New files to create:
- `src/components/dashboard/TVLFlowTable.tsx`
- `src/components/dashboard/CapitalConcentrationChart.tsx`

### Files to modify:
- `src/lib/api/defillama.ts`
- `src/hooks/useDefiData.ts`
- `src/pages/Dashboard.tsx`
- `src/pages/WhaleActivity.tsx`
- `src/pages/MarketStructure.tsx`

