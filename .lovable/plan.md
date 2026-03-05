

# Recovery Round 5: Chain Selector Fix, Mobile Tables, PRO Page Overhaul, Free Page Tabs, Bottom Nav Polish

This is a massive scope covering 6 prompts. Prompt 6 (Stripe) is **skipped** per the existing memory constraint — Stripe is not available in your region. The remaining 5 prompts are organized into 3 implementation batches.

---

## Batch 1: Chain Selector Global Fix + Mobile Table Cards

### Chain Selector Fix (Prompt 1)

The chain context (`ChainContext`) already exists and most pages use `useChain()`. The core issue is:
- Data hooks like `useChainProtocols`, `useChainDexVolumes` etc. already accept `chainId` and filter correctly
- BNB chain uses slug "BSC" in DefiLlama but id "bsc" in our config — the `fetchChainProtocols` normalizer handles this via `toLowerCase().replace(/[\s-]/g, "")` which should work
- The real problem: some pages don't clear previous data on chain switch, and there's no loading/transition feedback

**Changes:**
1. **Add chain transition state to ChainContext** — when chain changes, set a `isChainSwitching` flag for 300ms to trigger loading skeletons across all components
2. **Add "Showing data for: [Chain Name]" label** to Layout component below header
3. **Add per-chain error handling** in data hooks — if a chain-specific endpoint fails, return empty array with error state instead of stale data
4. **Fix key prop on query hooks** — ensure `queryKey` includes `chainId` so React Query doesn't serve stale cached data from previous chain (already done but verify all pages)
5. **Reset pagination to page 1 on chain change** across all paginated pages using a `useEffect` on `selectedChain.id`

Files modified: `src/contexts/ChainContext.tsx`, `src/components/layout/Layout.tsx`, pages with pagination (add `useEffect` reset)

### Mobile Table → Card Conversion (Prompt 2)

Create a reusable `ResponsiveDataTable` component that renders as table on desktop (768px+) and stacked cards on mobile.

**New component: `src/components/ui/responsive-table.tsx`**
- Props: `columns`, `data`, `onRowClick`, `keyField`, `loading`, `emptyMessage`
- Each column config: `{ key, label, render?, priority: 'always' | 'desktop' | 'expanded', align? }`
- Desktop: standard `<table>` (existing behavior)
- Mobile: each row becomes a card with priority="always" fields visible, priority="desktop" hidden, expandable on tap

Apply to these pages by replacing raw `<table>` with `ResponsiveDataTable`:
- `Tokens.tsx` (token table)
- `ProtocolTable.tsx` (used by Protocols, Dashboard)
- `Stablecoins.tsx`
- `Predictions.tsx` 
- `Governance.tsx`
- `CommunitySentiment.tsx`
- `WatchlistExports.tsx`
- `ProtocolComparison.tsx` (metrics table)
- `AlertConfig.tsx` (alerts list)

Files created: `src/components/ui/responsive-table.tsx`
Files modified: All pages listed above

---

## Batch 2: PRO Pages Overhaul with Tabs (Prompt 3)

Add tab structure to all 6 PRO pages using Radix Tabs. Each page gets 3 tabs with lazy-loaded content.

### AlertConfig — Tabs: [Active Alerts] [Alert History] [Smart Suggestions]
- Active Alerts: existing alert cards + progress bar showing % away from trigger
- Alert History: mock triggered alerts log with filter by status
- Smart Suggestions: AI suggestions based on protocol TVL changes with "Add this alert" buttons

### Predictions — Tabs: [Price Predictions] [TVL Predictions] [Accuracy Tracker]
- Price Predictions: token selector + bull/base/bear scenarios + risk level badge
- TVL Predictions: existing forecast chart + inflow/outflow predictions
- Accuracy Tracker: historical accuracy percentages with best/worst predictions

### ProtocolComparison — Tabs: [Compare] [Historical] [Export]
- Compare: existing comparison UI with winner highlighting per metric
- Historical: date range selector to see comparison at past point
- Export: format selector (CSV/PDF) + "Export Report" button

### Governance — Tabs: [Active Proposals] [Voting History] [Power Analysis]
- Active Proposals: proposal cards with deadline countdown + vote progress bars
- Voting History: past proposals with Won/Lost/Failed badges
- Power Analysis: voting power distribution chart + decentralization score

### CommunitySentiment — Tabs: [Current Sentiment] [Trend Analysis] [Source Breakdown]
- Current Sentiment: Fear & Greed gauge per protocol + key signal indicators
- Trend Analysis: sentiment vs price overlay chart
- Source Breakdown: source percentages (Twitter, Reddit, GitHub, On-chain, News)

### WatchlistExports — Tabs: [Quick Export] [Scheduled] [History]
- Quick Export: data type selector + date range + format + columns checklist
- Scheduled: create automated export schedules (mock UI)
- History: past exports list with re-download

Files modified: All 6 PRO page files completely rewritten with tab structure

---

## Batch 3: Free Page Tabs + Bottom Nav Polish (Prompts 4 & 5)

### Free Page Tabs (Prompt 4)

Add tab structure to 4 main free pages with URL sync (`?tab=xxx`):

**Tokens** — [Overview] [Top Movers] [New Listings]
- Overview: existing token table
- Top Movers: sorted by absolute 24h change (top gainers + losers)
- New Listings: sorted by `listedAt` descending

**Protocols** — [All Protocols] [By Category] [Trending]
- All Protocols: existing table
- By Category: category filter chips with filtered table
- Trending: sorted by 7d change

**Yields** — [All Pools] [Highest APY] [Most Stable]
- All Pools: existing table
- Highest APY: sorted by apy descending
- Most Stable: filtered to stablecoin pools with lowest IL risk

**Stablecoins** — [Overview] [Peg Health] [Flows]
- Overview: existing table
- Peg Health: deviation from $1 with color coding
- Flows: chain distribution breakdown

Tab bar: sticky on scroll, horizontal scroll on mobile, URL updates with `useSearchParams`.

Files modified: `Tokens.tsx`, `Protocols.tsx`, `Yields.tsx`, `Stablecoins.tsx`

### Bottom Nav Polish (Prompt 5)

1. Auto-hide on scroll down, show on scroll up (CSS transform + JS scroll listener)
2. Safe area padding for iOS
3. Content padding-bottom to avoid overlap
4. Tab memory: when navigating back, restore last active tab via URL params
5. PRO lock icon on Portfolio for unauthenticated users

Files modified: `src/components/layout/BottomNav.tsx`, `src/components/layout/Layout.tsx`

---

## Stripe (Prompt 6) — SKIPPED

Per existing project constraints, Stripe is not supported in your region. This is deferred until an alternative payment provider is chosen.

---

## Files Summary

| Batch | Action | Files | Count |
|-------|--------|-------|-------|
| 1 | Create | `responsive-table.tsx` | 1 |
| 1 | Modify | `ChainContext.tsx`, `Layout.tsx`, 9 table pages | 11 |
| 2 | Rewrite | 6 PRO pages (AlertConfig, Predictions, ProtocolComparison, Governance, CommunitySentiment, WatchlistExports) | 6 |
| 3 | Rewrite | 4 free pages (Tokens, Protocols, Yields, Stablecoins) | 4 |
| 3 | Modify | `BottomNav.tsx`, `Layout.tsx` | 2 |

**Total: 1 new + 23 modified files across 3 batches**

This is a very large scope. I recommend implementing Batch 1 first (chain fix + mobile cards), confirming it works, then proceeding to Batch 2 (PRO tabs), then Batch 3 (free tabs + bottom nav).

