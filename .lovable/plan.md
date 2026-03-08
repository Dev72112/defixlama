

# Recovery Round 5.5 — Complete Mobile Table Pass + Batch 2/3 Plan

## Current State

After auditing every page and table component, here is the situation:

**Already using `ResponsiveDataTable` (mobile cards):** Governance, CommunitySentiment, Predictions, WatchlistExports, AlertConfig — these are good.

**Still using raw `<table>` with only `hidden sm:table-cell`:** 14 instances across pages and dashboard components. While columns are hidden on mobile, the remaining visible columns can still cause horizontal overflow at 375px due to:
- Long protocol/token names without proper truncation
- `min-w-[320px]` / `min-w-[400px]` / `min-w-[500px]` forcing minimum widths wider than 375px viewport
- Font-mono formatted currency values like `$1,234,567,890` not wrapping
- Missing `max-w` constraints on name columns

## Batch 1: Mobile Table Fix (this implementation)

### Strategy
Two approaches depending on component type:

**Full pages → Convert to `ResponsiveDataTable`** (card layout on mobile):
1. **Tokens.tsx** — replace raw table; show name+price+change as cards
2. **Fees.tsx** — replace raw table; show name+24h fees+change as cards
3. **Chains.tsx** — replace raw table; show chain+TVL as cards
4. **Stablecoins.tsx** — already card-based on all screens (grid of cards), no table to fix
5. **Security.tsx** — already card-based (grid of ProtocolSecurityCards), no table to fix
6. **Portfolio.tsx** — replace raw holdings table; show token+value+PnL as cards

**Dashboard embedded components → Add mobile column hiding + truncation fixes:**
7. **DexTable.tsx** — already has `hidden sm:table-cell` on most columns; add `max-w-[140px]` truncate on name
8. **ProtocolTable.tsx** — already has hiding; add `max-w-[140px]` truncate on name
9. **YieldTable.tsx** — already has hiding; add truncate on pool symbol
10. **TVLFlowTable.tsx** — already has `hidden sm:table-cell`; verify name truncation

**PRO page tables → Fix remaining raw tables:**
11. **RiskDashboard.tsx** — convert risk table + hack list to `ResponsiveDataTable`
12. **MarketStructure.tsx** — fee efficiency table + chains table: add proper mobile hiding, remove `min-w` constraints
13. **YieldIntelligence.tsx** — risk-adjusted table: already has hiding, verify at 375px

**Matrix/Heatmap components — keep `overflow-x-auto` (inherently wide):**
14. **AccumulationHeatmap.tsx** — matrix layout, keep scrollable
15. **CrossChainFlowMatrix.tsx** — matrix layout, keep scrollable

### Key fixes across all pages
- Remove all `min-w-[...]` on `<table>` elements (forces overflow)
- Add `table-fixed` or proper column width constraints
- Ensure name/protocol columns have `max-w-[120px] sm:max-w-none truncate`
- Ensure all font-mono currency values have `whitespace-nowrap` + parent column is hidden on mobile if it's not essential

### Files to modify (Batch 1)
| File | Change |
|------|--------|
| `Tokens.tsx` | Convert table to `ResponsiveDataTable` |
| `Fees.tsx` | Convert table to `ResponsiveDataTable` |
| `Chains.tsx` | Convert table to `ResponsiveDataTable`, remove `min-w` |
| `Portfolio.tsx` | Convert holdings table to `ResponsiveDataTable` |
| `DexTable.tsx` | Add name truncation, verify mobile column hiding |
| `ProtocolTable.tsx` | Add name truncation, verify mobile |
| `YieldTable.tsx` | Add symbol truncation |
| `RiskDashboard.tsx` | Convert risk table to `ResponsiveDataTable` |
| `MarketStructure.tsx` | Remove `min-w`, fix fee table mobile hiding |
| `YieldIntelligence.tsx` | Verify risk-adjusted table, remove any min-w |

**10 files modified**

---

## Batch 2: PRO Pages 3-Tab Overhaul

Rewrite 6 PRO pages with Radix `Tabs`, 3 tabs each, lazy-loaded content:

| Page | Tab 1 | Tab 2 | Tab 3 |
|------|-------|-------|-------|
| AlertConfig | Active Alerts (progress bars showing % to trigger) | Alert History (triggered log with filters) | Smart Suggestions (AI-based alert ideas) |
| Predictions | Price Predictions (bull/base/bear cards) | TVL Predictions (inflow/outflow forecast) | Accuracy Tracker (historical %) |
| ProtocolComparison | Compare (winner highlighting per metric) | Historical (date range comparison) | Export (CSV/PDF format selector) |
| Governance | Active Proposals (countdown + vote bars) | Voting History (Won/Lost badges) | Power Analysis (distribution chart + decentralization score) |
| CommunitySentiment | Current Sentiment (Fear & Greed gauge) | Trend Analysis (sentiment vs price overlay) | Source Breakdown (Twitter/Reddit/GitHub %) |
| WatchlistExports | Quick Export (data type + format picker) | Scheduled (automation UI) | History (past exports list) |

**6 files rewritten**

---

## Batch 3: Free Page Tabs + Bottom Nav Polish

### Free Page Tabs
URL-synced tabs (`?tab=xxx`) via `useSearchParams`:

| Page | Tab 1 | Tab 2 | Tab 3 |
|------|-------|-------|-------|
| Tokens | Overview (existing table) | Top Movers (sorted by abs 24h change) | New Listings |
| Protocols | All Protocols (existing) | By Category (filter chips) | Trending (7d change) |
| Yields | All Pools (existing) | Highest APY (sorted desc) | Most Stable (stablecoin pools) |
| Stablecoins | Overview (existing cards) | Peg Health (deviation coloring) | Flows (chain breakdown) |

Sticky tab bar, horizontal scroll on mobile, lazy content loading.

### Bottom Nav Polish
- Auto-hide on scroll down, show on scroll up
- `padding-bottom: env(safe-area-inset-bottom)` for iOS
- Content area `pb-20` on mobile
- PRO lock icon on Portfolio for unauthenticated users

**6 files modified** (4 free pages + BottomNav + Layout)

---

## Total Scope

| Batch | Files | Description |
|-------|-------|-------------|
| 1 | 10 modified | Mobile table card conversion + truncation fixes |
| 2 | 6 rewritten | PRO page 3-tab overhaul |
| 3 | 6 modified | Free page tabs + bottom nav polish |
| **Total** | **22 files** | |

