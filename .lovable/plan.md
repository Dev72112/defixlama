

# Update Subscription Tiers & Payment Provider

## Changes Summary

Update the tier system from `free | pro | enterprise` to `free | pro | pro_plus | enterprise` (enterprise marked as "coming soon"), and replace all Stripe references with Paddle.

## Database Migration

Add `pro_plus` to the `subscription_tier` enum and rename Stripe columns to Paddle:

```sql
ALTER TYPE public.subscription_tier ADD VALUE 'pro_plus' AFTER 'pro';
ALTER TABLE public.subscriptions RENAME COLUMN stripe_customer_id TO paddle_customer_id;
ALTER TABLE public.subscriptions RENAME COLUMN stripe_subscription_id TO paddle_subscription_id;
```

## Files to Update (4)

### 1. `src/hooks/useSubscription.ts`
- Change `SubscriptionTier` type to `"free" | "pro" | "pro_plus" | "enterprise"`
- During trial, set tier to `"pro_plus"` (full access)

### 2. `src/components/TierGate.tsx`
- Update `requiredTier` type to `"pro" | "pro_plus" | "enterprise"`
- Add tier hierarchy logic: `pro_plus` grants access to `pro`-gated features

### 3. `src/pages/Billing.tsx`
- Restructure to 4 tiers in a 2x2 or scrollable grid:
  - **Free** ($0) -- Basic analytics
  - **Pro** ($29/mo) -- Advanced analytics, backtester, risk dashboard, 10k API req/mo
  - **Pro Plus** ($59/mo) -- Everything in Pro + Whale Activity, Yield Intelligence, Market Structure, Correlations, unlimited API
  - **Enterprise** (Coming Soon) -- Custom pricing, white-label, SLA, dedicated support
- Replace Stripe payment note with "Powered by Paddle" and "Payment processing coming soon"
- Mark Enterprise card with a "Coming Soon" badge, disabled CTA

### 4. Database migration
- Add `pro_plus` enum value, rename stripe columns to paddle

## Tier Feature Mapping

| Feature | Free | Pro | Pro Plus | Enterprise |
|---------|------|-----|----------|------------|
| Dashboard, Tokens, Chains, DEXs, Fees, Yields, Stablecoins | Yes | Yes | Yes | Yes |
| Protocols, Security | Yes | Yes | Yes | Yes |
| Backtester, Risk Dashboard, Predictions | No | Yes | Yes | Yes |
| Alert Config, Governance, Protocol Comparison | No | Yes | Yes | Yes |
| Whale Activity, Market Structure, Yield Intelligence | No | No | Yes | Yes |
| Correlations, Community Sentiment, Watchlist Exports | No | No | Yes | Yes |
| API Access (10k/mo) | No | Yes | Yes | Yes |
| API Access (unlimited) | No | No | Yes | Yes |
| White-label, SLA | No | No | No | Yes |

