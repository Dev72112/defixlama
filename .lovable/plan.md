

# Recovery Round 2: Missing Premium Pages, Pagination, and Polish

## What's Already Done vs. Still Missing

**Already recovered:** Unified API client, cache config, lazy loading, validation schemas, Backtester, RiskDashboard, ApiAccess, Billing, TierGate, BackToTopFab, navigation with PRO badges, WebSocket prices, keyboard shortcuts, ErrorBoundary, pagination on Protocols/Dexs/Yields/Chains/Fees/Activities/Security.

**Still missing (from screenshot + your list):**

### 1. Missing PRO Pages (from screenshot sidebar)
Six PRO pages visible in the screenshot don't exist yet:
- **Alert Config** (`/alert-config`) — advanced multi-type alert configuration (TVL drop, risk score, governance, hack, price)
- **Predictions** (`/predictions`) — AI-powered price/TVL prediction models
- **Protocol Comparison** (`/protocol-comparison`) — side-by-side protocol metrics comparison
- **Governance** (`/governance`) — on-chain governance proposal tracking
- **Community Sentiment** (`/community-sentiment`) — social sentiment analysis
- **Watchlist Exports** (`/watchlist-exports`) — export watchlists as CSV/JSON with sharing

### 2. Missing Pagination
Tokens and Stablecoins pages have NO pagination — all other list pages do.

### 3. Database Migration (7 premium tables)
None of the premium tables exist yet: `subscriptions`, `portfolio_positions`, `watchlist`, `alerts`, `api_keys`, `api_usage`, `user_preferences`.

### 4. Sidebar/BottomNav Missing Routes
Current sidebar only has: Whale Activity, Market Structure, Yield Intelligence, Correlations, Backtester, Risk Dashboard, API Access, Billing. Missing: Alert Config, Predictions, Protocol Comparison, Governance, Community Sentiment, Watchlist Exports.

---

## Implementation Plan

### Phase A: Create 6 Missing PRO Pages

Each page will be wrapped in `TierGate` and follow existing page patterns (Layout wrapper, PRO badge in header, charts + data tables).

| Page | Key Features |
|------|-------------|
| `AlertConfig` | 5 alert types (TVL drop, risk score, governance, hack, price), threshold config, toggle enabled/disabled |
| `Predictions` | TVL trend extrapolation using historical data, confidence intervals, top predicted movers |
| `ProtocolComparison` | Select 2-4 protocols, side-by-side TVL/fees/volume/category comparison with charts |
| `Governance` | List protocols with governance activity, proposal counts, voting power distribution (mock + DefiLlama data) |
| `CommunitySentiment` | Sentiment scores derived from volume/TVL momentum, social activity proxy metrics |
| `WatchlistExports` | Display watchlist with export CSV/JSON buttons, bulk add/remove, public/private toggle |

### Phase B: Add Pagination to Tokens & Stablecoins
- Add page/pageSize state, slice data, add `Pagination` component (same pattern as Protocols/Dexs/Yields pages)

### Phase C: Update Navigation
- Add all 6 new routes to `App.tsx` (lazy loaded)
- Add to Sidebar `advancedItems` array with PRO badges
- Add to BottomNav `moreTabs` array with PRO badges

### Phase D: Database Migration (7 Tables)
Create migration with:
- `subscriptions` (user_id, tier, trial_start, trial_end, stripe_customer_id, status)
- `portfolio_positions` (user_id, token_id, symbol, name, quantity, entry_price, position_type, tags, notes)
- `watchlist` (user_id, item_id, symbol, name, type, is_public)
- `alerts` (user_id, type enum, symbol, condition, threshold, enabled, triggered, last_triggered_at)
- `api_keys` (user_id, key_hash, name, permissions, daily_limit, created_at, revoked_at)
- `api_usage` (key_id, date, request_count)
- `user_preferences` (user_id, theme, language, default_chain, notification_settings jsonb)
- All with RLS policies (users own-data only)
- 18 indexes on foreign keys and frequent query columns

### Phase E: Wire TierGate to Database
- Create `useSubscription` hook reading from `subscriptions` table
- Update `TierGate` to check real subscription status instead of `isTrialActive = true`

---

## Files Summary

| Action | File |
|--------|------|
| Create | `src/pages/AlertConfig.tsx` |
| Create | `src/pages/Predictions.tsx` |
| Create | `src/pages/ProtocolComparison.tsx` |
| Create | `src/pages/Governance.tsx` |
| Create | `src/pages/CommunitySentiment.tsx` |
| Create | `src/pages/WatchlistExports.tsx` |
| Create | `src/hooks/useSubscription.ts` |
| Create | DB migration (7 tables + indexes + RLS) |
| Modify | `src/pages/Tokens.tsx` (add pagination) |
| Modify | `src/pages/Stablecoins.tsx` (add pagination) |
| Modify | `src/App.tsx` (6 new routes) |
| Modify | `src/components/layout/Sidebar.tsx` (6 new nav items) |
| Modify | `src/components/layout/BottomNav.tsx` (6 new nav items) |
| Modify | `src/components/TierGate.tsx` (wire to subscription) |

**New files**: 8
**Modified files**: 6

