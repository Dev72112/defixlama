import { Search, Moon, Sun, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { WatchlistPanel } from "@/components/WatchlistPanel";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcutsDialog";
import { GlobalSearch } from "@/components/GlobalSearch";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [theme, setTheme] = useState<string>(() => {
    try {
      const stored = localStorage.getItem("xlayer-theme");
      if (stored) return stored;
    } catch (e) {}
    return "bright";
  });

  // Register keyboard shortcuts
  useKeyboardShortcuts({
    onSearch: () => setSearchOpen(true),
    onEscape: () => setSearchOpen(false),
  });

  useEffect(() => {
    try {
      localStorage.setItem("xlayer-theme", theme);
      document.documentElement.setAttribute("data-theme", theme === "dark" ? "dark" : "bright");
    } catch (e) {}
  }, [theme]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-4 lg:px-6">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search trigger */}
        <div className="flex-1 max-w-xl mx-4">
          <Button
            variant="secondary"
            className="w-full justify-start text-muted-foreground font-normal h-10"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Search protocols, tokens, chains...</span>
            <span className="sm:hidden">Search...</span>
            <kbd className="ml-auto hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              /
            </kbd>
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Live indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 text-success text-xs font-medium">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            Live
          </div>

          {/* Watchlist */}
          <WatchlistPanel />

          {/* Notifications */}
          <NotificationsPanel />

          {/* Keyboard shortcuts */}
          <div className="hidden sm:block">
            <KeyboardShortcutsDialog />
          </div>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme((t) => (t === "dark" ? "bright" : "dark"))}
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Global Search Dialog */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
