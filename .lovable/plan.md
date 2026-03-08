

# defiXlama: Epic Product Expansion -- Advanced Analytics, Detail Page Upgrades, and Subscription Infrastructure

This plan covers three major workstreams: (1) expanding Whale Activity and Market Structure into premium-grade analytics pages, (2) adding entirely new tracking features, (3) enriching all detail pages, and (4) building a subscription paywall with a 3-month free trial notice.

---

## Workstream 1: Expand Whale Activity Page

The current page has basic TVL concentration charts and a simple alert feed. To make it subscription-worthy, we add deep behavioral analytics.

### New Sections to Add:

**1. Herfindahl-Hirschman Index (HHI) Score**
- Compute the HHI from protocol TVL shares to measure ecosystem concentration
- Display as a gauge/score card with interpretation (competitive / moderate / concentrated)
- Data source: existing `useChainProtocols`

**2. Capital Velocity Tracker**
- Calculate the ratio of 24h inflows+outflows relative to total TVL -- measures how fast capital is rotating
- Show as a metric card with a small sparkline trend (use 7d protocol change data)
- Data source: existing protocol `change_1d` fields

**3. Accumulation vs Distribution Heatmap**
- Grid of top 20 protocols showing 1h, 1d, 7d changes as colored cells (green = accumulation, red = distribution)
- Creates an at-a-glance view of where capital is moving over multiple timeframes
- Data source: existing protocol `change_1h`, `change_1d`, `change_7d`

**4. Cross-Chain Capital Flow Matrix**
- For protocols deployed on multiple chains, show which chains are gaining vs losing TVL
- Use `chainTvls` field from protocol data to decompose TVL by chain
- Display as a table: Protocol | Chain A | Chain B | ... with color-coded flow direction

**5. Whale Alert Feed Enhancements**
- Add severity levels (>5% = moderate, >15% = major, >30% = extreme)
- Add estimated dollar value of movement (TVL * change%)
- Add category tags and protocol logos
- Add filtering by severity and category

### Files to modify:
- `src/pages/WhaleActivity.tsx` -- major expansion
- New: `src/components/dashboard/AccumulationHeatmap.tsx`
- New: `src/components/dashboard/CrossChainFlowMatrix.tsx`

---

## Workstream 2: Expand Market Structure Page

Current page has DEX volume concentration and fee distribution. Needs deeper liquidity and structural analysis.

### New Sections to Add:

**1. Liquidity Fragmentation Index**
- Measure how spread out DEX volume is across protocols (inverse of concentration)
- Use existing DEX volume data to compute Gini coefficient
- Display as a metric with health interpretation

**2. Fee-to-TVL Efficiency Ratio**
- For each protocol, calculate fees/TVL ratio -- higher = more capital-efficient
- Top 10 most efficient protocols as a ranked bar chart
- Data source: combine `useChainFees` with `useChainProtocols`

**3. Category Capital Flow Treemap**
- Visual treemap showing TVL by category with change colors overlaid
- Categories: DEX, Lending, Derivatives, Bridge, Yield, Liquid Staking, CDP, etc.
- Data source: existing protocol category + TVL data

**4. Volume-to-TVL Cross-Chain Comparison**
- Compare Vol/TVL ratio across the top 10 chains
- Bar chart showing which chains have the most active trading relative to locked capital
- Data source: `useChainsTVL` + per-chain DEX volumes

**5. Protocol Lifecycle Distribution**
- Categorize protocols by age (using `listedAt` timestamp): <30d, 30-90d, 90d-1y, >1y
- Show TVL distribution by age cohort -- reveals ecosystem maturity
- Data source: existing protocol `listedAt` field

### Files to modify:
- `src/pages/MarketStructure.tsx` -- major expansion
- New: `src/components/dashboard/CategoryTreemap.tsx`
- New: `src/components/dashboard/ProtocolLifecycle.tsx`

---

