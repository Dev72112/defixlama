

# Codebase Audit: Errors, Mock Data, UI Issues & Subscription Fixes

## Issues Found

### 1. Stablecoins CORS Failure (Critical)
The stablecoins API (`stablecoins.llama.fi`) is blocked by CORS in the browser, causing repeated `Failed to fetch` errors every 30s. Unlike other DefiLlama endpoints that work, this subdomain rejects browser requests.

**Fix**: Proxy stablecoin requests through a new edge function (`stablecoins-proxy`) similar to `coingecko-proxy`, or route through the existing `api-gateway`. This eliminates the CORS issue entirely.

### 2. Governance Page — Fabricated Data (Critical)
`Governance.tsx` generates fake governance metrics from TVL data:
- `proposalCount` = `Math.round(200 / tvlRank + tvl / 1e9 * 10)` — completely fabricated
- `activeProposals`, `votingPower`, `participationRate` — all derived from TVL, not real governance data
- `votingHistory` — creates fake "governance events" from TVL changes, with fake dates using `nameHash % 7`

**Fix**: Either connect to a real governance API (Snapshot, Tally) or clearly label this as "TVL-Derived Governance Estimates" with a disclaimer, and remove the fake "Voting History" section entirely.

### 3. Community Sentiment — Fabricated Metrics
`CommunitySentiment.tsx` fabricates `sentimentScore`, `socialActivity`, and `volumeMomentum` from TVL changes. Labels like "Social Activity" and "Community Pulse" imply social media data that doesn't exist.

**Fix**: Rename to "TVL Momentum Analysis" and relabel metrics honestly: "TVL Sentiment" instead of "Community Pulse", remove "Social Activity" label.

### 4. Predictions — Misleading Accuracy Data
`Predictions.tsx` creates an "accuracy" section by comparing `change_7d / 7` to `change_1d` and calling it "Week 1, Week 2…" — this is not historical prediction accuracy but a snapshot comparison of 6 protocols relabeled.

**Fix**: Add clear disclaimers, relabel "Model Accuracy" as "Trend Alignment Score", clarify it's derived from current data not historical predictions.

### 5. CoinGecko Proxy Returns 503 for Many Tokens
Console shows repeated `CoinGecko unavailable for okay-fun, falling back to DefiLlama`. The proxy returns 503 when CoinGecko doesn't recognize a token ID. Currently every 503 is logged as a warning, creating noise.

**Fix**: Suppress warnings for expected CoinGecko 404s. In the proxy, return 404 (not 503) when CoinGecko returns 404 so the client can differentiate "not found" from "service down".

### 6. Billing Page — Trial Card Shows "Full Pro access" but Trial Users Can Browse Pro+ UI
The trial card says "Full Pro access for 7 days" which is correct, but the Billing page tier list shows Trial alongside Pro and Pro+, which could confuse users into thinking trial = Pro+.

**Fix**: Add "(Pro tier only)" clarification on the trial card features and add a note: "Pro+ features remain locked during trial."

### 7. Profile Page — Missing Subscription Details
The Profile page shows basic subscription info but doesn't show:
- Trial days remaining countdown
- What features are included in current tier
- Quick-access links to tier-gated pages the user CAN access

**Fix**: Add a "Your Features" section showing accessible pages with links.

### 8. Subscription Hook — `nowpayments_invoice_id` / `paddle_*` Columns Still in DB
The `subscriptions` table still has legacy columns: `nowpayments_invoice_id`, `nowpayments_payment_id`, `paddle_customer_id`, `paddle_subscription_id`. These are dead weight.

**Fix**: DB migration to drop unused columns (low priority, cosmetic).

### 9. `useUserCurrency` — Geo-IP May Fail Silently
If `ipapi.co/json/` is down or blocked, currency defaults to USD with no indicator to the user that detection failed.

**Fix**: Add a fallback to `navigator.language` for rough country detection (e.g., `en-ZA` → ZAR).

### 10. ExpiryBanner in TierGate — Never Used
`ExpiryBanner` component is defined in `TierGate.tsx` (line 91) but never rendered anywhere.

**Fix**: Wire it up — show ExpiryBanner when `currentPeriodEnd` is within 7 days and user has access.

---

## Implementation Plan

| # | Task | Effort | Files |
|---|------|--------|-------|
| 1 | Proxy stablecoins through edge function to fix CORS | Medium | New edge function + update `defillama.ts` |
| 2 | Fix Governance fake data — relabel + add disclaimers | Small | `Governance.tsx` |
| 3 | Fix CommunitySentiment misleading labels | Small | `CommunitySentiment.tsx` |
| 4 | Fix Predictions misleading accuracy section | Small | `Predictions.tsx` |
| 5 | Fix CoinGecko proxy 503→404 differentiation | Small | `coingecko-proxy/index.ts` + client code |
| 6 | Clarify trial limitations on Billing page | Small | `Billing.tsx` |
| 7 | Enhance Profile page with tier features list | Small | `Profile.tsx` |
| 8 | Wire up ExpiryBanner in TierGate | Small | `TierGate.tsx` |
| 9 | Add `navigator.language` fallback for currency | Small | `useUserCurrency.ts` |
| 10 | Drop legacy DB columns (optional cleanup) | Small | DB migration |

