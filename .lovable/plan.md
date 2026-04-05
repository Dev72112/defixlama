

# Comprehensive Fix & Enhancement Plan

## Issues Identified

### 1. Trial Grants Access to ALL Tiers (Critical Bug)
**Root cause**: In `TierGate.tsx` line 31, `if (isTrialActive) return <>{children}</>` bypasses the `requiredTier` check entirely. Trial users get Pro+ pages (Whale Activity, Yield Intelligence, Market Structure, Correlations, Community Sentiment, Watchlist Exports) for free.

Same bug in `ProDetailSection.tsx` line 27: `isTrialActive` is OR'd into `hasAccess` without checking `requiredTier`.

**Fix**: Change both components to respect the tier hierarchy during trial. Trial sets `tier: "pro"` in `useSubscription`, so remove the blanket `isTrialActive` bypass and let the normal `tierLevel[tier] >= tierLevel[requiredTier]` check handle it. Trial users get Pro features only, Pro+ pages remain locked.

### 2. Stablecoins Page — "Failed to fetch" Errors
The console shows repeated `TypeError: Failed to fetch` for stablecoins. The DefiLlama stablecoins API (`stablecoins.llama.fi/stablecoins?includePrices=true`) is likely being blocked by CORS or rate-limited. The hook retries every 5 seconds (LIVE_REFRESH), hammering the endpoint.

**Fix**: 
- Increase staleTime/refetchInterval for stablecoins to STANDARD_REFRESH (30s) instead of LIVE_REFRESH (5s) — stablecoin data doesn't change every 5 seconds
- Add retry backoff and max retries (3) to prevent infinite hammering
- Add a graceful error state on the Stablecoins page when data fails

### 3. Risk Dashboard — 0 Data / Empty State
The Risk Dashboard fetches from `api.llama.fi/hacks` and `api.llama.fi/protocols` directly. These work but may return empty for certain chain filters. No empty state is shown when data is empty.

**Fix**: Add proper empty states with helpful messaging when no data matches the current chain filter.

### 4. Pro Components Showing 0 Data
Several Pro/Pro+ page components (Whale Activity, Market Structure, Correlations, etc.) use simulated/generated data that may render as "0" or empty. These pages need better empty state handling and clearer "live data" vs "analytics" labeling.

### 5. Documentation Page — Not Built Out
`Docs.tsx` exists but is a placeholder with generic webhook examples. Needs real content about the platform's features, API endpoints, and tier descriptions.

**Fix**: Rebuild the Docs page with proper sections: Platform Overview, Feature Guide by Tier, API Documentation, FAQ, and Changelog (pulling from `update_logs` table).

### 6. Donations Page — Not Built Out  
`Donations.tsx` references `useDonationStats` and `useDonations` hooks that likely return empty data since there's no actual donation tracking in the database.

**Fix**: Simplify to a static donation page with wallet addresses, QR codes, and a thank-you message. Remove the fake stats/leaderboard components that show 0.

### 7. Profile Page — Missing
No profile page exists. Users can't view/edit their display name, country, or see subscription details.

**Fix**: Create a new `/profile` page with:
- Display name editing
- Country/currency display
- Subscription status and history
- Link to Billing page
- Password change via Supabase Auth

---

## Files to Create/Modify

| # | File | Action | Description |
|---|------|--------|-------------|
| 1 | `src/components/TierGate.tsx` | Modify | Remove blanket `isTrialActive` bypass, use tier-level check |
| 2 | `src/components/dashboard/ProDetailSection.tsx` | Modify | Same fix — remove `isTrialActive` from OR chain |
| 3 | `src/hooks/useDefiData.ts` | Modify | Change stablecoins to STANDARD_REFRESH, add retry config |
| 4 | `src/pages/Stablecoins.tsx` | Modify | Better error/empty state handling |
| 5 | `src/pages/RiskDashboard.tsx` | Modify | Add empty state for 0-data scenarios |
| 6 | `src/pages/Docs.tsx` | Rewrite | Real documentation with feature guide, API docs, FAQ |
| 7 | `src/pages/Donations.tsx` | Simplify | Remove fake stats, clean static donation page |
| 8 | `src/pages/Profile.tsx` | Create | New profile page with account management |
| 9 | `src/App.tsx` | Modify | Add `/profile` route |
| 10 | `src/components/UserMenu.tsx` | Modify | Add "Profile" link |

## Implementation Order

| # | Task | Effort |
|---|------|--------|
| 1 | Fix trial tier bypass in TierGate + ProDetailSection | Small |
| 2 | Fix stablecoins fetch (rate limit + error handling) | Small |
| 3 | Add empty states to Risk Dashboard + Pro pages | Small |
| 4 | Rebuild Documentation page | Medium |
| 5 | Clean up Donations page | Small |
| 6 | Create Profile page + route | Medium |

