

# Fix Chain-Aware Issues Across All Pages

## Problem Summary

1. **Yields page freezes** when "All Chains" is selected -- the DefiLlama yields API returns thousands of pools, overwhelming the browser
2. **Detail pages show "not found"** because they search only X Layer protocols instead of chain-aware data
3. **Multiple pages are not chain-aware** (Dashboard, Tokens, Stablecoins, Fees, Security)

---

## Phase 1: Fix Yields Page Unresponsiveness

**Root cause**: `fetchChainYieldPools("all")` returns ALL ~10,000+ pools from DefiLlama. Rendering all of them in charts and tables crashes the browser.

**Fix in `src/lib/api/defillama.ts`**:
- Cap the returned pools to 500 max for "all" chains (sorted by TVL descending)
- Add `.slice(0, 500)` after sorting by TVL

**Fix in `src/pages/Yields.tsx`**:
- Add pagination (already missing unlike Protocols/Dexs pages)
- Default page size of 20
- Limit chart data to top 20 pools to prevent rendering overload

---

## Phase 2: Fix Detail Pages

### 2.1 ProtocolDetail.tsx (line 39)
- **Problem**: Uses `useXLayerProtocols()` to find protocol -- only searches X Layer
- **Fix**: Replace with `useAllProtocols()` so protocols from any chain can be found
- This ensures clicking any protocol from any chain-filtered list resolves correctly

### 2.2 DexDetail.tsx (lines 29-31)
- **Problem**: Uses `useXLayerDexVolumes()` first, then `useAllDexVolumes()` as fallback -- works but loads two queries unnecessarily
- **Fix**: Already uses `useAllDexVolumes()` as fallback, so this mostly works. Remove the X Layer-first lookup and just use `useAllDexVolumes()` directly for cleaner code

### 2.3 Security.tsx (line 15)
- **Problem**: Uses `useXLayerProtocols()` -- only shows X Layer protocols
- **Fix**: Use `useChainProtocols(chainId)` from `useChain()` context, same pattern as Protocols page

### 2.4 SecurityDetail.tsx (line 22)
- **Problem**: Uses `useAllProtocols()` which works for finding any protocol
- **Status**: Already works -- no change needed

---

## Phase 3: Make Remaining Pages Chain-Aware

### 3.1 Dashboard.tsx
- **Problem**: Uses `useDashboardData()` which is hardcoded to X Layer hooks
- **Fix**: Update `useDashboardData` to accept chainId parameter, or update Dashboard to use `useChainProtocols`, `useChainTVLData`, `useChainDexVolumes`, `useChainYieldPools` based on selected chain
- Keep `XLayerSpotlight` always visible regardless of chain
- Update chart titles to reflect selected chain name

### 3.2 Tokens.tsx
- **Problem**: `useTokenPrices()` is not chain-aware
- **Note**: Token data comes from CoinGecko/DefiLlama coins API which is not chain-filtered the same way. This page will remain global for now since token prices are cross-chain. No change needed.

### 3.3 Stablecoins.tsx (lines 21-35)
- **Problem**: Hardcoded filter for X Layer stablecoins only (`c.toLowerCase() === "xlayer"`)
- **Fix**: Use `useChain()` context and filter by selected chain. When "All Chains", show all major stablecoins without chain filter.

### 3.4 Fees.tsx
- **Problem**: `useFeesData()` returns all fees globally, not filtered by chain
- **Fix**: Add chain-aware fees fetching. DefiLlama supports chain-specific fees endpoint: `https://api.llama.fi/overview/fees/{chain}`. Create `fetchChainFees(chain)` and `useChainFees(chainId)` hook.

---

## Phase 4: Chain-Aware Dashboard

### Dashboard updates:
- Import `useChain()` and use chain-aware hooks for stats
- When a specific chain is selected, show that chain's TVL, protocols, DEX volume, and yield data
- When "All Chains" is selected, show aggregate data (current behavior)
- Update stat card titles to include chain name
- Keep XLayerSpotlight always visible

---

## Technical Details

### Files to modify:

1. **`src/lib/api/defillama.ts`**
   - Cap `fetchChainYieldPools("all")` results to 500
   - Add `fetchChainFees(chain)` function

2. **`src/hooks/useDefiData.ts`**
   - Add `useChainFees(chainId)` hook
   - Update `useDashboardData` to accept optional chainId

3. **`src/pages/Yields.tsx`**
   - Add pagination controls
   - Limit chart input data

4. **`src/pages/ProtocolDetail.tsx`**
   - Change `useXLayerProtocols()` to `useAllProtocols()`

5. **`src/pages/DexDetail.tsx`**
   - Simplify to use only `useAllDexVolumes()`

6. **`src/pages/Security.tsx`**
   - Add `useChain()` context and use `useChainProtocols(chainId)`

7. **`src/pages/Stablecoins.tsx`**
   - Add chain-aware filtering using `useChain()` context

8. **`src/pages/Fees.tsx`**
   - Use new `useChainFees(chainId)` hook

9. **`src/pages/Dashboard.tsx`**
   - Make stats chain-aware using `useChain()` context

### Priority order:
1. Fix Yields crash (critical)
2. Fix ProtocolDetail "not found" (high)
3. Make Security chain-aware (medium)
4. Make Stablecoins chain-aware (medium)
5. Make Fees chain-aware (medium)
6. Make Dashboard chain-aware (medium)
7. Clean up DexDetail (low)

