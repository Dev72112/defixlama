

# Yoco Payment Integration + Country-Based Currency Display

## Overview
Replace NOWPayments crypto checkout with Yoco (South African payment gateway) supporting both test and live modes. Add country detection to display prices in the user's local currency (ZAR for South Africa, USD otherwise) with live conversion rates.

## 1. Yoco Checkout Edge Function

**New file: `supabase/functions/yoco-checkout/index.ts`**

- Accept `tierKey` and `mode` (test/live) from the client
- Use `TEST_SECRET_KEY` or `LIVE_SECRET_KEY` based on mode
- POST to `https://payments.yoco.com/api/checkouts` with:
  - `amount` in cents (trial: 100, pro: 2900, pro_plus: 4900)
  - `currency: "ZAR"` 
  - `successUrl` and `cancelUrl` pointing to `/billing?status=success`
  - `metadata` with `userId`, `tierKey`
- Write pending subscription record (same pattern as existing `create-checkout`)
- Return `redirectUrl` for the client to redirect to

## 2. Yoco Webhook Edge Function

**New file: `supabase/functions/yoco-webhook/index.ts`**

- Accepts `checkout.completed` events from Yoco
- Verify webhook signature using the `webhook-id`, `webhook-timestamp`, and `webhook-signature` headers with HMAC-SHA256 + base64 (Yoco's `whsec_` prefixed secret)
- Uses two secrets: `YOCO_WEBHOOK_SECRET_TEST` and `YOCO_WEBHOOK_SECRET_LIVE` — you'll add these after creating webhooks in Yoco dashboard
- The webhook URL will be: `https://nxlncqmwpjiufsnwkfnd.supabase.co/functions/v1/yoco-webhook`
- Parse `clientReferenceId` (format: `{userId}_{tierKey}_{timestamp}`) to extract user and tier
- Activate subscription (same logic as existing `nowpayments-webhook`)

## 3. Test/Live Mode Toggle in Sidebar

**Modify: `src/components/layout/Sidebar.tsx`**

- Add a small toggle at the bottom of the sidebar (only visible to admins)
- Stores mode in localStorage: `defiXlama_paymentMode` (`test` | `live`)
- Visual indicator: green dot for live, orange for test

## 4. Billing Page Updates

**Modify: `src/pages/Billing.tsx`**

- Read payment mode from localStorage
- Pass `mode` to the new `yoco-checkout` function instead of `create-checkout`
- Show test/live badge on billing page for admins
- Display prices in user's detected currency (ZAR or USD)
- Update footer text from "NOWPayments" to "Yoco"

## 5. Country Detection + Currency Context

**New file: `src/hooks/useUserCurrency.ts`**

- On mount, call a free geo-IP API (e.g., `https://ipapi.co/json/` or `navigator.language` fallback)
- Detect if user is in South Africa → `ZAR`, otherwise `USD`
- Store detected country in `profiles` table (new `country` column) so it persists
- Fetch live USD→ZAR rate from a free API (e.g., exchangerate-api or similar)
- Export: `{ currency, symbol, rate, convertPrice, country }`

**New file: `src/components/CurrencyPrice.tsx`**

- Reusable component: `<CurrencyPrice usdAmount={29} />`
- If user currency is ZAR: shows `R529` (converted at live rate)
- If USD: shows `$29`
- If ZAR user: no secondary currency shown; if non-ZAR: shows `($29 USD)` equivalent

## 6. Database Migration

- Add `country` column to `profiles` table (nullable text, default null)
- This stores the detected country code (e.g., "ZA", "US") for persistence

## 7. Auth Page — Country Detection on Signup

**Modify: `src/pages/Auth.tsx`**

- After successful signup, detect country and save to profile
- Used on subsequent logins to set currency preference without re-detecting

## Files Summary

| # | File | Action |
|---|------|--------|
| 1 | `supabase/functions/yoco-checkout/index.ts` | Create |
| 2 | `supabase/functions/yoco-webhook/index.ts` | Create |
| 3 | `src/hooks/useUserCurrency.ts` | Create |
| 4 | `src/components/CurrencyPrice.tsx` | Create |
| 5 | `src/pages/Billing.tsx` | Update (Yoco + currency display) |
| 6 | `src/components/layout/Sidebar.tsx` | Update (test/live toggle for admins) |
| 7 | `src/pages/Auth.tsx` | Update (country detection on signup) |
| 8 | DB migration | Add `country` column to profiles |

## Webhook URLs for Your Yoco Dashboard

After implementation, create webhooks in your Yoco dashboard pointing to:
```
https://nxlncqmwpjiufsnwkfnd.supabase.co/functions/v1/yoco-webhook
```
Create one for test mode and one for live mode. Save the `whsec_...` secrets — I'll prompt you to add them as `YOCO_WEBHOOK_SECRET_TEST` and `YOCO_WEBHOOK_SECRET_LIVE`.

