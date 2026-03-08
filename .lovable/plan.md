

# Full Platform Mobile Overflow Fix — Proper Root Cause Resolution

## Root Cause Analysis

After reading every page and component, I found **three distinct problems** causing persistent overflow at 375px:

### Problem 1: `useIsMobile()` initializes as `false`
The hook in `src/hooks/use-mobile.tsx` starts with `useState<boolean | undefined>(undefined)` and returns `!!isMobile` which is `false` on first render. This means **every `ResponsiveDataTable` renders the desktop table first** (causing overflow), then switches to cards after the effect fires. On real mobile devices the desktop table flashes briefly — enough to cause layout shift and visible overflow.

### Problem 2: 7 pages still use raw `<table>` — never converted
These were missed in previous rounds:
- **Tokens.tsx** — raw `<table>` (lines 203-367)
- **Fees.tsx** — raw `<table>` (lines 228-301)
- **RiskDashboard.tsx** — risk score table (lines 189-237)
- **Correlations.tsx** — sector rotation table (lines 194-218)
- **MarketStructure.tsx** — fee efficiency table (lines 281-300)
- **MarketStructure.tsx** — chains by TVL table (lines 364-381)
- **TVLFlowTable.tsx** — uses shadcn `<Table>` with `overflow-x-auto`

### Problem 3: Fixed-width filter controls overflow
Multiple pages have rows of `Select` components with `w-[180px]` (3 × 180 = 540px > 375px). The `flex-col sm:flex-row` pattern is already used on some but not all filter rows. Some also have `max-w-md` inputs that eat up space.

---

## Fix Plan (22 files)

### Fix 1: `useIsMobile` SSR-safe initial value (1 file)
**File:** `src/hooks/use-mobile.tsx`

Initialize state with `typeof window !== 'undefined' ? window.innerWidth < 768 : false` instead of `undefined`. This ensures the first render on mobile immediately returns `true` — no flash of desktop table.

### Fix 2: Convert remaining raw tables to ResponsiveDataTable (6 files)

| File | Table | Mobile card shows | Expanded shows |
|------|-------|-------------------|----------------|
| `Tokens.tsx` | Token list | Name+logo, Price, 24h Change | Volume, Market Cap, Watchlist |
| `Fees.tsx` | Fee list | Name+logo, 24h Fees, Change | 7d Fees, Category |
| `RiskDashboard.tsx` | Risk scores | Name+logo, Risk Level, Risk Score | TVL, Audited, 24h Change |
| `Correlations.tsx` | Sector rotation | Category, 1d Avg Change | Protocols count, TVL, 1h, 7d |
| `MarketStructure.tsx` | Fee efficiency + Chains | Name, primary metric | Secondary metrics |
| `TVLFlowTable.tsx` | TVL flows | Name, 24h Change | Category, TVL, Flow amount |

### Fix 3: Fix filter/control overflow on all pages (15 files)

Apply these patterns consistently:
- All `Select` triggers: change from `w-[180px]` to `w-full sm:w-[180px]`
- All filter rows: ensure `flex-col sm:flex-row` wrapping
- Pagination: add `flex-wrap` to `PaginationContent`, hide page numbers on mobile (show only prev/next)
- Page size selectors: hide on mobile or stack below

Pages needing filter fixes:
- `Tokens.tsx` — button row wraps
- `Fees.tsx` — 3 selects + search overflow
- `Yields.tsx` — 2 selects + search at `w-[180px]`
- `Protocols.tsx` — 2 selects + page size + export button
- `Dexs.tsx` — select + page size + export
- `Chains.tsx` — filter controls
- `Correlations.tsx` — pagination
- `MarketStructure.tsx` — search + pagination
- `RiskDashboard.tsx` — pagination
- `WhaleActivity.tsx` — severity filter + search + category select
- `YieldIntelligence.tsx` — pagination
- `Dashboard.tsx` — verify lazy tables render correctly
- `Portfolio.tsx` — verify holdings table
- `Security.tsx` — verify cards
- `Stablecoins.tsx` — verify cards

---

## File Summary

| # | File | Changes |
|---|------|---------|
| 1 | `src/hooks/use-mobile.tsx` | Fix initial state to use `window.innerWidth` |
| 2 | `src/pages/Tokens.tsx` | Convert to ResponsiveDataTable + fix filter widths |
| 3 | `src/pages/Fees.tsx` | Convert to ResponsiveDataTable + fix filter widths |
| 4 | `src/pages/Yields.tsx` | Fix Select `w-[180px]` → `w-full sm:w-[180px]` + pagination wrap |
| 5 | `src/pages/Protocols.tsx` | Fix filter row widths + pagination |
| 6 | `src/pages/Dexs.tsx` | Fix filter row widths + pagination |
| 7 | `src/pages/Chains.tsx` | Fix filter widths |
| 8 | `src/pages/RiskDashboard.tsx` | Convert risk table to ResponsiveDataTable |
| 9 | `src/pages/Correlations.tsx` | Convert sector table to ResponsiveDataTable + fix pagination |
| 10 | `src/pages/MarketStructure.tsx` | Convert fee+chain tables to ResponsiveDataTable |
| 11 | `src/pages/WhaleActivity.tsx` | Fix filter row wrapping |
| 12 | `src/pages/YieldIntelligence.tsx` | Fix pagination wrapping |
| 13 | `src/components/dashboard/TVLFlowTable.tsx` | Convert to ResponsiveDataTable |
| **Total** | **13 files** | |

This is the definitive pass — fixes the root cause (useIsMobile), converts every remaining raw table, and fixes every filter/pagination control that can overflow.

