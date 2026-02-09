
# Fix Remaining Chain-Aware Issues and Mobile Gaps

## Issues Found

### 1. Dashboard: Hardcoded "XLayer" text (line 268)
- `title="XLayer TVL History"` is hardcoded instead of using `selectedChain.name`
- Same for `title="TVL vs Volume Trend"` (not chain-specific but could be)

### 2. Chain Selector missing on mobile
- Header line 64: `<ChainSelector compact className="hidden sm:flex" />` -- the `hidden sm:flex` hides it on screens below 640px
- Fix: Change to always visible, or add it to the BottomNav area / mobile header

### 3. Tokens page not chain-aware
- `useTokenPrices()` fetches global token data (CoinGecko/DefiLlama coins API)
- Token data is not chain-filterable via the same DefiLlama pattern
- Fix: Add chain context and filter displayed tokens by chain when a chain has token listings. For "All Chains", show everything. For specific chains, filter by `token.chain` field where available and keep global tokens (BTC, ETH, etc.) visible

### 4. Activities page not chain-aware
- Line 15: `useDashboardData()` called without chain parameter (defaults to "xlayer")
- Fix: Import `useChain()` and pass `selectedChain.id`

### 5. FeeDetail uses global `useFeesData()` instead of chain-aware
- Line 39: `useFeesData()` returns all fees globally
- This is acceptable since detail pages should resolve across all chains (same pattern as ProtocolDetail/DexDetail)
- No change needed

### 6. Detail pages (Protocol, Dex, Stablecoin, Token, Chain, Fee, Security)
- ProtocolDetail: Uses `useAllProtocols()` -- correct, resolves across all chains
- DexDetail: Uses `useAllDexVolumes()` -- correct
- FeeDetail: Uses `useFeesData()` (global) -- correct for detail resolution
- StablecoinDetail: Uses `useStablecoins()` (global) -- correct
- TokenDetail: Uses `useTokenDetails()` -- correct, multi-source fallback
- ChainDetail: Uses `useChainsTVL()` -- correct, shows any chain
- SecurityDetail: Uses `useAllProtocols()` -- correct
- All detail pages are working as expected

---

## Implementation Plan

### File 1: `src/components/layout/Header.tsx`
- Line 64: Change `className="hidden sm:flex"` to remove the `hidden sm:flex` so ChainSelector is always visible on mobile
- Make it compact on all screen sizes for mobile friendliness

### File 2: `src/pages/Dashboard.tsx`
- Line 268: Replace hardcoded `"XLayer TVL History"` with `{selectedChain.name} TVL History` (or use the chain name dynamically)
- Line 274: Update `"TVL vs Volume Trend"` similarly

### File 3: `src/pages/Tokens.tsx`
- Add `useChain()` context import
- Filter displayed tokens by selected chain when possible (using `token.chain` field for DB listings, community tokens for X Layer)
- Update page title to show selected chain name
- When "All Chains" is selected, show all tokens (current behavior)

### File 4: `src/pages/Activities.tsx`
- Line 15: Import `useChain()` and pass `selectedChain.id` to `useDashboardData(selectedChain.id)`
- Update page title to reflect selected chain

### File 5: `src/pages/Chains.tsx`
- This page is intentionally not chain-aware (it lists ALL chains regardless of selector) -- no change needed

---

## Summary of Changes

| File | Change | Priority |
|------|--------|----------|
| `Header.tsx` | Show ChainSelector on mobile (remove `hidden sm:flex`) | High |
| `Dashboard.tsx` | Replace hardcoded "XLayer" in chart titles with dynamic chain name | High |
| `Tokens.tsx` | Add chain filtering + dynamic title | Medium |
| `Activities.tsx` | Pass chainId to `useDashboardData()` | Medium |

All detail pages are already working correctly with global data resolution.
