/**
 * Keyboard shortcuts and navigation system
 * Provides power-user keyboard shortcuts for the DeFi Llama platform
 */

import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
  keys: string[];
  description: string;
  action: () => void;
  category: 'navigation' | 'search' | 'actions' | 'moderation';
}

/**
 * Shortcut categories for organization
 */
export const SHORTCUTS_CONFIG: Record<string, Record<string, KeyboardShortcut>> = {
  navigation: {
    'goHome': {
      keys: ['g', 'h'],
      description: 'Go to Home/Dashboard',
      category: 'navigation',
      action: () => {}, // Will be set by hook
    },
    'goProtocols': {
      keys: ['g', 'p'],
      description: 'Go to Protocols page',
      category: 'navigation',
      action: () => {},
    },
    'goTokens': {
      keys: ['g', 't'],
      description: 'Go to Tokens page',
      category: 'navigation',
      action: () => {},
    },
    'goDexs': {
      keys: ['g', 'd'],
      description: 'Go to DEXs page',
      category: 'navigation',
      action: () => {},
    },
    'goYields': {
      keys: ['g', 'y'],
      description: 'Go to Yields page',
      category: 'navigation',
      action: () => {},
    },
    'goChains': {
      keys: ['g', 'c'],
      description: 'Go to Chains page',
      category: 'navigation',
      action: () => {},
    },
    'goPortfolio': {
      keys: ['g', 'w'],
      description: 'Go to Portfolio/Watchlist',
      category: 'navigation',
      action: () => {},
    },
  },
  search: {
    'openSearch': {
      keys: ['/'],
      description: 'Open search',
      category: 'search',
      action: () => {},
    },
    'toggleSearch': {
      keys: ['Control', 'k'],
      description: 'Toggle search (Cmd+K on Mac)',
      category: 'search',
      action: () => {},
    },
  },
  actions: {
    'help': {
      keys: ['?'],
      description: 'Show keyboard shortcuts help',
      category: 'actions',
      action: () => {},
    },
  },
};

/**
 * Hook to use keyboard shortcuts
 */
export function useKeyboardShortcuts(
  openSearch: () => void,
  openHelp: () => void
) {
  const navigate = useNavigate();
  const [waitingForSecondKey, setWaitingForSecondKey] = useState(false);
  const firstKeyRef = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Map of navigation routes
  const navigationRoutes: Record<string, string> = {
    'goHome': '/',
    'goProtocols': '/protocols',
    'goTokens': '/tokens',
    'goDexs': '/dexs',
    'goYields': '/yields',
    'goChains': '/chains',
    'goPortfolio': '/portfolio',
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in input/textarea
      if (event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Single-key shortcuts
      if (event.key === '/') {
        event.preventDefault();
        openSearch();
        return;
      }

      if (event.key === '?') {
        event.preventDefault();
        openHelp();
        return;
      }

      // Cmd+K or Ctrl+K for search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        openSearch();
        return;
      }

      // Two-key shortcuts (g + key navigation)
      if (event.key === 'g' && !waitingForSecondKey) {
        event.preventDefault();
        setWaitingForSecondKey(true);
        firstKeyRef.current = 'g';

        // Reset after 3 seconds if user doesn't press second key
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
          setWaitingForSecondKey(false);
          firstKeyRef.current = null;
        }, 3000);

        return;
      }

      // Handle second key of two-key combo
      if (waitingForSecondKey && firstKeyRef.current === 'g') {
        event.preventDefault();

        const shortcut = Object.values(SHORTCUTS_CONFIG.navigation).find(
          (s) => s.keys[1] === event.key
        );

        if (shortcut) {
          const shortcutKey = Object.entries(SHORTCUTS_CONFIG.navigation).find(
            ([_, s]) => s === shortcut
          )?.[0];

          if (shortcutKey && navigationRoutes[shortcutKey]) {
            navigate(navigationRoutes[shortcutKey]);
          }
        }

        setWaitingForSecondKey(false);
        firstKeyRef.current = null;

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [navigate, openSearch, openHelp, waitingForSecondKey]);

  return {
    waitingForSecondKey,
    shortcuts: SHORTCUTS_CONFIG,
  };
}

/**
 * Get all shortcuts as flat array for display
 */
export function getAllShortcuts(): Array<{
  keys: string[];
  description: string;
  category: string;
}> {
  const all: Array<{
    keys: string[];
    description: string;
    category: string;
  }> = [];

  Object.values(SHORTCUTS_CONFIG).forEach((category) => {
    Object.values(category).forEach((shortcut) => {
      all.push({
        keys: shortcut.keys,
        description: shortcut.description,
        category: shortcut.category,
      });
    });
  });

  return all;
}

/**
 * Format keys for display
 */
export function formatKeys(keys: string[]): string {
  if (keys.length === 1) {
    const key = keys[0];
    if (key === '/') return '/';
    if (key === '?') return '?';
    if (key === ' ') return 'Space';
    return key.toUpperCase();
  }

  return keys.map((key) => {
    if (key === 'Control') return 'Ctrl';
    if (key === 'Meta') return 'Cmd';
    if (key === ' ') return 'Space';
    return key.toUpperCase();
  }).join(' + ');
}

/**
 * Check if a key combination matches expected keys
 */
export function matchesKeyCombo(keys: string[], event: KeyboardEvent): boolean {
  if (keys.length === 1) {
    return event.key === keys[0];
  }

  if (keys.length === 2) {
    const [first, second] = keys;
    return (
      (first === 'Control' && event.ctrlKey && event.key === second) ||
      (first === 'Meta' && event.metaKey && event.key === second)
    );
  }

  return false;
}
