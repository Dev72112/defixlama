import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface ShortcutConfig {
  onSearch?: () => void;
  onEscape?: () => void;
}

export function useKeyboardShortcuts({ onSearch, onEscape }: ShortcutConfig = {}) {
  const navigate = useNavigate();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Allow Escape in inputs
        if (event.key === "Escape") {
          (target as HTMLInputElement).blur();
          onEscape?.();
        }
        return;
      }

      // Global shortcuts
      switch (event.key) {
        case "/":
          event.preventDefault();
          onSearch?.();
          break;
        case "Escape":
          onEscape?.();
          break;
        case "g":
          // g + key combos for navigation
          break;
        case "h":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            navigate("/");
          }
          break;
        case "1":
          if (event.altKey) {
            event.preventDefault();
            navigate("/");
          }
          break;
        case "2":
          if (event.altKey) {
            event.preventDefault();
            navigate("/protocols");
          }
          break;
        case "3":
          if (event.altKey) {
            event.preventDefault();
            navigate("/tokens");
          }
          break;
        case "4":
          if (event.altKey) {
            event.preventDefault();
            navigate("/dexs");
          }
          break;
        case "5":
          if (event.altKey) {
            event.preventDefault();
            navigate("/yields");
          }
          break;
      }
    },
    [navigate, onSearch, onEscape]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

export const KEYBOARD_SHORTCUTS = [
  { key: "/", description: "Focus search" },
  { key: "Esc", description: "Close modal / Clear search" },
  { key: "Alt + 1", description: "Go to Dashboard" },
  { key: "Alt + 2", description: "Go to Protocols" },
  { key: "Alt + 3", description: "Go to Tokens" },
  { key: "Alt + 4", description: "Go to DEXs" },
  { key: "Alt + 5", description: "Go to Yields" },
];
