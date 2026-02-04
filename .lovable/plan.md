
# Premium Matrix Theme + Token System Overhaul

## Summary

This plan addresses four key areas:
1. **New Default Matrix Theme**: OLED-first with neon green accents, loaded by default for new users
2. **Token Search Fix**: Repair the search functionality that's currently not working
3. **Token List Stability**: Improve OKX API resilience and use dynamic chain support
4. **Token Detail Fallback**: Prevent "Token Not Found" errors for any token

---

## Part 1: Matrix OLED Theme as Default

### 1.1 New Theme System Architecture
**File: `src/components/ThemeToggle.tsx`**

Expand the theme system from 2 modes to 3:
- `bright` - Light mode
- `dark` - Standard dark (current default)
- `matrix` - OLED black + neon green accents (NEW DEFAULT)

Changes:
- Update `useTheme` hook to support `"bright" | "dark" | "matrix"`
- Default to `"matrix"` for first-time visitors
- Update toggle UI to cycle through modes or show a dropdown

### 1.2 Matrix Theme CSS Variables
**File: `src/index.css`**

Add new `[data-theme="matrix"]` selector with:
- True black background: `--background: 0 0% 0%`
- Neon green primary: `--primary: 145 100% 45%` (vibrant matrix green)
- Keep X Layer badge in crimson for brand distinction
- Green glow effects on cards and buttons
- Subtle matrix "rain" background gradient option

Key variable changes for matrix mode:
```css
[data-theme="matrix"] {
  --background: 0 0% 0%;
  --foreground: 145 100% 85%;
  --primary: 145 100% 45%;
  --primary-foreground: 0 0% 0%;
  --accent: 145 80% 50%;
  /* X Layer badge stays crimson */
  --xlayer-crimson: 348 83% 50%;
}
```

### 1.3 Layout Default Theme
**File: `src/components/layout/Layout.tsx`**

Update initial theme detection:
- If no theme in localStorage, default to `"matrix"`
- On first load, set `data-theme="matrix"`

### 1.4 MobileMoreDrawer Theme Options
**File: `src/components/layout/MobileMoreDrawer.tsx`**

Update theme toggle to show three options:
- Light / Dark / Matrix toggle or cycle button

---

## Part 2: Fix Token Search

### 2.1 Root Cause Analysis

The search isn't working because:
1. The OKX API is returning 429 (rate limit) errors
2. Name/symbol search relies on ranking data which may be empty
3. Address search needs better chain detection

### 2.2 Enhanced Token Search Logic
**File: `src/hooks/useMultiChainTokens.ts`**

Improve `useTokenSearch`:
- Add OKX token search endpoint as primary source (`/api/v6/dex/token/search`)
- Fall back to ranking data filter if search endpoint fails
- For address lookups, try all chains in parallel with proper error handling
- Add debouncing to prevent rapid API calls

```typescript
// New approach for name/symbol search
export async function searchTokens(query: string, chains: string[]) {
  // Primary: Use OKX search endpoint
  const searchResults = await fetchOkxTokenSearch(query);
  if (searchResults.length > 0) return searchResults;
  
  // Fallback: Filter from cached ranking data
  // ...existing filter logic
}
```

### 2.3 Add OKX Token Search Integration
**File: `src/lib/api/okx.ts`**

The `fetchOkxTokenSearch` function already exists - verify it's being used and add to the search hook.

### 2.4 Search Input Improvements
**File: `src/components/TokenSearchInput.tsx`**

Add:
- Debounce input (300ms delay)
- Show loading state while searching
- Better error messaging when API fails
- Direct navigation option for contract addresses

---

## Part 3: Stable Token List with Dynamic OKX Chains

### 3.1 Dynamic Chain Discovery
**File: `src/hooks/useMultiChainTokens.ts`**

Replace hardcoded `AGGREGATE_CHAINS` with dynamic OKX-supported chains:

