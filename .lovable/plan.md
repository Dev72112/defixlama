

# Status Report & Next Steps Plan

## Current State — What's Working

**Payment Infrastructure** — NOWPayments crypto payments are fully operational:
- `create-checkout` edge function generates invoice URLs correctly
- `nowpayments-webhook` is receiving IPN callbacks (confirmed `status=waiting` log for a Pro order)
- Billing page displays correct tiers, amounts, and upgrade buttons
- Webhook signature verification with HMAC-SHA512 is in place
- Subscription activation on `finished`/`confirmed` status works

**Premium Pages** — All built and gated with `TierGate`:
- WhaleActivity, MarketStructure, YieldIntelligence, Correlations, CommunitySentiment, WatchlistExports
- Sidebar shows PRO/PRO+ badges correctly
- 3-month trial logic active for new users

**Core Platform** — Dashboard, protocols, DEXs, yields, tokens, chains, fees, security, portfolio, alerts, API keys all functional.

---

## What to Build Next

### Round 4: Polish, Reliability & Growth Features

**1. Payment Status Auto-Refresh**
After a user pays and returns to the billing page, the subscription status should update automatically. Currently they'd need to refresh manually.
- Add polling on `/billing?status=success` — check subscription table every 5s for 2 minutes
- Show a "Verifying payment..." state while waiting for webhook confirmation

**2. Subscription Expiry Handling**
Since crypto payments are one-time (no auto-renewal), users need reminders and easy re-subscription.
- Add a banner on premium pages when subscription expires within 7 days
- Add a "Renew" button on the billing page for active subscribers approaching expiry
- Edge function for expiry check (or just client-side date comparison)

**3. Detail Page Enhancements** (from Workstream 4 in plan)
These 7 detail pages need advanced sections to justify PRO tier:
- **ProtocolDetail**: Fee revenue section, cross-chain TVL breakdown, competitor comparison
- **DexDetail**: Market share trend, chain coverage, volume efficiency
- **ChainDetail**: Ecosystem composition treemap, growth velocity, top yields
- **TokenDetail**: Market dominance percentage
- **StablecoinDetail**: Peg deviation, chain dominance shift
- **FeeDetail**: Fee efficiency score, category rank
- **SecurityDetail**: Risk score composite, peer comparison

**4. Portfolio Dashboard Completion**
The `usePortfolio` hook exists but the Portfolio page needs visual upgrades:
- Allocation pie chart
- P&L summary cards
- Position management UI improvements

**5. Cleanup & Hardening**
- Remove leftover Paddle secrets (PADDLE_API_KEY, PADDLE_CLIENT_TOKEN, PADDLE_WEBHOOK_SECRET, PADDLE_PRICE_PRO, PADDLE_PRICE_PRO_PLUS) — they're unused
- Fix any hardcoded "XLayer" references in detail pages
- Add error handling for NOWPayments API failures (show user-friendly message)

---

## Recommended Implementation Order

| Priority | Task | Effort |
|----------|------|--------|
| 1 | Payment status auto-refresh on billing page | Small |
| 2 | Subscription expiry banner + renew flow | Small |
| 3 | Detail page enhancements (7 pages) | Large |
| 4 | Portfolio dashboard visual upgrade | Medium |
| 5 | Cleanup unused Paddle secrets & references | Small |