## Workstream 3: New Tracking Pages

### Page 1: Yield Intelligence (`/yield-intelligence`)
Advanced yield analytics beyond the basic yields table.

**Sections:**
- **Risk-Adjusted Yield Ranking**: Sort pools by APY / TVL volatility ratio
- **Yield Curve by Category**: Average APY by protocol category over time
- **Impermanent Loss Estimator**: Input-based tool showing IL for common pairs
- **Yield Concentration**: Which protocols capture most of the yield TVL
- **Stablecoin vs Volatile Yields**: Split yield pools by underlying asset type

Data source: existing `useChainYieldPools`

### Page 2: Correlation Matrix (`/correlations`)
Show how protocol TVLs move together.

**Sections:**
- **TVL Correlation Heatmap**: Matrix showing correlation coefficients between top 20 protocol TVL changes
- **Sector Rotation Tracker**: Which categories are gaining/losing share simultaneously
- **Divergence Alerts**: Protocols whose TVL movements diverge from their category average

Data source: existing protocol change data (`change_1h`, `change_1d`, `change_7d`)

### Files to create:
- `src/pages/YieldIntelligence.tsx`
- `src/pages/Correlations.tsx`
- New components as needed

### Navigation updates:
- `src/components/layout/Sidebar.tsx` -- add under "Advanced Analytics" section
- `src/components/layout/BottomNav.tsx` -- add to More drawer
- `src/App.tsx` -- add routes

---

## Workstream 4: Expand All Detail Pages

### ProtocolDetail.tsx (830 lines -- already rich, add):
- **Fee Revenue Section**: If the protocol appears in fees data, show 24h/7d/30d fee breakdown
- **Cross-Chain TVL Breakdown**: Use `chainTvls` to show TVL per chain as a stacked bar
- **Competitor Comparison Table**: Show the protocol vs top 5 in same category side by side (TVL, changes, fees)
- Fix hardcoded "XLayer" in description fallback (line 169)

### DexDetail.tsx (728 lines -- add):
- **Market Share Trend**: Show DEX's share of total volume (current vs 7d ago vs 30d ago)
- **Chain Coverage Map**: Visual grid of which chains this DEX operates on
- **Volume Efficiency**: Volume/TVL ratio compared to category average

### ChainDetail.tsx (601 lines -- add):
- **Ecosystem Composition**: Treemap of protocol categories on this chain
- **Growth Velocity**: Rate of new protocol deployments (using `listedAt` data)
- **Top Yield Pools on Chain**: Quick table of best yields available

### TokenDetail.tsx (624 lines):
- Already comprehensive -- add market dominance percentage vs total crypto market cap
- Add link to protocol detail if token has a matching protocol

### StablecoinDetail.tsx (523 lines -- add):
- **Peg Deviation History**: If available, show how close to $1 the stablecoin has stayed
- **Chain Dominance Shift**: Which chains are gaining share of this stablecoin's supply

### FeeDetail.tsx (612 lines -- add):
- **Fee Efficiency Score**: Fees relative to TVL -- higher = more productive protocol
- **Fee Category Rank**: Where this protocol ranks within its category for fee generation

### SecurityDetail.tsx (626 lines -- add):
- **Risk Score Composite**: Combine audit status, TVL volatility, age, and category into a single risk rating
- **Similar Protocol Comparison**: Security posture comparison with category peers

### Files to modify:
- `src/pages/ProtocolDetail.tsx`
- `src/pages/DexDetail.tsx`
- `src/pages/ChainDetail.tsx`
- `src/pages/TokenDetail.tsx`
- `src/pages/StablecoinDetail.tsx`
- `src/pages/FeeDetail.tsx`
- `src/pages/SecurityDetail.tsx`

---

## Workstream 5: Subscription Infrastructure

### Approach:
Use Stripe for $20/month subscription. All advanced analytics pages are gated behind a subscription check, but unlocked free for 3 months with a visible countdown banner.

