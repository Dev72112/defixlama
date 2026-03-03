export interface ShortcutDefinition {
  keys: string[];
  description: string;
  category: "navigation" | "action" | "global";
  action?: string; // route path or action name
}

export const SHORTCUT_DEFINITIONS: ShortcutDefinition[] = [
  // Global
  { keys: ["/"], description: "Focus search", category: "global" },
  { keys: ["Escape"], description: "Close modal / Clear search", category: "global" },
  { keys: ["?"], description: "Show keyboard shortcuts", category: "global" },

  // Navigation (Alt + number)
  { keys: ["Alt", "1"], description: "Go to Dashboard", category: "navigation", action: "/" },
  { keys: ["Alt", "2"], description: "Go to Protocols", category: "navigation", action: "/protocols" },
  { keys: ["Alt", "3"], description: "Go to Tokens", category: "navigation", action: "/tokens" },
  { keys: ["Alt", "4"], description: "Go to DEXs", category: "navigation", action: "/dexs" },
  { keys: ["Alt", "5"], description: "Go to Yields", category: "navigation", action: "/yields" },

  // Two-key combos (g + key)
  { keys: ["g", "h"], description: "Go to Dashboard", category: "navigation", action: "/" },
  { keys: ["g", "p"], description: "Go to Protocols", category: "navigation", action: "/protocols" },
  { keys: ["g", "t"], description: "Go to Tokens", category: "navigation", action: "/tokens" },
  { keys: ["g", "d"], description: "Go to DEXs", category: "navigation", action: "/dexs" },
  { keys: ["g", "y"], description: "Go to Yields", category: "navigation", action: "/yields" },
  { keys: ["g", "c"], description: "Go to Chains", category: "navigation", action: "/chains" },
  { keys: ["g", "f"], description: "Go to Fees", category: "navigation", action: "/fees" },
  { keys: ["g", "s"], description: "Go to Stablecoins", category: "navigation", action: "/stablecoins" },
];

export function getAllShortcuts(): ShortcutDefinition[] {
  return SHORTCUT_DEFINITIONS;
}

export function getShortcutsByCategory(category: ShortcutDefinition["category"]): ShortcutDefinition[] {
  return SHORTCUT_DEFINITIONS.filter((s) => s.category === category);
}

export function formatKeys(keys: string[]): string {
  return keys
    .map((k) => {
      switch (k) {
        case "Alt": return "⌥";
        case "Ctrl": return "⌃";
        case "Meta": return "⌘";
        case "Shift": return "⇧";
        case "Escape": return "Esc";
        default: return k.toUpperCase();
      }
    })
    .join(" + ");
}

/** Two-key combo state tracker */
export class ComboTracker {
  private pendingKey: string | null = null;
  private timeout: ReturnType<typeof setTimeout> | null = null;
  private readonly comboWindow = 500; // ms

  /** Returns matched shortcut action path or null */
  handleKey(key: string): string | null {
    const comboShortcuts = SHORTCUT_DEFINITIONS.filter((s) => s.keys.length === 2 && s.keys[0] !== "Alt");

    if (this.pendingKey) {
      const combo = comboShortcuts.find((s) => s.keys[0] === this.pendingKey && s.keys[1] === key);
      this.reset();
      return combo?.action || null;
    }

    if (comboShortcuts.some((s) => s.keys[0] === key)) {
      this.pendingKey = key;
      this.timeout = setTimeout(() => this.reset(), this.comboWindow);
      return null;
    }

    return null;
  }

  reset() {
    this.pendingKey = null;
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }
}
