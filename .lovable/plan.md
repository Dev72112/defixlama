

# Recovery Plan: Restore Lost Features + Full Platform Audit

## What Happened

Lovable's GitHub sync is one-directional in conflict scenarios. When you made changes via Claude (the Feb 23-27 commits), Lovable's internal state was older. When Lovable next synced, it pushed its state as "Work in progress" commits, overwriting your Claude-made changes on GitHub. Both Lovable AND GitHub now have the older codebase.

The good news: your uploaded markdown docs describe exactly what was built, so I can recreate everything.

## Audit: What's Missing vs. What Exists

### Currently in Lovable (working)
- All core pages (Dashboard, Protocols, Dexs, Yields, Stablecoins, Tokens, Chains, Fees, Activities, Security)
- All detail pages (ProtocolDetail, DexDetail, ChainDetail, TokenDetail, StablecoinDetail, FeeDetail, SecurityDetail)
- PRO pages (WhaleActivity, MarketStructure, YieldIntelligence, Correlations)
- Auth, Admin, Portfolio, Alerts, Donations, Docs, BuilderLogs
- Chain selector, filters on Fees/Security/Stablecoins/Chains

### Missing (from Feb 23-27 Claude work)
1. **Backtester page** (`/backtester`) - strategy builder with all protocols, auto-calculation
2. **Risk Dashboard page** (`/risk-dashboard`) - risk metrics, hack history
3. **Portfolio Dashboard UI** - full P&L tracking visuals (hook exists, UI incomplete)
4. **Billing page** (`/billing`) - subscription management
5. **API Access page** (`/api-access`) - API key management UI
6. **Subscription tier gating system** - gate PRO pages by tier
7. **Unified API client** (`src/lib/api/client.ts`) - retry, deduplication, error handling
8. **Cache config** (`src/lib/cacheConfig.ts`) - 3-tier cache strategy
9. **Validation schemas** (`src/lib/validation/schemas.ts`) - Zod schemas
10. **Lazy loading** (`src/lib/lazyLoad.tsx`) - code splitting for all routes
11. **Testing infrastructure** - vitest config, test files
12. **UI polish** - back-to-top FAB, sortable columns, "Updated X min ago" timestamps, sticky headers
13. **Auth improvements** - enhanced Auth page with Supabase integration
14. **Database tables** - premium feature tables (subscriptions, portfolios, whale_tracking, etc.)

## Implementation Plan (Priority Order)

### Phase 1: Core Infrastructure (implement first)

**1. Unified API Client** - `src/lib/api/client.ts`
- ApiClient class with retry logic (exponential backoff), request deduplication, timeout handling, unified ApiError class
- Refactor `src/lib/api/oklink.ts` to use it

**2. Cache Config** - `src/lib/cacheConfig.ts`
- Three tiers: STATIC (5-60min), SEMI_STATIC (5-15min), VOLATILE (1-30sec)
- `getCacheConfig()` helper, integrate into `App.tsx` QueryClient defaults

**3. Lazy Loading** - `src/lib/lazyLoad.tsx`
- `lazyLoad()` wrapper around React.lazy with Suspense fallback
- Update `App.tsx` to lazy-load all page routes

**4. Validation Schemas** - `src/lib/validation/schemas.ts`
- Zod schemas for DefiLlama, CoinGecko, OKLink responses
- `validateData()` and `validateDataStrict()` utilities

### Phase 2: Premium Pages

**5. Backtester** - `src/pages/Backtester.tsx` + `src/hooks/useBacktesting.ts`
- Load ALL protocols dynamically from DefiLlama API
- Strategy builder: protocol selector, duration, initial investment
- Auto-recalculate on slider change (debounced 300ms)
- Results: projected returns, risk metrics, charts

**6. Risk Dashboard** - `src/pages/RiskDashboard.tsx`
- Risk score composites per protocol (audit, TVL stability, age, category)
- Hack history timeline from DefiLlama hacks endpoint
- Category risk heatmap

**7. Portfolio Dashboard UI** - update `src/pages/Portfolio.tsx`
- Full P&L visualization using existing `usePortfolio` hook
- Position list with entry price, current price, gain/loss
- Portfolio allocation pie chart, performance line chart

**8. API Access page** - `src/pages/ApiAccess.tsx`
- API key generation/revocation UI
- Usage stats, rate limit display
- Requires database tables for api_keys

**9. Billing page** - `src/pages/Billing.tsx`
- Subscription tier display (Free/Pro/Enterprise)
- Since Stripe is paused, show tier info and feature comparison only
- No payment processing

### Phase 3: Tier Gating + Auth

**10. Subscription Tier Gating** - `src/components/TierGate.tsx`
- Wrapper component that checks user subscription tier
- Redirect to upgrade page if insufficient tier
- Apply to Backtester, RiskDashboard, API Access

**11. Database Migration** - premium feature tables
- `subscriptions`, `portfolio_positions`, `api_keys`, `api_usage`, `whale_alerts`, `backtester_strategies`, `user_preferences`
- RLS policies for all tables

### Phase 4: UI Polish

**12. Back-to-top FAB** - floating action button on scroll
**13. Sortable column headers** - click to sort with direction indicators on all data tables
**14. "Updated X minutes ago"** - timestamp on ProtocolTable using React Query's `dataUpdatedAt`
**15. Sticky table headers** - keep headers visible on scroll
**16. Error boundaries** - wrap all routes individually in `App.tsx`

### Phase 5: Navigation Updates

**17. Update routes** - Add `/backtester`, `/risk-dashboard`, `/api-access`, `/billing` to `App.tsx`
**18. Update Sidebar** - Add all new premium routes with PRO badges
**19. Update BottomNav** - Add missing premium routes to More drawer

## File Summary

| Action | File | Phase |
|--------|------|-------|
| Create | `src/lib/api/client.ts` | 1 |
| Create | `src/lib/cacheConfig.ts` | 1 |
| Create | `src/lib/lazyLoad.tsx` | 1 |
| Create | `src/lib/validation/schemas.ts` | 1 |
| Create | `src/pages/Backtester.tsx` | 2 |
| Create | `src/hooks/useBacktesting.ts` | 2 |
| Create | `src/pages/RiskDashboard.tsx` | 2 |
| Create | `src/pages/ApiAccess.tsx` | 2 |
| Create | `src/pages/Billing.tsx` | 2 |
| Create | `src/components/TierGate.tsx` | 3 |
| Create | DB migration (premium tables) | 3 |
| Modify | `src/lib/api/oklink.ts` | 1 |
| Modify | `src/App.tsx` | 1,4,5 |
| Modify | `src/pages/Portfolio.tsx` | 2 |
| Modify | `src/components/layout/Sidebar.tsx` | 5 |
| Modify | `src/components/layout/BottomNav.tsx` | 5 |
| Modify | `src/components/dashboard/ProtocolTable.tsx` | 4 |
| Modify | Multiple table components | 4 |

**Total new files**: ~11
**Total modified files**: ~10

