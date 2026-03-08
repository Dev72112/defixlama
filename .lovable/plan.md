

# Paddle Integration — Full Plan

## Step 1: Get Your Missing Paddle Values

You need 3 more values from your Paddle dashboard:

### Price IDs (2 values)
1. Go to **Paddle Dashboard → Catalog → Products**
2. Create a product called "DefiXlama Pro" with a **$29/month** recurring price
3. Copy the **Price ID** (starts with `pri_`) — this is your `PADDLE_PRICE_PRO`
4. Create another product "DefiXlama Pro+" with a **$49/month** recurring price
5. Copy that Price ID — this is your `PADDLE_PRICE_PRO_PLUS`

### Webhook Secret (1 value)
1. Go to **Paddle Dashboard → Developer Tools → Notifications**
2. Create a new webhook destination
3. Set the URL to: `https://nxlncqmwpjiufsnwkfnd.supabase.co/functions/v1/paddle-webhook`
4. Select these events: `subscription.created`, `subscription.updated`, `subscription.canceled`, `transaction.completed`
5. Copy the **Webhook Secret Key** — this is your `PADDLE_WEBHOOK_SECRET`

## Step 2: Store All 4 Secrets

Once you have all 4 values, add them via **Cloud View → Advanced → Secrets**:
- `PADDLE_API_KEY`
- `PADDLE_WEBHOOK_SECRET`
- `PADDLE_PRICE_PRO`
- `PADDLE_PRICE_PRO_PLUS`

## Step 3: Implementation (what I'll build once secrets are set)

### Files to create:
1. **`supabase/functions/paddle-webhook/index.ts`** — Receives Paddle events, validates signature, upserts `subscriptions` table with tier/status/period
2. **`supabase/functions/create-checkout/index.ts`** — Authenticated endpoint that calls Paddle API to generate checkout URL for Pro or Pro+

### Files to modify:
3. **`src/hooks/useSubscription.ts`** — Query the `subscriptions` table for active subscription; fall back to trial logic only if no DB row exists
4. **`src/pages/Billing.tsx`** — Wire upgrade buttons to call `create-checkout`, add loading states, show "Manage Subscription" for active subscribers
5. **`supabase/config.toml`** — Add `paddle-webhook` and `create-checkout` function entries

### How it works:
- User clicks "Upgrade to Pro" → frontend calls `create-checkout` edge function → returns Paddle checkout URL → user redirected to Paddle
- After payment, Paddle sends webhook → `paddle-webhook` edge function validates signature → upserts `subscriptions` row with `tier: 'pro'`, `status: 'active'`
- `useSubscription` queries DB on load: active subscription row = use that tier; no row = check trial; trial expired = free
- TierGate already enforces access based on the tier from `useSubscription` — no changes needed there

### Database:
No schema changes needed. The `subscriptions` table already has `paddle_customer_id`, `paddle_subscription_id`, `tier`, `status`, and `current_period_end` columns ready.

---

**Next step**: Create your 2 products + webhook in Paddle, then tell me when you've added all 4 secrets. I'll build everything immediately after.

