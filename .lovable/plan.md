
# Phase 3-6 Implementation: Mobile Nav, Collapsible Sidebar, Visual Polish, X Layer Spotlight

## Verification Summary
- Phase 1 (Theme System): Working. Matrix/Dark/Bright cycle correctly. Matrix is default with true black and neon green.
- Phase 2 (Multi-Chain): Working. ChainContext, chains config, and ChainSelector are in place. No console errors.

---

## Phase 3: Mobile Bottom Navigation

### 3.1 Create `src/components/layout/BottomNav.tsx`
- Fixed bottom bar visible only on mobile (below `lg` breakpoint)
- 5 tabs: Home (`/`), Tokens (`/tokens`), Portfolio (`/portfolio`), Alerts (`/alerts`), More
- Each tab: icon + small label, 44px min touch target
- "More" tab opens a slide-up drawer (using Vaul's Drawer component already installed) with secondary nav items: Protocols, DEXs, Yields, Stablecoins, Chains, Fees, Security, Settings
- Active tab highlighted with neon green (Matrix) or primary color
- Safe-area padding via `pb-safe` / `env(safe-area-inset-bottom)`

### 3.2 Update `src/components/layout/Layout.tsx`
- Import and render `BottomNav` on mobile
- Add `pb-20` padding to main content on mobile so content isn't hidden behind bottom nav
- Remove hamburger menu button dependency on mobile (bottom nav replaces it)
- Keep sidebar for desktop only

### 3.3 Update `src/components/layout/Header.tsx`
- On mobile: simplify header -- hide menu hamburger button (bottom nav handles navigation)
- Show chain selector on mobile header (remove `hidden sm:flex`)
- Keep search, theme toggle, and essential actions

---

## Phase 4: Collapsible Desktop Sidebar

### 4.1 Update `src/components/layout/Sidebar.tsx`
- Add `collapsed` state (persisted to localStorage key `sidebar-collapsed`)
- Collapsed mode: 64px width, show icons only with tooltips (using existing Tooltip component)
- Expanded mode: 260px width (up from 220px)
- Toggle button at bottom of sidebar (ChevronLeft/ChevronRight icon)
- Smooth CSS transition on width change
- Logo section: show only "dX" icon when collapsed
- "More" section: show icons only when collapsed, no dropdown needed
- External links section: icons only when collapsed

### 4.2 Update `src/components/layout/Layout.tsx`
- Read sidebar collapsed state to adjust `lg:pl-[64px]` vs `lg:pl-[260px]`
- Use a shared context or prop to sync collapsed state between Sidebar and Layout

---

## Phase 5: Visual Polish

### 5.1 Update `src/components/dashboard/StatCard.tsx`
- Add neon glow hover effect when Matrix theme is active (`.dark .matrix` selector or CSS variable check)
- Use `box-shadow: 0 0 15px hsl(var(--primary) / 0.3)` on hover

### 5.2 Update card and table components
- Ensure card backgrounds use `bg-card` (already mapped to near-black in Matrix theme)
- Add subtle border glow on hover for interactive cards
- Tables: ensure text contrast is high on pure black backgrounds

### 5.3 Add CSS utilities to `src/index.css`
- `.glow-card` utility for hover glow effect on cards
- Staggered animation classes for list items if not already present
- Gradient text utilities for hero headings

---

## Phase 6: X Layer Spotlight Widget

### 6.1 Create `src/components/dashboard/XLayerSpotlight.tsx`
- Compact widget showing X Layer-specific metrics regardless of selected chain
- Displays: TVL, 24h Volume, Protocol count, top 3 protocols
- Crimson accent color (`hsl(348 83% 47%)`) for borders and highlights
- "Featured Chain" badge
- Uses `useXLayerTVL()` and `useXLayerProtocols()` hooks (already exist in useDefiData)
- Collapsible/expandable with a small toggle

### 6.2 Update `src/pages/Dashboard.tsx`
- Insert XLayerSpotlight widget below the live price ticker
- Always visible regardless of chain selection

---

## Implementation Order
1. Bottom Navigation (Phase 3) -- creates new file, updates Layout and Header
2. Collapsible Sidebar (Phase 4) -- updates Sidebar and Layout
3. Visual Polish (Phase 5) -- CSS additions and component tweaks
4. X Layer Spotlight (Phase 6) -- new component and Dashboard update

## Files to Create
- `src/components/layout/BottomNav.tsx`
- `src/components/dashboard/XLayerSpotlight.tsx`

## Files to Modify
- `src/components/layout/Layout.tsx` (bottom nav integration, sidebar collapse padding)
- `src/components/layout/Header.tsx` (mobile simplification)
- `src/components/layout/Sidebar.tsx` (collapsible)
- `src/index.css` (glow utilities, safe-area)
- `src/pages/Dashboard.tsx` (X Layer spotlight widget)
- `src/components/dashboard/StatCard.tsx` (glow effects)
