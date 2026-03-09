

# Final Sprint: Tabs & Pro Teasers for Remaining Pages

## Pages Still Missing Tabs + Teasers

Based on the codebase review, three free-tier pages still lack the standardized 3-tab architecture:

### 1. Fees Page (`src/pages/Fees.tsx`)
- **Tab 1: "Overview"** - Current table + charts (FeeTrendChart, RevenueBreakdown, HistoricalFeesChart)
- **Tab 2: "Revenue"** - Revenue-focused view ranking protocols by fee-to-TVL ratio, revenue efficiency
- **Tab 3: "Trends"** - Historical fee trend analysis, fee growth leaders
- **Pro Teaser**: "Fee Optimization Intelligence" (Pro), "Revenue Forecasting" (Pro+)

### 2. Chains Page (`src/pages/Chains.tsx`)
- **Tab 1: "Overview"** - Current table + charts (ChainComparisonChart, TVLDistributionChart)
- **Tab 2: "Growth"** - Chains ranked by TVL growth, new chain additions
- **Tab 3: "Ecosystem"** - Protocol count per chain, ecosystem diversity metrics
- **Pro Teaser**: "Cross-Chain Flow Analysis" (Pro), "Chain Risk Scoring" (Pro+)

### 3. Security Page (`src/pages/Security.tsx`)
- **Tab 1: "Overview"** - Current filtered protocol list with audit status
- **Tab 2: "Audit Map"** - Visual breakdown of audited vs unaudited TVL by category
- **Tab 3: "Risks"** - Unaudited protocols sorted by TVL (highest risk exposure)
- **Pro Teaser**: "Real-Time Exploit Monitoring" (Pro), "Smart Contract Risk Scanner" (Pro+)

## Technical Approach
- Same pattern as completed pages: `useSearchParams` for tab state, `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` from Radix
- Reuse existing chart components already imported in each page
- Add `ProFeatureTeaser` at bottom of each tab where relevant
- Mobile-responsive tab lists with `overflow-x-auto`

