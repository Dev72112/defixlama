

# Recovery Round 5 — Complete Pass: Chain Fixes, Mobile Tables, PRO Tabs, Free Tabs, Bottom Nav

## Current State Assessment

**Chain selector**: Already integrated on 19/21 data pages. Missing pages (Portfolio, Donations, Admin, etc.) are user-specific — no chain filtering needed. The `isChainSwitching` + `chainSwitchKey` mechanism exists. The main remaining issue is that paginated pages without a `useEffect` reset on chain change can show empty pages.

**Mobile table overflow**: `ResponsiveDataTable` exists but is only used on 5 pages (Governance, CommunitySentiment, Predictions, WatchlistExports, AlertConfig). **16 table instances** across pages and dashboard components still use raw `<table>` with only `overflow-x-auto` — which still scrolls horizontally on 375px screens. These need either `ResponsiveDataTable` migration or `hidden sm:table-cell` + card fallback treatment.

**PRO pages**: All 6 exist but are single-view, no tab structure. Need the 3-tab overhaul from the plan.

**Free pages**: Tokens, Protocols, Yields, Stablecoins — no tab structure yet.

---

## Batch 1 (this implementation): Chain Polish + Mobile Table Fix

### 1A. Chain Pagination Reset

Add `useEffect(() => setPage(1), [selectedChain.id])` to these pages that have pagination but may be missing the reset:
- `Tokens.tsx` (uses `currentPage`)
- `Fees.tsx` (uses `currentPage`)
- `Chains.tsx` (uses `page`)
- `Security.tsx` (uses `currentPage`)
- `Stablecoins.tsx` (uses `currentPage`)
- `Dexs.tsx` (uses `currentPage`)
- `Yields.tsx` (uses `currentPage`)

### 1B. Mobile Table Card Conversion

Convert all remaining raw `<table>` pages to use `ResponsiveDataTable` or apply proper mobile column hiding. Priority targets:

**Full pages (convert to ResponsiveDataTable):**
1. `Tokens.tsx` — hide #, watchlist, volume, mcap on mobile; show name+price+change
2. `Fees.tsx` — hide #, 7d fees on mobile; show name+24h fees+change
3. `Chains.tsx` — hide #, market share on mobile; show name+TVL
4. `Stablecoins.tsx` — hide #, mcap, peg on mobile; show name+price+change
5. `Dexs.tsx` — hide #, change on mobile; show name+volume
6. `Yields.tsx` — hide chain, IL risk on mobile; show pool+TVL+APY
7. `Security.tsx` — hide chain, audits count on mobile; show name+score+status
8. `Portfolio.tsx` — hide quantity, price on mobile; show token+value+PnL
9. `Correlations.tsx` — correlation matrix stays overflow-x-auto (matrix inherently wide)
10. `MarketStructure.tsx` — fee table + lifecycle table: hide non-essential cols
11. `RiskDashboard.tsx` — hack table: hide chain on mobile
12. `YieldIntelligence.tsx` — hide chain, IL on mobile

**Dashboard components (add hidden columns):**
13. `ProtocolTable.tsx` — hide category, 7d change
14. `DexTable.tsx` — hide change column
15. `YieldTable.tsx` — hide chain, project columns on mobile
16. `TVLFlowTable.tsx` — already has `hidden sm:table-cell`, verify
17. `AccumulationHeatmap.tsx` — keep overflow-x-auto (heatmap needs width)
18. `CrossChainFlowMatrix.tsx` — keep overflow-x-auto (matrix needs width)

For full pages: migrate to `ResponsiveDataTable` with column priority config.
For dashboard components: add `hidden sm:table-cell` to non-essential columns (lighter touch since these are embedded widgets).

