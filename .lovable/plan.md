

# Fix Subscription Flash + Continue Plan

## Problem: Paywall Flash on Premium Pages

**Root cause**: `useAuth()` is a plain hook with local state — every component calling it creates an independent copy. When `useSubscription()` calls `useAuth()`, it gets its own `isAdmin = false` initially. The admin check is async, so the sequence is:

1. Page loads → `useAuth()` in `useSubscription` starts with `isAdmin = false`
2. `useSubscription` sees user + not admin → queries DB → returns `tier: "free"` → `isLoading: false`
3. `TierGate` renders the paywall
4. Meanwhile, the admin check completes → `isAdmin = true`
5. `useSubscription` re-runs → now returns `tier: "pro_plus"`
6. Paywall disappears — but the user already saw it flash

Additionally, `adminLoading` is never checked by `useSubscription`, so it doesn't wait for the admin check to finish.

## Fix: Shared Auth Context + Loading Gate

### Step 1: Create AuthContext Provider (new file)
- Move all auth logic from `useAuth` hook into a React Context (`AuthProvider`)
- Single source of truth — every component shares the same `user`, `isAdmin`, `adminLoading` state
- Export `useAuth()` as a context consumer hook
- Wrap the app in `<AuthProvider>` in `App.tsx`

### Step 2: Fix useSubscription to wait for admin check
- Add `adminLoading` to the destructured values from `useAuth()`
- Keep `isLoading: true` while `adminLoading` is still true (don't resolve to "free" prematurely)
- This prevents the paywall from rendering before the admin check completes

### Step 3: TierGate silent loading
- Already returns `null` when `isLoading` — this will now work correctly because `isLoading` stays true until admin status is resolved
- No visual change needed, just the timing fix

## Files to modify

1. **New: `src/contexts/AuthContext.tsx`** — AuthProvider with shared state, auth listener, admin check
2. **`src/hooks/useAuth.ts`** — Reduce to thin re-export from AuthContext
3. **`src/App.tsx`** — Wrap in `<AuthProvider>`
4. **`src/hooks/useSubscription.ts`** — Wait for `adminLoading` before resolving state

## Remaining plan phases (after fix)

5. **Phase 3: Pro page tab standardization** — Already done for Backtester, YieldIntelligence, WhaleActivity
6. **Phase 5: Mobile polish** — Optimize stat card grids and chart heights for small screens
7. **Phase 6: Cross-selling** — Add "Related Pro Features" suggestions on free pages

