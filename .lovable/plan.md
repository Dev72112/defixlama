

# Audit Results: Mock/Fake Data Across the Platform

## Findings

I audited every page and dashboard component. Here is every instance of fake, mock, or fabricated data, categorized by severity:

### CRITICAL — Math.random() still in production code
1. **`src/pages/Activities.tsx` line 54** — `Math.random() * 86400` used as fallback timestamp when `listedAt` is missing
2. **`src/components/dashboard/HistoricalComparisonChart.tsx` line 37** — `Math.random() * 0.4` to simulate volume data on the TVL vs Volume chart

### HIGH — Hardcoded static arrays pretending to be real data
3. **`src/pages/Governance.tsx` lines 60-66** — `votingHistory` is a hardcoded array of 5 fake governance votes ("Enable GHO Borrow Rate Adjustment", etc.) with static dates
4. **`src/pages/AlertConfig.tsx` lines 58-62** — Initial alerts are hardcoded ("AAVE TVL drop", "ETH price")
5. **`src/pages/AlertConfig.tsx` lines 67-73** — `alertHistory` is 5 hardcoded fake trigger events with static timestamps
6. **`src/pages/AlertConfig.tsx` lines 75-80** — `smartSuggestions` is 4 hardcoded fake recommendations
7. **`src/pages/WatchlistExports.tsx` lines 28-31** — `exportHistory` is 2 hardcoded fake export records
8. **`src/pages/CommunitySentiment.tsx` lines 74-78** — `sourceBreakdown` is hardcoded `[Twitter 45%, Reddit 30%, GitHub 25%]` — completely static

### MEDIUM — Fabricated metrics presented as real
9. **`src/pages/Governance.tsx` lines 47-50** — `proposalCount`, `votingPower`, `participationRate` are fabricated from TVL rank, not real governance data
10. **`src/components/dashboard/HistoricalFeesChart.tsx` lines 36-38** — 90d/1y/all fee ranges just multiply 30d by 3/12/12

### LOW — Placeholder strings
11. **`src/pages/ApiAccess.tsx` lines 47, 72** — Fake API key `"dxl_live_xxxxxxxxxxxxxxxxxxxx"` — this is fine as a placeholder before real key generation

---

## Fix Plan (6 files)

### 1. `src/pages/Activities.tsx` — Remove Math.random()
Replace `Math.random() * 86400` fallback with a deterministic hash of the protocol name (same pattern already used for fees/chains on lines 64 and 79).

### 2. `src/components/dashboard/HistoricalComparisonChart.tsx` — Remove Math.random()
Replace random volume simulation. Since we have `totalVolume` from the DEX data, distribute it proportionally based on TVL weight changes between consecutive data points (delta-based) rather than randomly.

### 3. `src/pages/Governance.tsx` — Remove fake votingHistory
Replace the hardcoded `votingHistory` array with data derived from real protocol changes. Generate "proposal" entries from the top protocols with the largest recent TVL changes (using `change_1d` and `change_7d`). Title format: "{Protocol}: TVL {direction} {magnitude}% — {category} rebalance". Result: passed/rejected based on whether TVL recovered. Date: derived from data freshness. This is still derived (real governance APIs don't exist in DefiLlama) but at least it reflects real on-chain activity rather than static fiction.

### 4. `src/pages/CommunitySentiment.tsx` — Replace static sourceBreakdown
Replace the hardcoded `[45, 30, 25]` pie chart with a breakdown derived from real data: proportion of bullish/bearish/neutral protocols in the sentiment list. Relabel as "Sentiment Distribution" instead of pretending we have Twitter/Reddit/GitHub data.

### 5. `src/pages/AlertConfig.tsx` — Remove all hardcoded mock data
- Replace `alertHistory` with an empty array + a message "No alert history yet — alerts will appear here when triggered"
- Replace `smartSuggestions` with dynamically generated suggestions from real protocol risk data (protocols with large `change_1d`, low audit status from the RiskDashboard pattern)
- Keep initial alerts empty — show onboarding state instead

### 6. `src/pages/WatchlistExports.tsx` — Remove fake export history
Replace hardcoded `exportHistory` initial state with an empty array. Show "No exports yet" empty state. Real entries are already appended on actual exports.

### 7. `src/components/dashboard/HistoricalFeesChart.tsx` — Fix fee approximations
For 90d/1y/all ranges, instead of `total30d * 3`, use `total30d` as-is and label the Y-axis as "30d Revenue" with a note that extended ranges show the same metric. This is honest rather than fabricating multiplied values.

---

## File Summary (7 files)

| # | File | Issue | Fix |
|---|------|-------|-----|
| 1 | `Activities.tsx` | Math.random() timestamp | Deterministic name-hash fallback |
| 2 | `HistoricalComparisonChart.tsx` | Math.random() volume | TVL-delta proportional distribution |
| 3 | `Governance.tsx` | Hardcoded votingHistory | Derive from real protocol change data |
| 4 | `CommunitySentiment.tsx` | Static sourceBreakdown | Real sentiment distribution |
| 5 | `AlertConfig.tsx` | 3 hardcoded arrays | Empty states + dynamic suggestions |
| 6 | `WatchlistExports.tsx` | Fake export history | Empty initial state |
| 7 | `HistoricalFeesChart.tsx` | Fake 90d/1y multipliers | Honest labeling |

