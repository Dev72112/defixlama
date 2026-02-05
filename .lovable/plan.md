
# Theme Polish + API Resilience Improvements

## Issues Identified

### Theme Issues
Looking at xlamaexchange.com vs our current Matrix theme, I see significant visual differences:

**xlamaexchange.com features:**
- Clean OLED black background (#0a0a0a or pure black)
- Vibrant neon green primary color (brighter, more saturated)
- Subtle card backgrounds with very slight green tint
- Modern rounded corners with thin borders
- Clean, minimal card designs
- Green glow effects on buttons and interactive elements
- High contrast text

**Our current Matrix theme issues:**
- Green tint on foreground text (makes it look "gloomy")
- Card backgrounds have too much green tint
- Borders are too green, making it look muddy
- Overall visual appears washed out and not premium

### API Issues
OKX API is currently returning:
- Error `50050`: "The Open API service is currently unavailable"
- 404 HTML responses instead of JSON
- Rate limiting `50011` errors

The token detail page shows "Token Not Found" because the API calls fail.

---

## Part 1: Matrix Theme Visual Polish

### 1.1 Update CSS Variables
**File: `src/index.css`**

Key changes to match xlamaexchange.com aesthetic:

```css
[data-theme="matrix"] {
  /* Pure OLED black background */
  --background: 0 0% 0%;
  
  /* White/off-white foreground (NOT green) for readability */
  --foreground: 0 0% 93%;
  
  /* Brighter, more saturated neon green */
  --primary: 142 90% 50%;
  
  /* Near-black cards (NOT green tinted) */
  --card: 0 0% 4%;
  --card-foreground: 0 0% 93%;
  
  /* Neutral muted colors */
  --muted: 0 0% 8%;
  --muted-foreground: 0 0% 55%;
  
  /* Secondary with minimal green */
  --secondary: 0 0% 7%;
  --secondary-foreground: 0 0% 75%;
  
  /* Subtle green borders (NOT overpowering) */
  --border: 142 20% 15%;
  
  /* Keep popover neutral */
  --popover: 0 0% 5%;
  --popover-foreground: 0 0% 93%;
}
```

### 1.2 Add Green Glow Effects
**File: `src/index.css`**

Add matrix-specific glow classes:
```css
[data-theme="matrix"] .card-interactive:hover {
  box-shadow: 0 0 20px hsl(142 90% 50% / 0.15);
}

[data-theme="matrix"] .glow-primary {
  box-shadow: 0 0 25px hsl(142 90% 50% / 0.3);
}

[data-theme="matrix"] button[data-variant="default"]:hover {
  box-shadow: 0 0 15px hsl(142 90% 50% / 0.4);
}
```

### 1.3 Update Card Component
**File: `src/components/ui/card.tsx`**

Ensure cards look good in Matrix theme with subtle border glow on hover.

---

## Part 2: Token Detail Page Resilience

### 2.1 Add DefiLlama Price Fallback
**File: `src/hooks/useMultiChainTokens.ts`**

When `useTokenByAddress` fails to find the token via OKX, fallback to DefiLlama:
- Try to fetch price from `coins.llama.fi/prices/current/{chain}:{address}`
- Return partial data (price, name from chain mapping)

### 2.2 Improve Token Detail Error State
**File: `src/pages/TokenDetail.tsx`**

When OKX data unavailable but we have the address:
- Show partial info (address, chain badge, explorer link)
- Display "Price data temporarily unavailable" message
- Hide chart/holders/trades tabs when no data
- Show a "Refresh" button that re-fetches

### 2.3 Add Chain-Specific DefiLlama Mapping
**File: `src/lib/api/defillama.ts`**

Add mapping for chain IDs to DefiLlama chain names:
```typescript
const CHAIN_ID_TO_LLAMA: Record<string, string> = {
  '196': 'xlayer',
  '1': 'ethereum',
  '56': 'bsc',
  '42161': 'arbitrum',
  '8453': 'base',
  '10': 'optimism',
  '137': 'polygon',
};
```

---

## Part 3: Edge Function Improvements

### 3.1 Better API Unavailable Handling
**File: `supabase/functions/okx-proxy/index.ts`**

Improve handling of `50050` errors:
- Return a clear structured response
- Include `isApiUnavailable: true` flag
- Cache this state briefly to prevent repeated failing calls

### 3.2 Stale Cache Priority
When OKX API returns `50050`:
- Extend stale cache TTL to 30 minutes
- Serve stale data with warning header
- Log for monitoring

---

## Part 4: Tokens Page Improvements

### 4.1 Show API Status Banner
**File: `src/pages/Tokens.tsx`**

When API is unavailable:
- Show a subtle banner: "Live data temporarily unavailable. Showing cached data."
- Display last update timestamp
- Keep showing cached/fallback tokens

### 4.2 Improve Empty State
Better messaging when no tokens available:
- "Token data is currently being refreshed"
- Auto-retry mechanism
- Link to DefiLlama as alternative

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | Update Matrix theme colors - neutral foreground, brighter green primary, subtle borders |
| `src/hooks/useMultiChainTokens.ts` | Add DefiLlama fallback for token lookup |
| `src/lib/api/defillama.ts` | Add chain ID to DefiLlama name mapping, single token price fetch |
| `src/pages/TokenDetail.tsx` | Graceful degradation when OKX unavailable |
| `src/pages/Tokens.tsx` | API status banner, better empty states |
| `supabase/functions/okx-proxy/index.ts` | Better 50050 handling, extended stale cache |

---

## Visual Comparison

**Current Matrix (issues):**
- Green-tinted text = hard to read
- Green cards = looks muddy
- Low contrast = "gloomy"

**Proposed Matrix (matches xlamaexchange):**
- White/neutral text = clean, readable
- Near-black cards = premium OLED look
- Bright green accents = vibrant, modern
- Subtle green borders = elegant
- Green glow effects = interactive feedback

---

## Expected Outcomes

1. **Matrix theme looks premium** - Matches xlamaexchange.com aesthetic
2. **Token pages work even with API issues** - DefiLlama fallback provides price data
3. **Better user feedback** - Clear messaging when data is unavailable
4. **More resilient architecture** - Stale cache, multiple fallbacks