### Implementation:

**1. Subscription Banner Component**
- New: `src/components/SubscriptionBanner.tsx`
- Shows on all advanced pages: "Free access until [date]. After that, $20/month."
- Calm, informative design -- not aggressive upsell
- Countdown shows days remaining

**2. Subscription Gate Component**
- New: `src/components/SubscriptionGate.tsx`
- Wraps advanced page content
- During free period: renders children + banner
- After free period: checks Stripe subscription status
- If not subscribed: shows a professional paywall with feature list and subscribe button

**3. Database Table**
- `subscriptions` table: user_id, stripe_customer_id, stripe_subscription_id, status, current_period_end, created_at
- RLS: users can only read their own subscription

**4. Stripe Integration**
- Enable Stripe via the Lovable Stripe tool
- Create a $20/month "defiXlama Pro" product
- Edge function for checkout session creation
- Edge function for webhook handling (subscription created/updated/cancelled)

**5. Free Trial Logic**
- The free period is NOT a Stripe trial -- it's a hardcoded date (3 months from launch)
- `const FREE_UNTIL = new Date('2026-05-13')` -- simple, no backend needed during free period
- After that date, the gate checks subscription status

**6. Pages Gated as "Pro":**
- `/whale-activity`
- `/market-structure`
- `/yield-intelligence`
- `/correlations`
- All detail page "advanced sections" (fee efficiency, cross-chain flows, etc.) show a small "Pro" badge and are gated after the free period

### Navigation Updates:
- Sidebar shows a small "PRO" badge next to advanced nav items
- Remove "SOON" badges, replace with "PRO" badges

### Files to create:
- `src/components/SubscriptionBanner.tsx`
- `src/components/SubscriptionGate.tsx`
- `src/hooks/useSubscription.ts`
- Edge function: `supabase/functions/create-checkout/index.ts`
- Edge function: `supabase/functions/stripe-webhook/index.ts`
- DB migration: subscriptions table

### Files to modify:
- `src/pages/WhaleActivity.tsx` -- wrap with SubscriptionGate
- `src/pages/MarketStructure.tsx` -- wrap with SubscriptionGate
- `src/pages/YieldIntelligence.tsx` -- wrap with SubscriptionGate
- `src/pages/Correlations.tsx` -- wrap with SubscriptionGate
- `src/components/layout/Sidebar.tsx` -- update badges from "SOON" to "PRO"
- `src/App.tsx` -- add new routes

---

## Implementation Order

Due to the scope, this should be done across multiple implementation rounds:

**Round 1 (this session):**
- Expand WhaleActivity with HHI, accumulation heatmap, cross-chain flow matrix, enhanced alerts
- Expand MarketStructure with fragmentation index, fee efficiency, lifecycle distribution, cross-chain Vol/TVL
- Remove "SOON" badges, replace with "PRO" badges in sidebar

**Round 2:**
- Create YieldIntelligence and Correlations pages
- Expand all 7 detail pages with advanced sections
- Fix remaining hardcoded "XLayer" references in detail pages

**Round 3:**
- Enable Stripe integration
- Build subscription infrastructure (banner, gate, database, edge functions)
- Wire up Pro gating across all advanced pages

---

## Technical Summary

| Workstream | New Files | Modified Files | Complexity |
|-----------|-----------|---------------|------------|
| Whale Activity expansion | 2 components | 1 page | Medium |
| Market Structure expansion | 2 components | 1 page | Medium |
| New tracking pages | 2 pages + components | App.tsx, Sidebar, BottomNav | Medium |
| Detail page expansion | 0 | 7 detail pages | High (many files) |
| Subscription infrastructure | 3 components + 2 edge functions + 1 hook + DB migration | 4 pages + Sidebar | High |

**Total new files**: ~12
**Total modified files**: ~16
**Stripe integration**: Required (via Lovable tool)
**Database changes**: 1 new table (subscriptions)

