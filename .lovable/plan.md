

# Switch from Paddle to NOWPayments (Crypto Payments)

## Overview
Replace all Paddle infrastructure with NOWPayments invoice-based checkout. Users click "Upgrade", we create a NOWPayments invoice via edge function, redirect them to the hosted payment page. A webhook edge function receives IPN callbacks and activates their subscription.

## Architecture

```text
User clicks Upgrade → create-checkout edge fn → NOWPayments POST /v1/invoice
                                                  → returns invoice_url
User is redirected to invoice_url (hosted by NOWPayments)
User pays in crypto → NOWPayments sends IPN → nowpayments-webhook edge fn
                                                → verifies HMAC-SHA512
                                                → upserts subscriptions table
```

## Changes

### 1. Database Migration
- Add columns to `subscriptions` table: `nowpayments_invoice_id text`, `nowpayments_payment_id text`
- Keep `paddle_*` columns for now (no data loss), they'll just be unused

### 2. New Secret Required
- `NOWPAYMENTS_API_KEY` — from NOWPayments dashboard → API Keys
- `NOWPAYMENTS_IPN_SECRET` — from NOWPayments dashboard → IPN Secret (for webhook verification)

### 3. Edge Function: `create-checkout` (rewrite)
- Auth user via `getUser()`
- POST to `https://api.nowpayments.io/v1/invoice` with:
  - `price_amount`: 29 (Pro) or 49 (Pro+)
  - `price_currency`: "usd"
  - `order_id`: `{userId}_{tierKey}_{timestamp}`
  - `order_description`: tier name
  - `ipn_callback_url`: the webhook URL
  - `success_url` / `cancel_url`: back to billing page
- Return `{ invoice_url }` to frontend

### 4. Edge Function: `nowpayments-webhook` (new)
- Verify IPN signature: HMAC-SHA512 with `NOWPAYMENTS_IPN_SECRET`
- On `payment_status === "finished"` or `"confirmed"`:
  - Parse `order_id` to extract `userId` and `tierKey`
  - Upsert `subscriptions` with tier, status "active", period end = +30 days
  - Store `nowpayments_invoice_id` and `nowpayments_payment_id`

### 5. Delete Paddle Edge Functions
- Remove `supabase/functions/paddle-webhook/index.ts`
- Remove `supabase/functions/paddle-portal/index.ts`
- Remove `supabase/functions/paddle-config/index.ts`
- Remove their entries from `supabase/config.toml`

### 6. Frontend: `src/pages/Billing.tsx`
- Remove Paddle.js initialization, `window.Paddle` references
- Remove "Manage Subscription" portal button (NOWPayments has no customer portal)
- `handleUpgrade`: call `create-checkout`, then `window.open(data.invoice_url, "_blank")` or redirect
- Update footer text: "Payments powered by NOWPayments — Pay with 200+ cryptocurrencies"
- Remove Paddle.js script from `index.html`

### 7. Frontend: `src/hooks/useSubscription.ts`
- Remove `paddleSubscriptionId` and `paddleCustomerId` fields
- Add `nowpaymentsInvoiceId` if needed (optional, mainly for display)
- Keep same tier/trial logic

### 8. Privacy page
- Replace "Paddle" references with "NOWPayments"

## Technical Details

**NOWPayments Invoice API:**
```
POST https://api.nowpayments.io/v1/invoice
Headers: x-api-key: {NOWPAYMENTS_API_KEY}
Body: { price_amount, price_currency, order_id, order_description, ipn_callback_url, success_url, cancel_url }
Response: { id, invoice_url, ... }
```

**IPN Webhook Verification:**
- Sort POST body params alphabetically, JSON.stringify, HMAC-SHA512 with IPN secret
- Compare with `x-nowpayments-sig` header

**Webhook URL:** `https://nxlncqmwpjiufsnwkfnd.supabase.co/functions/v1/nowpayments-webhook`

