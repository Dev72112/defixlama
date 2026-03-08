

# Full Site Plan: Cache Fix, Cleanup, Portfolio Upgrade & Bug Fixes

## Priority 1: Fix "Multiple Refreshes Required" Issue

**Root cause**: The service worker (`public/sw.js`) uses a network-first strategy but caches HTML/JS aggressively with a static `CACHE_NAME = 'defixlama-v1'`. When we publish updates, the old service worker serves the cached `index.html` and JS bundles. The user must refresh multiple times to: (1) download the new SW, (2) activate it, (3) finally get fresh assets.

**Fix**:
- Remove the service worker registration from `index.html` entirely, OR
- Update `sw.js` to use a cache-busting version that auto-updates: add a `CACHE_VERSION` timestamp, and on the `activate` event, delete ALL old caches. Also skip caching for navigation requests (HTML) so `index.html` is always fetched fresh from the network.
- Better approach: **unregister the service worker** in `index.html` instead of registering it. Vite already handles asset hashing — the SW is causing more harm than good for a dashboard app that needs fresh data. We keep the PWA manifest for install-ability but remove the caching SW.

### Changes:
1. **`index.html`** — Replace SW register with SW **unregister** (cleans up existing installs)
2. **`public/sw.js`** — Gut the file to a self-unregistering worker (for users who already have it cached)

---

## Priority 2: Fix CoinGecko 503 Errors

Console shows repeated `CoinGecko proxy error: 503`. The proxy edge function is failing but the client just throws, causing broken token detail pages.

### Changes:
3. **`src/lib/api/coingecko.ts`** — In `fetchTokenDetails`, when CoinGecko proxy returns 503, gracefully return partial data from DefiLlama instead of throwing. Add a user-friendly fallback.
4. **`supabase/functions/coingecko-proxy/index.ts`** — Add retry logic and proper 503 handling with cache headers

---

## Priority 3: Fix Sidebar `forwardRef` Warning

Console shows: "Function components cannot be given refs" for Sidebar in Layout.

### Changes:
5. **`src/components/layout/Sidebar.tsx`** — Wrap with `React.forwardRef` or remove the ref usage in Layout

---

## Priority 4: Rename Legacy "xlayer" References

The portfolio localStorage key is still `xlayer-portfolio` and the chain storage key is `xlayer-selected-chain`. These should be migrated to `defixlama-*`.

### Changes:
6. **`src/hooks/usePortfolio.ts`** — Change `STORAGE_KEY` to `defixlama-portfolio`, add migration from old key
7. **`src/contexts/ChainContext.tsx`** — Change `STORAGE_KEY` from `xlayer-selected-chain` to `defixlama-selected-chain`, add migration

---

## Priority 5: Portfolio Page Upgrade

Current portfolio page works but lacks visual polish. Add summary stat cards and improve the allocation view.

### Changes:
8. **`src/pages/Portfolio.tsx`** — Add P&L summary cards at top (total value, total P&L, best performer, worst performer), improve pie chart with percentage labels, add an allocation breakdown table sorted by weight

---

## Priority 6: Update Branding References

`index.html` still has "XLayer DeFi Analytics" in the title and meta descriptions, and old OG URLs pointing to `xlama.lovable.app`.

### Changes:
9. **`index.html`** — Update title to "defiXlama - DeFi Analytics", update meta descriptions, fix canonical URL to `defixlama.lovable.app`

---

## Implementation Order

| # | Task | Effort |
|---|------|--------|
| 1 | Kill service worker (fix refresh issue) | Small |
| 2 | CoinGecko 503 graceful fallback | Small |
| 3 | Fix Sidebar forwardRef warning | Small |
| 4 | Rename xlayer localStorage keys | Small |
| 5 | Portfolio page visual upgrade | Medium |
| 6 | Update branding in index.html | Small |

