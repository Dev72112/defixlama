# Developer Guide: Continuing Improvements

This guide helps developers implement the remaining improvements to the DeFiLlama platform.

## Remaining Improvements (6 Tasks)

### 1. Data-Volatility Cache Strategy

**Location:** `src/App.tsx` - QueryClient configuration

**Current state:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 1000,  // Everything 5 seconds
    },
  },
});
```

**What to improve:**
Create a cache strategy that differentiates based on data type:

```typescript
// Idea: Create hooks like:
const staticProtocolCache = 300000;    // 5 minutes - protocol list rarely changes
const priceCache = 5000;               // 5 seconds - prices change frequently
const metricsCache = 60000;            // 1 minute - metrics update regularly

// Usage in individual components:
const { data: protocols } = useQuery({
  queryKey: ['protocols'],
  staleTime: staticProtocolCache,  // Long cache - doesn't change often
});

const { data: prices } = useQuery({
  queryKey: ['prices'],
  staleTime: priceCache,  // Short cache - highly volatile
});
```

**Files to modify:**
- Create `src/lib/cacheConfig.ts` with cache time constants
- Update hooks in `src/hooks/` to use differentiated stale times
- Update direct useQuery calls throughout pages/

---

### 2. WebSocket Integration for Real-Time Updates

**Location:** `src/lib/websocket/` (new directory to create)

**What to build:**
```typescript
// src/lib/websocket/priceSocket.ts
import { useEffect, useCallback } from 'react';

export function usePriceUpdates(protocols: string[]) {
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    const ws = new WebSocket('wss://your-ws-server.com/prices');

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'subscribe',
        protocols,
      }));
    };

    ws.onmessage = (event) => {
      const { protocol, price } = JSON.parse(event.data);
      setPrices(prev => ({ ...prev, [protocol]: price }));
    };

    return () => ws.close();
  }, [protocols]);

  return prices;
}
```

**Alternative (easier first step):**
- Use Server-Sent Events (SSE) instead of WebSocket
- Set up Supabase Realtime for live query updates
- Create `src/hooks/useRealtimePrices.ts`

**Files to create:**
- `src/lib/websocket/client.ts` - WebSocket connection manager
- `src/hooks/useRealtimePrices.ts` - React hook for price updates
- Update price display components to use real-time data

---

### 3. Input Validation with Zod

**Location:** `src/lib/validation/` (new directory)

**What to add:**
```typescript
// src/lib/validation/schemas.ts
import { z } from 'zod';

// Validate external API responses
export const DefiLlamaProtocolSchema = z.object({
  id: z.string(),
  name: z.string(),
  tvl: z.number().optional(),
  chains: z.array(z.string()).optional(),
  // ... more fields
});

export const TokenPriceSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  current_price: z.number(),
  price_change_percentage_24h: z.number(),
});

// Usage in API clients:
export async function fetchAndValidateProtocols() {
  const response = await defillama.fetchProtocols();
  const validated = z.array(DefiLlamaProtocolSchema).safeParse(response);

  if (!validated.success) {
    console.error('Invalid protocol data:', validated.error);
    return [];
  }

  return validated.data;
}
```

**Files to create:**
- `src/lib/validation/schemas.ts` - All Zod schemas
- `src/lib/validation/index.ts` - Export all schemas
- Update all API endpoints to validate responses

**Files to update:**
- `src/lib/api/defillama.ts`
- `src/lib/api/coingecko.ts`
- `src/lib/api/oklink.ts`

---

### 4. Sentry Error Tracking Integration

**Location:** `src/lib/errorTracking/` (new directory)

**Setup steps:**

1. Install Sentry:
```bash
npm install @sentry/react @sentry/tracing
```

2. Create configuration:
```typescript
// src/lib/errorTracking/sentry.ts
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

