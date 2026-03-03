

# Recovery Round 3: Missing Infrastructure, Database-Backed Hooks, and PRO Page Refinements

## Gap Analysis: What Exists vs What's Missing

### Exists and Working
- All page UIs (14 PRO + core pages)
- Navigation (Sidebar + BottomNav) fully populated
- Backtester with dynamic protocols + auto-calculate (already fixed)
- API client, cache config, lazy loading, validation schemas
- Database tables (7 premium tables with RLS)
- TierGate wired to useSubscription

### Still Missing from MD Documentation

**Infrastructure (6 items):**
1. **Testing infrastructure** — no `vitest.config.ts`, no `src/__tests__/` directory, no test files (66+ tests gone)
2. **Keyboard shortcuts module** — `src/lib/keyboard/shortcuts.ts` missing (g+h, g+p, g+t navigation combos)
3. **Error tracking module** — `src/lib/errorTracking/tracking.ts` missing (sessionStorage-based tracking, breadcrumbs, export)
4. **WebSocket price manager** — `src/lib/websocket/priceManager.ts` missing (auto-reconnect, fallback to polling)
5. **useLivePrice hook** — `src/hooks/useLivePrice.ts` missing
6. **API gateway edge function** — `supabase/functions/api-gateway/` missing (rate limiting, key validation, usage logging)

**Database-Backed Hooks (4 items):**
7. **usePortfolio** — still uses localStorage, should use `portfolio_positions` table
8. **useWatchlist** — still uses localStorage, should use `watchlist` table
9. **usePriceAlerts** — still uses localStorage, should use `alerts` table
10. **useNotifications** — still uses localStorage (acceptable for now)

**Page Refinements (from PREMIUM_FEATURES_IMPROVEMENT_PLAN):**
11. **YieldIntelligence** — limited to 30 pools, needs pagination
12. **MarketStructure** — limited to top 10 protocols, needs pagination
13. **Portfolio page** — has UI but uses localStorage hook; needs DB-backed P&L charts
14. **WhaleActivity** — mostly complete, could use chain selector integration
15. **All PRO pages** — several don't use `useChain()` for chain-aware filtering

---

## Implementation Plan

### Phase 1: Testing Infrastructure
- Create `vitest.config.ts`
- Create `src/test/setup.ts` (matchMedia + IntersectionObserver mocks)
- Create test suites for: API client (11 tests), cache config (8 tests), validation schemas (15 tests)
- Add test scripts to `package.json`

### Phase 2: Missing Library Modules
- Create `src/lib/keyboard/shortcuts.ts` — shortcut definitions, two-key combo matching, `getAllShortcuts()`, `formatKeys()`
- Create `src/lib/errorTracking/tracking.ts` — `captureException()`, `captureMessage()`, breadcrumb tracking, `getTrackedErrors()`, `exportErrorLog()`
- Create `src/lib/websocket/priceManager.ts` — WebSocket connection with auto-reconnect, heartbeat, fallback to polling
- Create `src/hooks/useLivePrice.ts` — React hook wrapping priceManager

### Phase 3: API Gateway Edge Function
- Create `supabase/functions/api-gateway/index.ts` — validate API keys (SHA-256), enforce daily quotas from `api_keys`/`api_usage` tables, proxy to DefiLlama, return rate limit headers

### Phase 4: Database-Backed Hooks
- Rewrite `usePortfolio.ts` — CRUD against `portfolio_positions` table, keep localStorage fallback for unauthenticated users
- Rewrite `useWatchlist.ts` — CRUD against `watchlist` table, localStorage fallback
- Rewrite `usePriceAlerts.ts` — CRUD against `alerts` table, localStorage fallback

### Phase 5: PRO Page Refinements
- Add pagination to `YieldIntelligence.tsx` (same pattern as Tokens/Stablecoins)
- Add pagination to `MarketStructure.tsx`
- Add `useChain()` chain-aware filtering to PRO pages that don't have it (Predictions, Governance, CommunitySentiment, ProtocolComparison)
- Wire ErrorBoundary + error tracking integration into `ErrorBoundary.tsx`

---

## Files Summary

| Action | File | Phase |
|--------|------|-------|
| Create | `vitest.config.ts` | 1 |
| Create | `src/test/setup.ts` | 1 |
| Create | `src/test/lib/api/client.test.ts` | 1 |
| Create | `src/test/lib/cacheConfig.test.ts` | 1 |
| Create | `src/test/lib/validation/schemas.test.ts` | 1 |
| Create | `src/lib/keyboard/shortcuts.ts` | 2 |
| Create | `src/lib/errorTracking/tracking.ts` | 2 |
| Create | `src/lib/websocket/priceManager.ts` | 2 |
| Create | `src/hooks/useLivePrice.ts` | 2 |
| Create | `supabase/functions/api-gateway/index.ts` | 3 |
| Rewrite | `src/hooks/usePortfolio.ts` | 4 |
| Rewrite | `src/hooks/useWatchlist.ts` | 4 |
| Rewrite | `src/hooks/usePriceAlerts.ts` | 4 |
| Modify | `src/pages/YieldIntelligence.tsx` | 5 |
| Modify | `src/pages/MarketStructure.tsx` | 5 |
| Modify | `src/pages/Predictions.tsx` | 5 |
| Modify | `src/pages/Governance.tsx` | 5 |
| Modify | `src/pages/CommunitySentiment.tsx` | 5 |
| Modify | `src/components/ErrorBoundary.tsx` | 5 |
| Modify | `package.json` | 1 |

**New files**: 10
**Modified files**: 10

