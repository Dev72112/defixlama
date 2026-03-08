

# Paddle Integration + Premium Infrastructure Push

## Part 1: Paddle Webhook & Checkout Edge Functions

### 1a. `supabase/functions/paddle-webhook/index.ts`
- Receives Paddle webhook events (subscription.created, subscription.updated, subscription.canceled, transaction.completed)
- Validates webhook signature using Paddle's webhook secret
- Updates the `subscriptions` table: sets `paddle_customer_id`, `paddle_subscription_id`, `tier`, `status`, `current_period_end`
- Maps Paddle price IDs to tiers (Pro = one price ID, Pro+ = another)
- No JWT required (public webhook endpoint)

### 1b. `supabase/functions/create-checkout/index.ts`
- Authenticated endpoint (requires JWT via `getClaims`)
- Accepts `{ tierKey: "pro" | "pro_plus" }` in the request body
- Calls Paddle API to generate a checkout transaction URL with the user's email pre-filled and the correct price ID
- Returns the checkout URL for the frontend to redirect to
- Requires secrets: `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, `PADDLE_PRICE_PRO`, `PADDLE_PRICE_PRO_PLUS`

### 1c. Secret setup
- We need 4 secrets added: `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, `PADDLE_PRICE_PRO`, `PADDLE_PRICE_PRO_PLUS`

## Part 2: Upgrade `useSubscription` Hook

Currently the hook only checks trial status from `user.created_at`. Upgrade to:
1. Query the `subscriptions` table for the user's row
2. If a row exists with `status = 'active'` and `current_period_end > now()`, use `tier` from the row
3. If no row or expired, fall back to trial logic (90 days from account creation)
4. If trial also expired, tier = `"free"`

This makes the hook production-ready — it respects real Paddle subscriptions while keeping trial fallback.

## Part 3: Wire Billing Page Buttons to Paddle Checkout

- Pro/Pro+ "Upgrade" buttons call `create-checkout` edge function
- On success, redirect user to the Paddle checkout URL
- Add loading states to buttons during checkout creation
- Show "Manage Subscription" button for active subscribers (links to Paddle customer portal)

## Part 4: Config Updates

- Add `paddle-webhook` and `create-checkout` to `supabase/config.toml` with `verify_jwt = false`

---

## File Summary (6 files)

| # | File | Action |
|---|------|--------|
| 1 | `supabase/functions/paddle-webhook/index.ts` | Create — webhook handler |
| 2 | `supabase/functions/create-checkout/index.ts` | Create — checkout session creator |
| 3 | `src/hooks/useSubscription.ts` | Modify — query subscriptions table |
| 4 | `src/pages/Billing.tsx` | Modify — wire buttons to checkout + manage subscription |
| 5 | `supabase/config.toml` | Modify — add new function entries |

## Secrets Needed

Before implementation, I'll request you to add these 4 secrets:
- **PADDLE_API_KEY** — from your Paddle dashboard → Developer Tools → API Keys
- **PADDLE_WEBHOOK_SECRET** — from Paddle → Notifications → Webhook destination secret
- **PADDLE_PRICE_PRO** — the Paddle Price ID for the $29/mo Pro plan (e.g. `pri_xxxxx`)
- **PADDLE_PRICE_PRO_PLUS** — the Paddle Price ID for the $49/mo Pro+ plan

---

## Technical Notes

- Paddle sandbox mode works fine before verification — checkout sessions will work in test mode
- Webhook endpoint needs to be registered in Paddle dashboard pointing to: `https://nxlncqmwpjiufsnwkfnd.supabase.co/functions/v1/paddle-webhook`
- The `subscriptions` table already has `paddle_customer_id` and `paddle_subscription_id` columns ready

