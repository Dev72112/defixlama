

# Recovery Round 4: Pagination, Mobile Fixes, Detail Pages, Tests, and PRO Refinements

## Current State (verified via browser + code audit)

**Working well**: Dashboard renders cleanly on mobile (390px). Tokens page mobile cards look good. All 14 PRO pages exist. Chain selector works on 17/22 pages. Pagination exists on 10 pages. 31 tests passing across 3 files.

---

## 1. Pagination on Remaining Pages (8 pages)

These pages render all data without pagination, causing performance issues on large datasets:

| Page | Data Source | Items |
|------|-----------|-------|
| MarketStructure | protocols + dex + fees | 100+ rows in fee table |
| WhaleActivity | protocols | whale alerts list |
| Correlations | protocols | correlation matrix rows |
| Governance | protocols | governance list |
| CommunitySentiment | protocols | sentiment list |
| AlertConfig | user alerts | alert rules list |
| RiskDashboard | hack history + protocols | hack timeline + risk table |
| Backtester | protocol list | 50-item selector (OK as-is, just results) |

Add `page`/`pageSize` state + Pagination component to: MarketStructure, WhaleActivity, Correlations, Governance, CommunitySentiment, RiskDashboard. AlertConfig and Backtester can skip (small user-generated lists).

---

## 2. Mobile Overflow Fixes — Tables

All data tables need `overflow-x-auto` wrappers and hidden columns on small screens. Pages to audit and fix:
- MarketStructure (fee efficiency table)
- WhaleActivity (accumulation heatmap, flow matrix)
- Correlations (correlation matrix)
- Governance (proposal table)
- CommunitySentiment (sentiment table)
- RiskDashboard (risk score table, hack history)
- All 7 detail pages (stat tables, chain breakdowns)

Pattern: wrap `<table>` in `<div className="overflow-x-auto">`, add `hidden sm:table-cell` on non-essential columns, ensure card-based mobile fallbacks where tables have 5+ columns.

---

## 3. Detail Page Refinements (7 pages)

Per the original plan docs, each detail page needs advanced sections:

| Page | Additions |
|------|-----------|
| ProtocolDetail (830 lines) | Fee revenue section, cross-chain TVL breakdown bar, competitor comparison table, fix hardcoded "XLayer" |
| DexDetail (728 lines) | Market share trend, chain coverage grid, volume efficiency ratio |
| ChainDetail (601 lines) | Ecosystem composition treemap, growth velocity, top yield pools |
| TokenDetail (624 lines) | Market dominance %, link to protocol detail |
| StablecoinDetail (523 lines) | Peg deviation indicator, chain dominance shift |
| FeeDetail (612 lines) | Fee efficiency score (fees/TVL), fee category rank |
| SecurityDetail (626 lines) | Risk score composite, peer comparison |

Each addition is 30-60 lines of new sections using existing data hooks.

---

## 4. Chain Selector on Remaining PRO Pages (5 pages)

These pages don't use `useChain()` for chain-aware filtering:
- **Backtester** — filter protocol list by selected chain
- **RiskDashboard** — filter hack history and risk scores by chain
- **AlertConfig** — no chain filtering needed (user-specific)
- **ProtocolComparison** — filter protocol dropdown by chain
- **WatchlistExports** — no chain filtering needed (user-specific)

Add `useChain()` to Backtester, RiskDashboard, and ProtocolComparison.

---

## 5. PRO Page Improvements

**Backtester**: Already loads all protocols via `useProtocolList`. Verify auto-calculate triggers on param changes (already uses `useDeferredValue`). Add chain filtering from `useChain()`.

**WhaleActivity**: Already has chain selector, severity filters, search. Add pagination to whale alerts feed. Wrap heatmap/flow matrix tables in overflow containers.

**MarketStructure**: Add pagination to fee efficiency table and protocol lifecycle table. Add overflow wrappers.

**YieldIntelligence**: Already has pagination. Verify mobile overflow on risk-adjusted table.

---

## 6. Additional Tests (35 more to reach 66)

Current: 31 tests in 3 files. Need 35 more across:

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `src/test/lib/errorTracking.test.ts` | 8 | captureException, captureMessage, breadcrumbs, getTrackedErrors, exportErrorLog |
| `src/test/lib/keyboard/shortcuts.test.ts` | 6 | getAllShortcuts, formatKeys, shortcut matching, category filtering |
| `src/test/lib/websocket/priceManager.test.ts` | 6 | connect, disconnect, subscribe, fallback to polling |
| `src/test/hooks/useSubscription.test.ts` | 5 | trial active, trial expired, pro tier, free tier |
| `src/test/lib/utils.test.ts` | 5 | cn() merging, edge cases |
| `src/test/lib/export.test.ts` | 5 | CSV export, JSON export, empty data handling |

---

## Implementation Order

**Batch 1**: Pagination on 6 PRO pages + mobile overflow wrappers on all table-heavy pages
**Batch 2**: Chain selector on Backtester, RiskDashboard, ProtocolComparison
**Batch 3**: Detail page refinements (7 pages, add advanced sections)
**Batch 4**: 35 new test files

## Files Summary

| Action | Files | Count |
|--------|-------|-------|
| Modify | MarketStructure, WhaleActivity, Correlations, Governance, CommunitySentiment, RiskDashboard | 6 (pagination + overflow) |
| Modify | Backtester, ProtocolComparison | 2 (chain selector) |
| Modify | ProtocolDetail, DexDetail, ChainDetail, TokenDetail, StablecoinDetail, FeeDetail, SecurityDetail | 7 (refinements) |
| Create | 6 test files | 6 |

**Total**: 15 modified + 6 created = 21 files

