

# Full Audit Results + WebSocket Integration + Premium Push

## Audit Results: Remaining Issues Found

After auditing every page and component, the codebase is **95% clean**. Here are the remaining issues:

### Fake/Placeholder Data Still Present

1. **`ApiAccess.tsx` lines 47, 72** — Hardcoded fake API key `"dxl_live_xxxxxxxxxxxxxxxxxxxx"`. The `api_keys` table exists in the database but is never queried. The page should generate/fetch a real key from the database or show "Generate your API key" if none exists.

2. **`ApiAccess.tsx` lines 22-31** — Usage chart always shows `requests: 0` for all 30 days. The `api_usage` table exists but is never queried. Should pull real usage data from the database.

3. **`Dashboard.tsx` lines 127-156** — Fee and chain "activities" use synthetic timestamps (`Date.now() / 1000 - i * 60`). These aren't fake data per se, but the timestamps are manufactured since fees/chains from DefiLlama don't come with timestamps. Label should clarify these are "top items" not "recent events."

**All other pages are clean** — no Math.random(), no hardcoded arrays, no mock data remaining.

---

## WebSocket Live Price Integration

The `useLivePrice` and `useLivePrices` hooks exist in `src/hooks/useLivePrice.ts` but are **never imported anywhere**. WebSocket prices are only used by `LivePriceTicker` and `LivePriceIndicator`. The actual Dashboard stat cards and TokenDetail page use polled CoinGecko/DefiLlama data with no real-time updates.

### Plan: Wire WebSocket prices into key components

**Dashboard StatCards** — Add live BTC/ETH prices to a new "Live Prices" row using `useLivePrices`. Show price-flash animations on updates.

**TokenDetail** — For tokens tracked by the WebSocket (BTC, ETH, SOL, etc.), overlay the live price on the header price display using `useLivePrice`, with green/red flash on change.

---

## Push Beyond Premium: New Features

### 1. ApiAccess — Real API Key Management
Connect to the `api_keys` and `api_usage` database tables. Let authenticated users generate, view, and revoke API keys. Show real usage data in the chart.

### 2. Portfolio — Live Price Updates
Wire `useLivePrices` into the Portfolio page so holdings show real-time P&L changes without page refresh.

### 3. Dashboard — Live Market Stats Row
Add a dedicated "Live Market" row with BTC, ETH, SOL prices streaming via WebSocket with price-flash animations directly in StatCards.

---

## File Summary (5 files)

| # | File | Changes |
|---|------|---------|
| 1 | `src/pages/ApiAccess.tsx` | Real API key CRUD from database + real usage chart from `api_usage` table |
| 2 | `src/pages/Dashboard.tsx` | Add live WebSocket price StatCards row with price-flash |
| 3 | `src/pages/TokenDetail.tsx` | Overlay live WebSocket price on header for supported tokens |
| 4 | `src/pages/Portfolio.tsx` | Wire `useLivePrices` for real-time P&L updates |
| 5 | `src/hooks/useApiKeys.ts` | New hook for API key generation, listing, revocation via database |

