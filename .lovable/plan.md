

# Legal Pages + Tier Badge Corrections + Pro/Pro+ Page Improvements

## Part 1: Legal Pages (3 new pages)

Create three full-width legal pages at `/terms`, `/privacy`, `/refunds` with the exact content provided. These pages will NOT use the Layout component (no sidebar) — they'll be standalone pages with the dark theme, clean typography, and a "Back to Home" link at the bottom.

### New Files:
- `src/pages/Terms.tsx` — Terms of Service, full content as specified
- `src/pages/Privacy.tsx` — Privacy Policy, full content as specified
- `src/pages/Refunds.tsx` — Refund Policy, full content as specified

Each page will use:
- Dark background matching the Matrix theme
- `prose` styling with custom dark overrides for headings/text
- Internal links between legal pages (Terms links to Privacy, etc.)
- "Back to Home" link at bottom
- No sidebar, full-width content with max-w-3xl centering

### Route Registration:
- `src/App.tsx` — Add routes for `/terms`, `/privacy`, `/refunds`

### Footer Links:
- `src/components/layout/Sidebar.tsx` — Add "Terms", "Privacy", "Refunds" links in the Resources/footer section
- `src/components/layout/BottomNav.tsx` — Add legal links in the "More" drawer

## Part 2: Fix Sidebar & BottomNav Tier Badges

Currently all advanced items show "PRO" badge. Per the tier mapping:
- **PRO** features: Backtester, Risk Dashboard, Predictions, Alert Config, Governance, Protocol Comparison, API Access
- **PRO+** features: Whale Activity, Market Structure, Yield Intelligence, Correlations, Community Sentiment, Watchlist Exports

### Files to update:
- `src/components/layout/Sidebar.tsx` — Change badges on PRO+ items from `"PRO"` to `"PRO+"`
- `src/components/layout/BottomNav.tsx` — Same badge corrections

## Part 3: Ensure TierGate Usage on All Premium Pages

Check and fix `requiredTier` on each premium page:
- PRO pages (requiredTier="pro"): Backtester, RiskDashboard, Predictions, AlertConfig, Governance, ProtocolComparison, ApiAccess
- PRO+ pages (requiredTier="pro_plus"): WhaleActivity, MarketStructure, YieldIntelligence, Correlations, CommunitySentiment, WatchlistExports

Some pages are missing TierGate entirely (WhaleActivity, MarketStructure, YieldIntelligence, Correlations, ApiAccess, RiskDashboard, Backtester). These need to be wrapped.

### Files to update (add/fix TierGate):
- `src/pages/WhaleActivity.tsx` — Wrap with `<TierGate requiredTier="pro_plus">`
- `src/pages/MarketStructure.tsx` — Wrap with `<TierGate requiredTier="pro_plus">`
- `src/pages/YieldIntelligence.tsx` — Wrap with `<TierGate requiredTier="pro_plus">`
- `src/pages/Correlations.tsx` — Wrap with `<TierGate requiredTier="pro_plus">`
- `src/pages/CommunitySentiment.tsx` — Update to `requiredTier="pro_plus"`
- `src/pages/WatchlistExports.tsx` — Update to `requiredTier="pro_plus"`
- `src/pages/Backtester.tsx` — Add `<TierGate requiredTier="pro">`
- `src/pages/RiskDashboard.tsx` — Add `<TierGate requiredTier="pro">`
- `src/pages/ApiAccess.tsx` — Add `<TierGate requiredTier="pro">`
- `src/pages/Predictions.tsx` — Verify `requiredTier="pro"`
- `src/pages/Governance.tsx` — Verify `requiredTier="pro"`
- `src/pages/ProtocolComparison.tsx` — Verify `requiredTier="pro"`
- `src/pages/AlertConfig.tsx` — Verify `requiredTier="pro"`

## Part 4: Update Billing Page Pricing

The user specified Pro Plus at $49/mo (not $59). Update `src/pages/Billing.tsx` to reflect $49/mo.

---

## File Summary (18 files)

| # | File | Action |
|---|------|--------|
| 1 | `src/pages/Terms.tsx` | Create — full Terms of Service page |
| 2 | `src/pages/Privacy.tsx` | Create — full Privacy Policy page |
| 3 | `src/pages/Refunds.tsx` | Create — full Refund Policy page |
| 4 | `src/App.tsx` | Add 3 legal routes |
| 5 | `src/components/layout/Sidebar.tsx` | Fix PRO+ badges, add legal links |
| 6 | `src/components/layout/BottomNav.tsx` | Fix PRO+ badges, add legal links |
| 7 | `src/pages/Billing.tsx` | Fix Pro+ price to $49/mo |
| 8 | `src/pages/WhaleActivity.tsx` | Add TierGate pro_plus |
| 9 | `src/pages/MarketStructure.tsx` | Add TierGate pro_plus |
| 10 | `src/pages/YieldIntelligence.tsx` | Add TierGate pro_plus |
| 11 | `src/pages/Correlations.tsx` | Add TierGate pro_plus |
| 12 | `src/pages/CommunitySentiment.tsx` | Fix requiredTier to pro_plus |
| 13 | `src/pages/WatchlistExports.tsx` | Fix requiredTier to pro_plus |
| 14 | `src/pages/Backtester.tsx` | Add TierGate pro |
| 15 | `src/pages/RiskDashboard.tsx` | Add TierGate pro |
| 16 | `src/pages/ApiAccess.tsx` | Add TierGate pro |
| 17 | `src/pages/Predictions.tsx` | Verify/fix TierGate pro |
| 18 | `src/pages/Governance.tsx` | Verify/fix TierGate pro |

