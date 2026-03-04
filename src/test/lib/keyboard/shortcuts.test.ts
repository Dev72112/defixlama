import { describe, it, expect } from "vitest";
import { getAllShortcuts, formatKeys, getShortcutsByCategory } from "@/lib/keyboard/shortcuts";

describe("Keyboard Shortcuts", () => {
  it("returns all shortcuts", () => {
    const shortcuts = getAllShortcuts();
    expect(Array.isArray(shortcuts)).toBe(true);
    expect(shortcuts.length).toBeGreaterThan(0);
  });

  it("each shortcut has required fields", () => {
    const shortcuts = getAllShortcuts();
    for (const s of shortcuts) {
      expect(s.keys).toBeDefined();
      expect(s.label).toBeDefined();
      expect(s.category).toBeDefined();
    }
  });

  it("formats key combinations", () => {
    const formatted = formatKeys(["g", "h"]);
    expect(typeof formatted).toBe("string");
    expect(formatted.length).toBeGreaterThan(0);
  });

  it("filters by category", () => {
    const shortcuts = getAllShortcuts();
    const categories = [...new Set(shortcuts.map(s => s.category))];
    if (categories.length > 0) {
      const filtered = getShortcutsByCategory(categories[0]);
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every(s => s.category === categories[0])).toBe(true);
    }
  });

  it("handles empty key array in formatKeys", () => {
    const result = formatKeys([]);
    expect(result).toBe("");
  });

  it("returns unique categories", () => {
    const shortcuts = getAllShortcuts();
    const categories = [...new Set(shortcuts.map(s => s.category))];
    expect(categories.length).toBeGreaterThan(0);
  });
});
