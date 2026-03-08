

# Continue Improving: Fix Gaps, Standardize, Add Depth

## Identified Gaps

### Badge Errors (2 pages still wrong)
- `CommunitySentiment.tsx` line 109: shows "PRO" — should be "PRO+"
- `WatchlistExports.tsx` line 78: shows "PRO" — should be "PRO+"

### Chart Style Inconsistencies (6 pages still using inline styles)
These pages still use `hsl(var(--card))` tooltips instead of the standardized `CHART_TOOLTIP_STYLE`:
- `RiskDashboard.tsx` (hack chart, lines 237-239)
- `Backtester.tsx` (area chart, lines 211-215)
- `CommunitySentiment.tsx` (all 3 charts)
- `Governance.tsx` (all 3 charts)
- `Predictions.tsx` (all 3 charts)
- `ProtocolComparison.tsx` (all charts)

### Missing ErrorBoundary (4 pages)
- `WhaleActivity.tsx`, `MarketStructure.tsx`, `Backtester.tsx`, `Correlations.tsx`

### Data Quality Issues
- **CommunitySentiment**: `volumeMomentum` and `socialActivity` use `Math.random()` — replace with real TVL change metrics
- **Governance**: `proposalCount`, `votingPower`, `participationRate` all use `Math.random()` — derive from protocol TVL/category ranking
- **Predictions**: Accuracy data is hardcoded static — generate from real protocol change data
- **ProtocolComparison**: Radar chart metrics use `Math.random()` for Fee Revenue, Volume, Category

### Missing Insight/Summary Cards
- **MarketStructure**: No ecosystem insight card (WhaleActivity has one, this should too)
- **Predictions**: No methodology explanation card
- **ApiAccess**: No usage visualization chart — just static text

### Missing Features
- **CommunitySentiment**: No DateRangeSelector on trend chart
- **Governance**: No chain-aware badge in header
- **ApiAccess**: Needs a usage over time chart and endpoint documentation section

---

## Plan (12 files)

### Part 1: Fix PRO+ Badges (2 files)
- `CommunitySentiment.tsx` line 109: "PRO" → "PRO+"
- `WatchlistExports.tsx` line 78: "PRO" → "PRO+"

### Part 2: Standardize Chart Styles (6 files)
Import `CHART_TOOLTIP_STYLE`, `AXIS_TICK_STYLE` and replace all inline tooltip/axis styles in:
- `RiskDashboard.tsx`
- `Backtester.tsx`
- `CommunitySentiment.tsx`
- `Governance.tsx`
- `Predictions.tsx`
- `ProtocolComparison.tsx`

### Part 3: Replace Math.random() with Real Data (4 files)
- **CommunitySentiment.tsx**: Replace `Math.random()` volumeMomentum with `change_1d`, socialActivity with a score derived from `change_7d + change_1d` magnitude. Generate `trendData` from actual protocol TVL changes over last 14 protocol entries instead of random.
- **Governance.tsx**: Replace random `proposalCount` with a deterministic score based on TVL rank, `participationRate` derived from `change_7d` magnitude, `votingPower` from actual TVL values.
- **Predictions.tsx**: Replace hardcoded `accuracyData` with dynamically computed entries from protocol TVL change comparisons (predicted vs actual using 1d vs 7d trend).
- **ProtocolComparison.tsx**: Replace random radar values with real data — Fee Revenue from fees hook, Volume from dex hook, Chain Coverage from `chains.length`.

### Part 4: Add ErrorBoundary Wrappers (4 files)
- `WhaleActivity.tsx`, `MarketStructure.tsx`, `Backtester.tsx`, `Correlations.tsx`

### Part 5: Add Insight/Summary Cards (3 files)
- **MarketStructure.tsx**: Add an "Ecosystem Structure Insight" card (similar to WhaleActivity's) interpreting diversity score, fragmentation, and vol/TVL ratio in plain English.
- **Predictions.tsx**: Add a "Methodology" card explaining how predictions are derived (TVL momentum extrapolation + 7d weighted trends).
- **ApiAccess.tsx**: Add a mock usage-over-time area chart (last 30 days) using Recharts and `CHART_TOOLTIP_STYLE`. Add an "Endpoints" documentation section listing available API routes.

---

## File Summary (12 files)

| # | File | Changes |
|---|------|---------|
| 1 | `CommunitySentiment.tsx` | Fix badge, standardize charts, replace Math.random |
| 2 | `WatchlistExports.tsx` | Fix badge |
| 3 | `RiskDashboard.tsx` | Standardize chart styles |
| 4 | `Backtester.tsx` | Standardize charts, add ErrorBoundary |
| 5 | `Governance.tsx` | Standardize charts, replace Math.random |
| 6 | `Predictions.tsx` | Standardize charts, replace hardcoded data, add methodology card |
| 7 | `ProtocolComparison.tsx` | Standardize charts, replace random radar data |
| 8 | `WhaleActivity.tsx` | Add ErrorBoundary |
| 9 | `MarketStructure.tsx` | Add ErrorBoundary, add insight summary card |
| 10 | `Correlations.tsx` | Add ErrorBoundary |
| 11 | `ApiAccess.tsx` | Add usage chart, endpoints docs section |
| 12 | `chartStyles.ts` | No changes needed (already has all exports) |

