

# Paddle.js Overlay Checkout + Customer Portal + E2E Test

## What We're Building

Three things in one pass:

1. **Paddle.js overlay checkout** — Load Paddle.js script, use `Paddle.Checkout.open({ transactionId })` instead of redirecting to a new tab
2. **Customer portal link** — Add a "Manage Subscription" button for active subscribers that opens Paddle's customer portal
3. **E2E test via browser** — Navigate to /billing and click Upgrade to Pro to verify the flow

## File Changes

### 1. `index.html` — Add Paddle.js script
Add `<script src="https://cdn.paddle.com/paddle/v2/paddle.js"></script>` to `<head>`. This loads Paddle's overlay checkout SDK globally.

### 2. `src/pages/Billing.tsx` — Three changes
- **Initialize Paddle.js** on mount: Call `window.Paddle.Setup({ token: clientToken })` (we need the Paddle client-side token, which is different from the API key — it's the public token from Paddle dashboard)
- **Overlay checkout**: When `handleUpgrade` gets back a `transactionId`, call `window.Paddle.Checkout.open({ transactionId })` instead of `window.open(checkoutUrl)`
- **Manage Subscription button**: For active subscribers in the status card, add a button that calls `window.Paddle.Checkout.open({ settings: { allowLogout: false }, customer: { id: paddleCustomerId } })` or links to the Paddle customer portal URL

### 3. `src/hooks/useSubscription.ts` — Expose `paddleCustomerId`
Add `paddleCustomerId` to the returned state so Billing.tsx can use it for the portal link.

### 4. New edge function: `supabase/functions/paddle-portal/index.ts`
- Authenticated endpoint
- Looks up the user's `paddle_customer_id` from `subscriptions` table
- Calls Paddle API `POST /customers/{id}/portal-sessions` to get a portal URL
- Returns the URL for the frontend to open

## Secret Needed
- **PADDLE_CLIENT_TOKEN** — This is the public client-side token from Paddle Dashboard -> Developer Tools -> Authentication. Different from the API key. Required to initialize Paddle.js.

## Implementation Order
1. Add `PADDLE_CLIENT_TOKEN` secret
2. Add Paddle.js to index.html
3. Update useSubscription to expose paddleCustomerId
4. Create paddle-portal edge function
5. Update Billing.tsx with overlay checkout + manage subscription button
6. Test end-to-end via browser

