import { describe, it, expect } from 'vitest';
import { formatKeys, getAllShortcuts, matchesKeyCombo, SHORTCUTS_CONFIG } from '@/lib/keyboard/shortcuts';

describe('Keyboard Shortcuts', () => {
  describe('SHORTCUTS_CONFIG structure', () => {
    it('should have navigation shortcuts', () => {
      expect(SHORTCUTS_CONFIG.navigation).toBeDefined();
      expect(Object.keys(SHORTCUTS_CONFIG.navigation).length).toBeGreaterThan(0);
    });

    it('should have search shortcuts', () => {
      expect(SHORTCUTS_CONFIG.search).toBeDefined();
      expect(Object.keys(SHORTCUTS_CONFIG.search).length).toBeGreaterThan(0);
    });

    it('should have action shortcuts', () => {
      expect(SHORTCUTS_CONFIG.actions).toBeDefined();
      expect(Object.keys(SHORTCUTS_CONFIG.actions).length).toBeGreaterThan(0);
    });
  });

  describe('formatKeys utility', () => {
    it('should format single key', () => {
      expect(formatKeys(['/'])).toBe('/');
      expect(formatKeys(['?'])).toBe('?');
    });

    it('should format uppercase letters', () => {
      expect(formatKeys(['g'])).toBe('G');
      expect(formatKeys(['h'])).toBe('H');
    });

    it('should format key combinations', () => {
      expect(formatKeys(['Control', 'k'])).toBe('Ctrl + K');
      expect(formatKeys(['Meta', 'k'])).toBe('Cmd + K');
    });

    it('should handle space key', () => {
      expect(formatKeys([' '])).toBe('Space');
    });
  });

  describe('getAllShortcuts', () => {
    it('should return all shortcuts', () => {
      const all = getAllShortcuts();
      expect(all.length).toBeGreaterThan(0);
    });

    it('should include navigation shortcuts', () => {
      const all = getAllShortcuts();
      const navShortcuts = all.filter((s) => s.category === 'navigation');
      expect(navShortcuts.length).toBeGreaterThan(0);
    });

    it('should have all shortcuts with keys and description', () => {
      const all = getAllShortcuts();
      all.forEach((shortcut) => {
        expect(shortcut.keys).toBeDefined();
        expect(shortcut.keys.length).toBeGreaterThan(0);
        expect(shortcut.description).toBeDefined();
        expect(shortcut.category).toBeDefined();
      });
    });
  });

  describe('matchesKeyCombo', () => {
    it('should match single key combos', () => {
      const event = new KeyboardEvent('keydown', { key: '/' });
      expect(matchesKeyCombo(['/'], event)).toBe(true);
    });

    it('should match Control+Key', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
      });
      expect(matchesKeyCombo(['Control', 'k'], event)).toBe(true);
    });

    it('should match Meta+Key', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
      });
      expect(matchesKeyCombo(['Meta', 'k'], event)).toBe(true);
    });

    it('should not match if ctrlKey is false', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: false,
      });
      expect(matchesKeyCombo(['Control', 'k'], event)).toBe(false);
    });
  });

  describe('Navigation routes', () => {
    it('should have goHome shortcut', () => {
      expect(SHORTCUTS_CONFIG.navigation.goHome).toBeDefined();
      expect(SHORTCUTS_CONFIG.navigation.goHome.keys).toEqual(['g', 'h']);
    });

    it('should have goProtocols shortcut', () => {
      expect(SHORTCUTS_CONFIG.navigation.goProtocols).toBeDefined();
      expect(SHORTCUTS_CONFIG.navigation.goProtocols.keys).toEqual(['g', 'p']);
    });

    it('should have goTokens shortcut', () => {
      expect(SHORTCUTS_CONFIG.navigation.goTokens).toBeDefined();
      expect(SHORTCUTS_CONFIG.navigation.goTokens.keys).toEqual(['g', 't']);
    });
  });

  describe('Search shortcuts', () => {
    it('should have forward slash for search', () => {
      expect(SHORTCUTS_CONFIG.search.openSearch).toBeDefined();
      expect(SHORTCUTS_CONFIG.search.openSearch.keys).toEqual(['/']);
    });

    it('should have Ctrl/Cmd+K for toggle search', () => {
      expect(SHORTCUTS_CONFIG.search.toggleSearch).toBeDefined();
    });
  });
});
