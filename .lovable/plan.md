

# Fix Missing Banners + Enhance 7 Detail Pages with PRO Sections

## Issue 1: No Banners When Payment Left Unpaid

**Root cause**: `useSubscription` falls back to trial/free logic when the subscription has expired or was never activated. The `TierGate` expiry banner only triggers when `status === "active"` AND `daysLeft <= 7`. If a user started checkout but never paid, or their subscription expired, no banner appears.

**Fix**:
- In `useSubscription.ts`: expose an `isExpired` flag when a subscription record exists but `current_period_end` is in the past
- In `TierGate.tsx`: show a "Subscription expired — renew to continue" banner when `isExpired` is true and user still has a subscription record
- In `Billing.tsx`: show an expired banner with a Renew button when subscription has lapsed

## Issue 2: Enhance 7 Detail Pages with PRO Sections

Add a new `ProAnalyticsSection` component that wraps advanced metrics in a `TierGate`. Each detail page gets 2-3 PRO-exclusive card sections appended after existing content. All data is derived from existing API data (no new endpoints needed).

### Per-page PRO sections:

**ProtocolDetail** (833 lines):
- Fee Revenue Efficiency: fees/TVL ratio, revenue per $1 TVL
- Cross-Chain TVL Breakdown: bar chart of TVL across chains (from `chainTvls` in protocol details)
- Competitor Comparison table: top 5 same-category protocols side-by-side

**DexDetail** (733 lines):
- Market Share Trend: this DEX's % of total DEX volume
- Volume Efficiency: volume/chain ratio
- Competitor Comparison: top 5 DEXs side-by-side table

**ChainDetail** (692 lines):
- Ecosystem Composition: protocol category breakdown treemap
- Growth Velocity: TVL change rate over time
- Top Yield Pools: highest APY pools on this chain

**TokenDetail** (666 lines):
- Market Dominance: token's market cap as % of total crypto market
- Volume/Market Cap ratio (turnover)
- Price volatility score

**StablecoinDetail** (536 lines):
- Peg Deviation tracker: distance from $1.00
- Chain Dominance: which chains hold the most supply
- Market share among stablecoins

**FeeDetail** (657 lines):
- Fee Efficiency Score: fees per $ of TVL (bps)
- Category rank among fee generators
- Revenue trend (daily fees × 365 annualized)

**SecurityDetail** (671 lines):
- Risk Score Composite: 0-100 based on audit, TVL stability, age, category
- Peer Comparison: same-category protocols' security metrics
- TVL stability index

### Implementation approach:
- Create `src/components/dashboard/ProDetailSection.tsx` — a reusable wrapper that applies `TierGate` with a PRO badge header
- Each detail page imports `ProDetailSection` and adds 2-3 sections at the bottom
- All metrics are computed from existing hook data (protocols, fees, TVL history)
- Sections use existing chart components and `CHART_TOOLTIP_STYLE` for consistency

### Files to modify:
1. `src/hooks/useSubscription.ts` — add `isExpired` flag
2. `src/components/TierGate.tsx` — add expired subscription banner
3. `src/pages/Billing.tsx` — show expired state banner
4. `src/components/dashboard/ProDetailSection.tsx` — new reusable PRO section wrapper
5. `src/pages/ProtocolDetail.tsx` — add 3 PRO sections
6. `src/pages/DexDetail.tsx` — add 3 PRO sections
7. `src/pages/ChainDetail.tsx` — add 3 PRO sections
8. `src/pages/TokenDetail.tsx` — add 3 PRO sections
9. `src/pages/StablecoinDetail.tsx` — add 3 PRO sections
10. `src/pages/FeeDetail.tsx` — add 3 PRO sections
11. `src/pages/SecurityDetail.tsx` — add 3 PRO sections

