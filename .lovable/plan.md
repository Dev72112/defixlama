

# Next Batch: Trial Downgrade to Pro + Site-Wide Improvements

## 1. Downgrade Trial from Pro+ to Pro Access

The $1 trial currently grants full Pro+ access — users can abuse this to get Whale Activity, Yield Intelligence, etc. for $1. Change trial to grant **Pro tier only**.

### Changes:
- **`src/pages/Billing.tsx`** — Update Trial card features list from "Full Pro+ access" to "Full Pro access for 7 days", remove Pro+ specific features (Whale Activity, Yield Intelligence, Unlimited API). Update description.
- **`src/pages/Billing.tsx`** — Change `TIER_RANK.trial` from `2` to `1` (same as pro). Update the "Trial (Pro+ Access)" label to "Trial (Pro Access)".
- **`src/hooks/useSubscription.ts`** — Line 91: change fallback from `"pro_plus"` to `"pro"` for trialing subscriptions.
- **`supabase/functions/nowpayments-webhook/index.ts`** — Line 108: change trial tier from `"pro_plus"` to `"pro"`.
- **`supabase/functions/create-checkout/index.ts`** — Line 98: change `pendingTier` for trial from `"pro_plus"` to `"pro"`.

## 2. CoinGecko 503 Still Throwing (Not Caught by Circuit Breaker)

Console still shows the error being thrown. The `throw` on line 27 of `coingecko.ts` fires before the circuit breaker catch can downgrade it. The issue is that the `throw` creates an Error that propagates up to React Query which logs it as an error. The circuit breaker is working but the initial 3 failures still spam the console.

### Fix:
- **`src/lib/api/coingecko.ts`** — Change the `throw` to `return null` directly when status is 503, so it never becomes an uncaught error. Only throw for non-503 errors.

## 3. Remaining "XLayer" Branding Cleanup

40 files still reference "XLayer" or "xlayer". The key ones to rename:
- **`src/components/dashboard/XLayerSpotlight.tsx`** — This is a prominent dashboard component. Rename references to "X Layer" (the chain's actual name) but keep data queries working since DefiLlama uses "X Layer" as the chain name.
- **`src/lib/errorTracking/tracking.ts`** — Change `STORAGE_KEY` from `"xlayer-error-log"` to `"defixlama-error-log"`, add migration.
- **`src/hooks/useDefiData.ts`** — The hook names like `useXLayerProtocols` can stay since they're internal, but check if any user-facing strings need updating.

## 4. 404 Page Missing Layout

The NotFound page renders without the app shell (no sidebar/header). Users who hit a bad URL are stranded.

### Fix:
- **`src/pages/NotFound.tsx`** — Wrap in `<Layout>` so users can navigate back.

## Implementation Order

| # | Task | Effort |
|---|------|--------|
| 1 | Downgrade trial to Pro tier (5 files) | Small |
| 2 | Fix CoinGecko 503 throw in proxy fetch | Small |
| 3 | Rename xlayer localStorage + error tracking keys | Small |
| 4 | Wrap 404 page in Layout | Small |