### Files for Batch 1
| Action | File |
|--------|------|
| Modify | `src/pages/Tokens.tsx` — ResponsiveDataTable + pagination reset |
| Modify | `src/pages/Fees.tsx` — ResponsiveDataTable + pagination reset |
| Modify | `src/pages/Chains.tsx` — ResponsiveDataTable + pagination reset |
| Modify | `src/pages/Stablecoins.tsx` — ResponsiveDataTable + pagination reset |
| Modify | `src/pages/Dexs.tsx` — ResponsiveDataTable + pagination reset |
| Modify | `src/pages/Yields.tsx` — ResponsiveDataTable + pagination reset |
| Modify | `src/pages/Security.tsx` — ResponsiveDataTable + pagination reset |
| Modify | `src/pages/Portfolio.tsx` — ResponsiveDataTable for holdings |
| Modify | `src/pages/MarketStructure.tsx` — hidden cols on fee/lifecycle tables |
| Modify | `src/pages/RiskDashboard.tsx` — hidden cols on hack table |
| Modify | `src/pages/YieldIntelligence.tsx` — hidden cols |
| Modify | `src/components/dashboard/ProtocolTable.tsx` — hidden cols mobile |
| Modify | `src/components/dashboard/DexTable.tsx` — hidden cols mobile |
| Modify | `src/components/dashboard/YieldTable.tsx` — hidden cols mobile |

**14 files modified, 0 new files**

---

## Batch 2: PRO Pages 3-Tab Overhaul

Rewrite all 6 PRO pages with Radix `Tabs` component, 3 tabs each:

| Page | Tab 1 | Tab 2 | Tab 3 |
|------|-------|-------|-------|
| AlertConfig | Active Alerts (existing + progress bars) | Alert History (triggered log) | Smart Suggestions (AI-based) |
| Predictions | Price Predictions (bull/base/bear) | TVL Predictions (inflow/outflow) | Accuracy Tracker (historical %) |
| ProtocolComparison | Compare (existing + winner highlight) | Historical (date range slider) | Export (CSV/PDF selector) |
| Governance | Active Proposals (deadline countdown) | Voting History (Won/Lost badges) | Power Analysis (distribution chart) |
| CommunitySentiment | Current Sentiment (Fear & Greed gauge) | Trend Analysis (sentiment vs price) | Source Breakdown (%) |
| WatchlistExports | Quick Export (format + columns picker) | Scheduled (automation UI) | History (past exports) |

Each tab lazy-loads content. Mobile: tabs scroll horizontally. All tabs use existing data hooks + simulated/derived analytics where real APIs don't exist.

**6 files rewritten**

---

## Batch 3: Free Page Tabs + Bottom Nav Polish

### Free Page Tabs
Add URL-synced tabs (`?tab=xxx`) using `useSearchParams`:

| Page | Tab 1 | Tab 2 | Tab 3 |
|------|-------|-------|-------|
| Tokens | Overview (existing table) | Top Movers (sorted by abs 24h change) | New Listings (community tokens) |
| Protocols | All Protocols (existing) | By Category (filter chips) | Trending (7d change sort) |
| Yields | All Pools (existing) | Highest APY (sorted desc) | Most Stable (stablecoin pools) |
| Stablecoins | Overview (existing) | Peg Health (deviation coloring) | Flows (chain breakdown) |

Sticky tab bar, horizontal scroll on mobile, lazy tab content.

### Bottom Nav Polish
- Auto-hide on scroll down, show on scroll up (use `useRef` + scroll listener)
- `padding-bottom: env(safe-area-inset-bottom)` for iOS
- Content area gets `pb-20` on mobile to avoid overlap
- PRO lock icon on Portfolio tab for unauthenticated users

**6 files modified** (4 free pages + BottomNav + Layout)

---

## Total Scope

| Batch | Files | Description |
|-------|-------|-------------|
| 1 | 14 modified | Chain pagination reset + mobile table cards |
| 2 | 6 rewritten | PRO page 3-tab overhaul |
| 3 | 6 modified | Free page tabs + bottom nav polish |
| **Total** | **26 files** | |

Recommend implementing Batch 1 first, verify on mobile, then Batch 2, then Batch 3.

