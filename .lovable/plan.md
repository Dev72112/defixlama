
# Next Steps: Improving Resilience and UX

## Summary

The current implementation is solid, but the OKX API's intermittent availability is causing empty states. This plan focuses on improving resilience with fallback data sources and better UX during API outages.

---

## Part 1: Add DefiLlama as Fallback Data Source

Currently the token list relies 100% on OKX API. When it's unavailable, users see "No tokens found". We should add DefiLlama as a secondary data source.

### 1.1 Create Hybrid Token Hook
**File: `src/hooks/useMultiChainTokens.ts`**

Modify the hook to:
1. Try OKX API first (current behavior)
2. If OKX returns empty/error, fall back to DefiLlama's token list
3. Merge data from both sources when possible

```typescript
// Pseudocode
async function fetchWithFallback(chain) {
  const okxData = await fetchOkxTokenRanking(chain);
  if (okxData.length > 0) return okxData;
  
  // Fallback to DefiLlama prices
  const defiLlamaData = await fetchDefiLlamaTokens(chain);
  return defiLlamaData;
}
```

### 1.2 Add DefiLlama Token Fetching
**File: `src/lib/api/defillama.ts`**

Add functions to fetch token data from DefiLlama's coins API:
- `fetchDefiLlamaTokenPrices(chain, addresses)`
- `fetchDefiLlamaTopTokens(chain)`

DefiLlama endpoints:
- `https://coins.llama.fi/prices/current/{chain}:{address}`
- `https://coins.llama.fi/coins/{chain}` (for discovery)

---

## Part 2: Improve Error States and Loading UX

### 2.1 Better Empty State on Tokens Page
**File: `src/pages/Tokens.tsx`**

Instead of "No tokens found", show:
- A clear message explaining the API is temporarily unavailable
- Last successful data timestamp if cached
- Manual refresh button
- Links to view tokens on other explorers

### 2.2 Add Retry with Exponential Backoff
**File: `src/hooks/useMultiChainTokens.ts`**

Improve React Query retry logic:
- Retry 3 times with exponential backoff (1s, 2s, 4s)
- Show retry count to user
- Allow manual retry

### 2.3 Cache Last Successful Response
**File: `src/hooks/useMultiChainTokens.ts`**

Store successful API responses in localStorage:
- Key: `tokens-cache-{chainId}`
- Value: `{ data, timestamp }`
- Show stale data with "Last updated X ago" badge

---

## Part 3: Fix Global Search Integration

### 3.1 Update GlobalSearch Component
**File: `src/components/GlobalSearch.tsx`**

The global search (Cmd+K) should:
- Use the same `useTokenSearch` hook as TokenSearchInput
- Add fallback to local cached tokens when API fails
- Search through protocols, DEXs, and chains (DefiLlama data) as alternatives

### 3.2 Improve Search Resilience
**File: `src/hooks/useMultiChainTokens.ts`**

For `useTokenSearch`:
- If OKX search fails, filter from cached ranking data
- Add local token list from Supabase `token_listings` table as fallback
- Prioritize showing cached results over empty state

---

## Part 4: Token Detail Page Improvements

### 4.1 Graceful Degradation
**File: `src/pages/TokenDetail.tsx`**

When OKX data is unavailable:
1. Try to get basic price from DefiLlama (`coins.llama.fi`)
2. Show partial data (address, chain, explorer links)
3. Hide chart/holders tabs when data unavailable
4. Show "Data temporarily unavailable" with retry option

### 4.2 Add Price Fallback
**File: `src/hooks/useOkxData.ts`**

Create fallback price fetch:
```typescript
async function getTokenPrice(chain, address) {
  // Try OKX first
  const okxPrice = await fetchOkxTokenPriceInfo(chain, address);
  if (okxPrice) return okxPrice;
  
  // Fallback to DefiLlama
  const llamaPrice = await fetchDefiLlamaPrice(chain, address);
  return llamaPrice;
}
```

---

## Part 5: Reduce API Load

### 5.1 Increase Cache TTL
**File: `src/hooks/useMultiChainTokens.ts`**

Current: 2 minutes
Proposed: 5 minutes for ranking data

This reduces API calls by 60% while maintaining reasonable freshness.

### 5.2 Lazy Load Chains
**File: `src/hooks/useMultiChainTokens.ts`**

For "All Chains" view:
- Start with X Layer only (featured chain)
- Load additional chains on scroll or after initial render
- Show "Loading more chains..." indicator

### 5.3 Prefetch Popular Chains
**File: `src/pages/Tokens.tsx`**

On page load, prefetch top 3 chains (X Layer, Ethereum, Arbitrum) to improve perceived performance.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useMultiChainTokens.ts` | Add fallback logic, increase cache TTL, localStorage caching |
| `src/lib/api/defillama.ts` | Add token price/discovery endpoints |
| `src/pages/Tokens.tsx` | Better empty states, retry UI |
| `src/pages/TokenDetail.tsx` | Graceful degradation, price fallbacks |
| `src/components/GlobalSearch.tsx` | Use cached data as fallback |
| `src/hooks/useOkxData.ts` | Add price fallback to DefiLlama |

---

## Implementation Order

1. **Part 5** - Reduce API load first (quick win)
2. **Part 2** - Improve error states (better UX immediately)
3. **Part 1** - Add DefiLlama fallback (resilience)
4. **Part 3** - Fix global search (feature completion)
5. **Part 4** - Token detail improvements (polish)

---

## Expected Outcomes

1. **Token list always shows data** - Either live OKX data or cached/DefiLlama fallback
2. **Better error messaging** - Users understand when API is down
3. **Reduced API load** - Fewer rate limit errors
4. **Global search works** - Uses cached data when API unavailable
5. **Token details gracefully degrade** - Show what's available, hide what isn't
