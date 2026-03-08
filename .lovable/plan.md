

# Refine All Detail Pages and Pro/Pro+ Pages

## Assessment

After reviewing all 7 detail pages and 10+ Pro/Pro+ pages, I found these categories of issues:

### Visual inconsistencies
- **Wrong tier badges**: YieldIntelligence (line 112) and Correlations (line 125) show "PRO" badge but are PRO+ pages
- **Chart tooltip styles**: Detail pages (ProtocolDetail, TokenDetail, ChainDetail, DexDetail, StablecoinDetail, SecurityDetail, FeeDetail) use `hsl(var(--card))` tooltips instead of the standardized Matrix-theme `CHART_TOOLTIP_STYLE` from `chartStyles.ts`
- **Axis styles**: Detail pages use `hsl(var(--muted-foreground))` font size 12 instead of the standardized `AXIS_TICK_STYLE` (font size 11, `hsl(0,0%,50%)`)

### Content issues
- **TokenDetail line 603**: Raw `<pre>` JSON dump of `oklinkInfo` data -- unprofessional
- **Detail page charts**: Hardcoded to 90 days with no date range selector
- **Missing ErrorBoundary**: ChainDetail, StablecoinDetail, SecurityDetail lack ErrorBoundary wrappers

### Depth gaps on Pro/Pro+ pages
- **Backtester**: No risk-adjusted metrics explanation, no benchmark comparison
- **RiskDashboard**: No risk distribution visualization (pie/donut of High/Medium/Low)
- **WhaleActivity**: No summary insight card at top explaining what the data means

---

## Plan (20 files)

### Part 1: Fix PRO+ Badges (2 files)
- `YieldIntelligence.tsx` line 112: Change `"PRO"` to `"PRO+"`
- `Correlations.tsx` line 125: Change `"PRO"` to `"PRO+"`

### Part 2: Standardize Chart Styles Across All Detail Pages (7 files)
Import `CHART_TOOLTIP_STYLE`, `AXIS_TICK_STYLE` from `chartStyles.ts` and replace all inline tooltip/axis styles in:
- `ProtocolDetail.tsx` -- replace 4+ tooltip contentStyle blocks and axis ticks
- `TokenDetail.tsx` -- replace tooltip styles, axis ticks
- `ChainDetail.tsx` -- replace tooltip styles, axis ticks
- `DexDetail.tsx` -- replace tooltip styles, axis ticks
- `StablecoinDetail.tsx` -- replace tooltip styles, axis ticks
- `SecurityDetail.tsx` -- replace tooltip styles, axis ticks
- `FeeDetail.tsx` -- replace tooltip styles, axis ticks

### Part 3: Clean Up TokenDetail (1 file)
- `TokenDetail.tsx`: Remove the raw JSON `<pre>` dump (line 603). Replace with a clean on-chain info card showing Holders and Total Supply in styled rows, matching the existing Market Analysis card pattern.

### Part 4: Add Date Range Selectors to Detail Page Charts (4 files)
Add `DateRangeSelector` to the main TVL/price history charts on:
- `ProtocolDetail.tsx` -- TVL History chart (currently hardcoded 90d)
- `ChainDetail.tsx` -- TVL History chart (hardcoded 90d)
- `TokenDetail.tsx` -- Price chart (already has 1/7/30/90 buttons, will extend to include 1Y/All)
- `DexDetail.tsx` -- Volume chart

### Part 5: Add ErrorBoundary Wrappers (3 files)
Wrap with `<ErrorBoundary>`:
- `ChainDetail.tsx`
- `StablecoinDetail.tsx`
- `SecurityDetail.tsx`

### Part 6: Enhance Pro/Pro+ Pages with More Depth (3 files)

**RiskDashboard.tsx**: Add a risk distribution donut chart (High/Medium/Low protocol count) above the risk table. Add an "average risk score" KPI card.

**Backtester.tsx**: Add a "Strategy Summary" card below results showing: Annualized Return, Win Rate (% of days positive), Risk-Adjusted Return (Sharpe context). Add a benchmark comparison line (simple "hold TVL" baseline) to the chart.

**WhaleActivity.tsx**: Add an "Insight Summary" card at the top that interprets the HHI and Capital Velocity values in plain English (e.g., "This ecosystem is moderately concentrated with 2.3% daily capital velocity, suggesting healthy liquidity rotation").

---

## File Summary (20 files)

| # | File | Changes |
|---|------|---------|
| 1 | `src/pages/YieldIntelligence.tsx` | Fix badge to PRO+ |
| 2 | `src/pages/Correlations.tsx` | Fix badge to PRO+ |
| 3 | `src/pages/ProtocolDetail.tsx` | Standardize charts + add DateRangeSelector + ErrorBoundary already present |
| 4 | `src/pages/TokenDetail.tsx` | Standardize charts + remove JSON dump + add 365d option |
| 5 | `src/pages/ChainDetail.tsx` | Standardize charts + add DateRangeSelector + add ErrorBoundary |
| 6 | `src/pages/DexDetail.tsx` | Standardize charts |
| 7 | `src/pages/StablecoinDetail.tsx` | Standardize charts + add ErrorBoundary |
| 8 | `src/pages/SecurityDetail.tsx` | Standardize charts + add ErrorBoundary |
| 9 | `src/pages/FeeDetail.tsx` | Standardize charts |
| 10 | `src/pages/RiskDashboard.tsx` | Add risk distribution donut + avg risk KPI |
| 11 | `src/pages/Backtester.tsx` | Add strategy summary card + benchmark line |
| 12 | `src/pages/WhaleActivity.tsx` | Add insight summary card |

12 files total, focused on maximum visual impact and consistency.

