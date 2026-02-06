
# UI/UX Restructure Plan for defiXlama

## Overview

This plan addresses a comprehensive redesign to match the xlamaexchange.com aesthetic (Matrix theme with true black OLED), restructure the mobile and desktop experience, and expand to support all chains across the platform.

---

## Phase 1: Theme System Overhaul

### Current State
- Theme system only supports "bright" and "dark" themes
- Dark theme uses `220 20% 4%` (dark blue-gray) background, not true black
- No Matrix/OLED theme exists

### Changes Required

**1.1 Add Matrix Theme to CSS Variables** (`src/index.css`)
- Pure black background: `0 0% 0%` (#000000)
- High-contrast off-white foreground: `0 0% 93%`
- Neon green primary: `142 90% 50%`
- Neon green glow effects on interactive elements
- Card backgrounds with subtle elevation: `0 0% 4%`

**1.2 Update ThemeToggle Component** (`src/components/ThemeToggle.tsx`)
- Expand from 2-theme toggle to 3-theme cycle: Bright -> Dark -> Matrix
- Add Matrix icon (terminal/sparkles icon)
- Update localStorage key to handle 3 themes
- Set Matrix as default for new users

**1.3 Add Theme Selector Dropdown**
- Create dropdown menu for explicit theme selection
- Show current theme with visual preview
- Available in Settings area and header

---

## Phase 2: Multi-Chain Architecture

### Current State
- Platform is hardcoded to X Layer only
- No chain selection context or state management
- Data hooks fetch X Layer-specific data only

### Changes Required

**2.1 Create Chain Context** (`src/contexts/ChainContext.tsx`)
- Global context providing selected chain state
- Persist selection to localStorage
- Support "All Chains" aggregate view
- List of supported chains with metadata (name, icon, chainId, color)

**2.2 Supported Chains Configuration** (`src/lib/chains.ts`)
```text
Initial support for DefiLlama-compatible chains:
- X Layer (featured, crimson highlighting)
- Ethereum
- Arbitrum
- Optimism
- Base
- Polygon
- Avalanche
- BSC
- Solana
- Sui
- Fantom
- zkSync Era
- Linea
- Scroll
```

**2.3 Update Data Hooks**
- Parameterize all hooks to accept chain context
- `useDefiData.ts`: Add chain parameter to protocol/TVL/DEX/yield fetches
- `useTokenData.ts`: Support multi-chain token fetching
- Add aggregate "All Chains" data aggregation logic

**2.4 Chain Selector Component** (`src/components/ChainSelector.tsx`)
- Dropdown with chain icons and names
- "All Chains" option at top
- X Layer marked as "Featured"
- Persist selection, available in Header

---

## Phase 3: Mobile-First Restructure

### Current State
- Desktop sidebar hidden on mobile with hamburger menu overlay
- No dedicated mobile navigation pattern
- Touch targets may be undersized

### Changes Required

**3.1 Fixed Bottom Navigation** (`src/components/layout/BottomNav.tsx`)
- 5-tab bottom bar: Home, Tokens, Portfolio, Alerts, More
- Icons with labels, 44px minimum touch targets
- "More" opens slide-up drawer with secondary items
- Safe-area-inset padding for notched devices

**3.2 Mobile Page Headers**
- Simplified header without sidebar toggle
- Chain selector in header
- Search accessible via icon tap

**3.3 Swipe Gestures** (Token Ranking page)
- Horizontal swipe between Gainers/Losers/Volume tabs
- Visual tab indicators
- Touch-optimized table rows with larger tap areas

**3.4 Pull-to-Refresh Enhancement**
- Already exists in Layout, ensure consistent across all pages
- Visual feedback improvements

---

## Phase 4: Desktop Enhancements

### Current State
- Fixed 220px sidebar
- Functional but not collapsible
- No breadcrumb navigation

**4.1 Collapsible Sidebar** (`src/components/layout/Sidebar.tsx`)
- Toggle between expanded (260px) and collapsed (64px) modes
- Icon-only mode when collapsed with tooltips
- Persist collapse state in localStorage
- Smooth transition animations

**4.2 Header Improvements**
- Add breadcrumb navigation for deep pages
- Chain selector prominent placement
- Global command palette already exists (Cmd+K)

**4.3 Dashboard Layout**
- X Layer Spotlight widget (visible regardless of selected chain)
- Chain comparison charts when "All Chains" selected
- Grid layout optimizations for large screens

---

## Phase 5: Visual Design Alignment with xlamaexchange.com

### Design Elements from Reference
- True black background with subtle dark gray cards
- Neon green primary color (#2dd4bf -> brighter green like #00ff66)
- Rounded cards with subtle borders
- Gradient text on headings ("Crypto Exchange Hub" style)
- Feature cards with icon, title, subtitle pattern
- Stats pills with icons (25+ Chains, 900+ Tokens pattern)
- Clean horizontal navigation bar (desktop)

**5.1 Update Component Styling**
- StatCard: Add glow effects on hover for Matrix theme
- Cards: True black with subtle borders, not dark gray backgrounds
- Buttons: Neon green with glow on Matrix theme
- Tables: Higher contrast text on black backgrounds
- Badges: Bright neon colors that pop on black

**5.2 Typography**
- Already using Inter font (matches xlamaexchange.com)
- Ensure proper weight usage (600-700 for headings)
- Gradient text utility for hero sections

**5.3 Animation Polish**
- Glow pulse animations on live indicators
- Smooth hover transitions
- Staggered fade-in for list items

---

## Phase 6: X Layer Spotlight

### Requirement
X Layer remains the featured chain with visual distinction

**6.1 X Layer Spotlight Widget** (`src/components/dashboard/XLayerSpotlight.tsx`)
- Always-visible widget on Dashboard
- Shows X Layer TVL, volume, top protocols
- Crimson accent color (hsl(348 83% 47%))
- "Featured Chain" badge

**6.2 Visual Highlighting**
- Crimson border/badge for X Layer tokens in lists
- "Featured" tag in chain selector
- Special treatment in All Chains aggregate views

---

## Implementation Order

```text
1. Theme System (Phase 1)
   - CSS variables for Matrix theme
   - ThemeToggle upgrade
   - Set Matrix as default
   
2. Multi-Chain Context (Phase 2)
   - ChainContext provider
   - Chains configuration
   - Chain selector component
   
3. Hook Parameterization (Phase 2 continued)
   - Update useDefiData hooks
   - Update useTokenData hooks
   - Aggregate "All Chains" logic
   
4. Mobile Navigation (Phase 3)
   - Bottom navigation bar
   - Mobile-specific headers
   - Touch optimization
   
5. Desktop Enhancements (Phase 4)
   - Collapsible sidebar
   - Breadcrumbs
   
6. Visual Polish (Phase 5)
   - Component styling updates
   - Animation refinements
   
7. X Layer Spotlight (Phase 6)
   - Spotlight widget
   - Visual highlighting system
```

---

## Technical Considerations

### API Strategy
- Continue using DefiLlama as primary data source (stable, free)
- Chain-specific endpoints already available in DefiLlama API
- Token data: Multi-source fallback (DefiLlama -> CoinGecko proxy -> DexScreener)
- No OKX API dependency to avoid previous issues

### Performance
- Lazy load chain-specific data on selection change
- Cache chain data with 5-second stale time (existing pattern)
- Use React.memo for chain selector to prevent unnecessary rerenders

### State Management
- ChainContext for global chain selection
- Keep existing React Query patterns for data fetching
- localStorage persistence for user preferences

---

## Files to Create
- `src/contexts/ChainContext.tsx`
- `src/lib/chains.ts`
- `src/components/ChainSelector.tsx`
- `src/components/layout/BottomNav.tsx`
- `src/components/dashboard/XLayerSpotlight.tsx`

## Files to Modify
- `src/index.css` (Matrix theme variables)
- `src/components/ThemeToggle.tsx` (3-theme support)
- `src/components/layout/Layout.tsx` (mobile bottom nav)
- `src/components/layout/Sidebar.tsx` (collapsible)
- `src/components/layout/Header.tsx` (chain selector, breadcrumbs)
- `src/hooks/useDefiData.ts` (chain parameterization)
- `src/hooks/useTokenData.ts` (chain parameterization)
- `src/pages/Dashboard.tsx` (X Layer spotlight)
- `src/App.tsx` (wrap with ChainProvider)
- Multiple page components (chain-aware data fetching)