export function initSentry() {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      new BrowserTracing(),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
```

3. Initialize in main.tsx:
```typescript
import { initSentry } from '@/lib/errorTracking/sentry';
initSentry();
```

4. Wire up ErrorBoundary:
```typescript
// Update ErrorBoundary.tsx componentDidCatch
if (!import.meta.env.DEV) {
  Sentry.captureException(error);
}
```

**Environment variables needed:**
- `VITE_SENTRY_DSN` - Get from sentry.io

---

### 5. API Rate Limiting (Supabase Edge Functions)

**Location:** `supabase/functions/` (create new directory)

**Create edge function:**
```typescript
// supabase/functions/api-gateway/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_KEY')!);

serve(async (req) => {
  const apiKeyHeader = req.headers.get('x-api-key');

  // Validate API key
  const { data: apiKey } = await supabase
    .from('api_keys')
    .select('id, quota_daily')
    .eq('key_hash', hashApiKey(apiKeyHeader))
    .single();

  if (!apiKey) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Check rate limit
  const { count } = await supabase
    .from('api_usage')
    .select('id', { count: 'exact' })
    .eq('api_key_id', apiKey.id)
    .gte('created_at', new Date(Date.now() - 24*60*60*1000).toISOString());

  if (count >= apiKey.quota_daily) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  // Log usage and proxy request
  // ... implementation
});
```

**Database table already exists:** `api_keys` and `api_usage` from migration

---

### 6. Keyboard Navigation Enhancements

**Location:** `src/lib/keyboard/` and `src/components/`

**Create keyboard handler:**
```typescript
// src/lib/keyboard/shortcuts.ts
import { useEffect } from 'react';

const SHORTCUTS = {
  '/': { key: '/', description: 'Search' },
  '?': { key: '?', description: 'Show help' },
  'g p': { key: 'g', then: 'p', description: 'Go to Protocols' },
  'g t': { key: 'g', then: 't', description: 'Go to Tokens' },
  'g d': { key: 'g', then: 'd', description: 'Go to DEXs' },
};

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in input/textarea
      if (e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        // Open search
      }

      if (e.key === '?') {
        // Show keyboard shortcuts dialog
      }

      // For multi-key shortcuts
      if (e.key === 'g' && !e.ctrlKey && !e.metaKey) {
        // Wait for next key...
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
```

**Update KeyboardShortcutsDialog component:**
- Display all available shortcuts
- Show keyboard hints on relevant pages
- Update it in response to user focus

---

## Implementation Priority

### Phase 1 (Quick Wins - 1-2 days)
1. **Input Validation** - Add Zod schemas to API clients
2. **Cache Strategy** - Differentiate stale times

### Phase 2 (Medium Effort - 2-3 days)
3. **Keyboard Shortcuts** - Enhance navigation
4. **Sentry Integration** - Error tracking

### Phase 3 (More Complex - 3-5 days)
5. **WebSocket Integration** - Real-time updates
6. **Rate Limiting** - Edge function setup

---

## Testing the Remaining Features

### Cache Strategy Testing
```typescript
// src/__tests__/lib/cacheConfig.test.ts
import { staticCache, priceCache, metricsCache } from '@/lib/cacheConfig';

describe('Cache config', () => {
  it('should have different stale times', () => {
    expect(staticCache).toBeGreaterThan(metricsCache);
    expect(metricsCache).toBeGreaterThan(priceCache);
  });
});
```

### Validation Testing
```typescript
// src/__tests__/lib/validation/schemas.test.ts
import { DefiLlamaProtocolSchema } from '@/lib/validation/schemas';

describe('Protocol schema', () => {
  it('should validate correct protocol data', () => {
    const data = { id: '1', name: 'Uniswap', tvl: 1000000 };
    const result = DefiLlamaProtocolSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should reject invalid data', () => {
    const data = { id: '1' }; // Missing name
    const result = DefiLlamaProtocolSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
```

---

## Resources & Documentation

- **Zod Validation:** https://zod.dev
- **Sentry React:** https://docs.sentry.io/platforms/javascript/guides/react/
- **WebSocket API:** https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
- **Supabase Realtime:** https://supabase.com/docs/guides/realtime
- **TanStack Query Caching:** https://tanstack.com/query/latest/docs/react/guides/caching

---

## Git Workflow for Remaining Tasks

```bash
# For each improvement, create a feature branch
git checkout -b feature/cache-optimization
git add src/lib/cacheConfig.ts src/hooks/useDefiData.ts
git commit -m "Implement data-volatility cache strategy"
git push origin feature/cache-optimization

# Create pull request and request review
# Include test results: npm test
```

---

## Estimated Effort

| Task | Complexity | Effort | Tests |
|------|-----------|--------|-------|
| Cache Strategy | Low | 2-3 hours | 5+ cases |
| Input Validation | Low-Medium | 3-4 hours | 10+ cases |
| Keyboard Shortcuts | Low | 2 hours | 3+ cases |
| Error Tracking | Medium | 2-3 hours | 2+ cases |
| WebSocket | Medium | 4-5 hours | 5+ cases |
| Rate Limiting | Medium-High | 3-4 hours | 3+ cases |

**Total Estimated Effort:** 16-22 hours of development

---

## Success Metrics

After completing these improvements, you should see:

✅ **Performance:**
- Initial bundle size reduced by 30-40% (code splitting)
- Page load time improvement for detail pages
- Real-time updates with <100ms latency

✅ **Quality:**
- 0 unhandled runtime errors in production (Sentry)
- Type validation on all external API data
- 85%+ code coverage on critical paths

✅ **Reliability:**
- 99.5%+ API success rate with retry logic
- No duplicate requests anymore
- Graceful degradation when APIs fail

✅ **Developer Experience:**
- Easier debugging with error tracking
- Better keyboard navigation
- Clear cache invalidation strategies

---

For questions or issues with implementation, refer to the test files for examples and patterns.