```typescript
// Instead of hardcoded:
const AGGREGATE_CHAINS = ['196', '1', '56', ...];

// Use OKX supported chains API
const { data: supportedChains } = useOkxSupportedChains();
const chainsToQuery = supportedChains?.map(c => c.chainIndex) || FALLBACK_CHAINS;
```

### 3.2 Rate Limit Handling
**File: `src/hooks/useMultiChainTokens.ts`**

Improve resilience:
- Reduce parallel requests (fetch chains sequentially or in smaller batches)
- Increase staleTime to reduce refetch frequency
- Add retry logic with exponential backoff
- Use cached data when fresh data unavailable

### 3.3 Tokens Page Fallback
**File: `src/pages/Tokens.tsx`**

When OKX returns empty/error:
- Show cached tokens from localStorage
- Display "Data temporarily unavailable" message
- Add manual retry button
- Consider DefiLlama as secondary data source

---

## Part 4: Token Detail Page Resilience

### 4.1 Enhanced Token Lookup
**File: `src/hooks/useMultiChainTokens.ts`**

Improve `useTokenByAddress`:
- Try provided chain first (from URL param)
- Then try X Layer (featured chain)
- Then try all OKX-supported chains in parallel
- Cache successful lookups

### 4.2 Detail Page Fallback Chain
**File: `src/pages/TokenDetail.tsx`**

Add logic:
- If URL has `?chain=` param, use it directly
- If token not found on specified chain, try others
- Show "Token found on [chain]" message if discovered elsewhere
- Link to explorer even if price data unavailable

### 4.3 Error State Improvements
**File: `src/pages/TokenDetail.tsx`**

Instead of "Token Not Found":
- Show partial data if available (address, basic info)
- Offer "Try other chains" button
- Link directly to block explorer
- Show recent search history for quick navigation

---

## Files to Create

| File | Purpose |
|------|---------|
| None | All changes are modifications |

## Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | Add matrix theme variables with neon green |
| `src/components/ThemeToggle.tsx` | Support 3 themes, default to matrix |
| `src/components/layout/Layout.tsx` | Default theme initialization |
| `src/components/layout/MobileMoreDrawer.tsx` | Theme cycle button |
| `src/hooks/useMultiChainTokens.ts` | Dynamic chains, better search, resilience |
| `src/components/TokenSearchInput.tsx` | Debounce, error handling |
| `src/pages/Tokens.tsx` | Fallback states, retry logic |
| `src/pages/TokenDetail.tsx` | Better error handling, chain fallback |
| `src/lib/api/okx.ts` | Verify search endpoint integration |

---

## Technical Implementation Details

### Matrix Theme Color Palette
```
Background: #000000 (true black)
Foreground: #00ff7f (spring green text)
Primary: #00e676 (matrix green)
Muted: #0a1a0a (very dark green tint)
Card: #050505 (near black)
Border: #0f2f0f (dark green border)
X Layer Badge: #dc143c (crimson - unchanged)
```

### Rate Limit Mitigation Strategy
```typescript
// Sequential chain fetching with delay
async function fetchAllChainTokens(chains: string[]) {
  const results = [];
  for (const chain of chains) {
    try {
      const data = await fetchOkxTokenRanking(chain, 'volume24h', 'desc', 15);
      results.push(...data);
      await delay(100); // 100ms between requests
    } catch (e) {
      console.warn(`Chain ${chain} failed, skipping`);
    }
  }
  return results;
}
```

### Search Debounce Pattern
```typescript
const debouncedQuery = useDebounce(query, 300);
const { data: results } = useTokenSearch(debouncedQuery, chainIndex, debouncedQuery.length >= 2);
```

---

## Expected Outcomes

1. **Matrix Theme Default**: New users see premium OLED + neon green aesthetic immediately
2. **Working Search**: Token search by name, symbol, and address works reliably
3. **Stable Token Lists**: Tokens display even during OKX rate limiting
4. **Reliable Details**: Token detail pages work for any valid contract address
5. **X Layer Highlight**: X Layer entities retain crimson distinction in all themes
