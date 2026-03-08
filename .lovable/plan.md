

# Next Batch: Fix Gated Pages Navigation + Cleanup

## Issue 1: Gated Pages Have No Back/Navigation When Blocked

**Root cause**: All 13 gated pages wrap `<TierGate>` outside `<Layout>`. When the user lacks access, `TierGate` renders only the `UpgradePrompt` card — no header, no sidebar, no back button. The user is stranded.

**Fix**: Move `<Layout>` outside `<TierGate>` in all 13 pages so the shell always renders. Also add a "Go Back" button to the `UpgradePrompt` component.

### Files to modify:
1. **`src/components/TierGate.tsx`** — Add a "Go Back" button (using `navigate(-1)`) next to "View Plans & Pricing" in the `UpgradePrompt`. Also add it to `ExpiredBanner`.
2. **13 gated pages** — Swap the nesting order so `Layout` wraps `TierGate`:
   - `ApiAccess.tsx`, `Backtester.tsx`, `Predictions.tsx`, `Governance.tsx`, `WatchlistExports.tsx`, `WhaleActivity.tsx`, `MarketStructure.tsx`, `AlertConfig.tsx`, `Correlations.tsx`, `CommunitySentiment.tsx`, `ProtocolComparison.tsx`, `RiskDashboard.tsx`, `YieldIntelligence.tsx`

Each page changes from:
```
<TierGate><Layout>...</Layout></TierGate>
```
to:
```
<Layout><TierGate>...</TierGate></Layout>
```

## Issue 2: CoinGecko 503 Still Spamming Console

The fallback logic exists but `fetchFromCoinGeckoProxy` returns `null` on 503 (after logging the error). The `fetchTokenDetails` function already handles this correctly with the DefiLlama fallback. However, the console spam from `fetchFromCoinGeckoProxy` line 19 is noisy.

**Fix**: Downgrade the console.error to console.warn in `fetchFromCoinGeckoProxy` and add a simple in-memory circuit breaker — after 3 consecutive 503s, skip the proxy for 60 seconds.

### Files to modify:
3. **`src/lib/api/coingecko.ts`** — Add circuit breaker to `fetchFromCoinGeckoProxy`

## Issue 3: ProDetailSection Missing Admin Bypass

The `ProDetailSection` component doesn't check for admin status like `TierGate` does, so admins see locked PRO sections on detail pages.

### Files to modify:
4. **`src/components/dashboard/ProDetailSection.tsx`** — Add `isAdmin` check from `useSubscription`

## Implementation Order

| # | Task | Effort |
|---|------|--------|
| 1 | Add "Go Back" button to TierGate UpgradePrompt | Small |
| 2 | Swap Layout/TierGate nesting in 13 pages | Small (mechanical) |
| 3 | Add circuit breaker to CoinGecko proxy calls | Small |
| 4 | Add admin bypass to ProDetailSection | Small |

