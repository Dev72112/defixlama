import { Search, Menu, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { WatchlistPanel } from "@/components/WatchlistPanel";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcutsDialog";
import { GlobalSearch } from "@/components/GlobalSearch";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { t } = useTranslation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  useKeyboardShortcuts({
    onSearch: () => setSearchOpen(true),
    onEscape: () => setSearchOpen(false),
  });

  return (
    <>
      <header className={cn(
        "sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur-md px-4 transition-all duration-300",
        isMobile ? "h-12" : "h-16 lg:px-6"
      )}>
        {/* Mobile: Logo centered, Desktop: Menu button */}
        {isMobile ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-lg font-bold text-gradient-primary">defiXlama</span>
          </div>
        ) : (
          <>
            {/* Desktop menu button for tablet */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden hover:bg-primary/10 hover:text-primary transition-colors"
              onClick={onMenuClick}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Search trigger - Desktop only */}
            <div className="flex-1 max-w-xl mx-4">
              <Button
                variant="secondary"
                className="w-full justify-start text-muted-foreground font-normal h-10 hover:border-primary/50 hover:bg-secondary/80 transition-all duration-200 group"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-4 w-4 mr-2 group-hover:text-primary transition-colors" />
                <span className="hidden sm:inline">{t("header.searchPlaceholder")}</span>
                <span className="sm:hidden">{t("common.search")}...</span>
                <kbd className="ml-auto hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground group-hover:border-primary/30 transition-colors">
                  /
                </kbd>
              </Button>
            </div>
          </>
        )}

        {/* Actions */}
        <div className={cn(
          "flex items-center",
          isMobile ? "gap-1 absolute right-2" : "gap-1 sm:gap-2"
        )}>
          {/* Mobile: Search icon only */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-4 w-4" />
            </Button>
          )}

          {/* Live indicator - Desktop only */}
          {!isMobile && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 text-success text-xs font-medium badge-pulse">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              {t("common.live")}
            </div>
          )}

          {/* Desktop refresh button */}
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex hover:bg-primary/10 hover:text-primary transition-all duration-200"
              onClick={async () => {
                setIsRefreshing(true);
                await queryClient.invalidateQueries();
                setTimeout(() => setIsRefreshing(false), 1000);
              }}
              title={t("common.refresh")}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          )}

          {/* Notifications */}
          <NotificationsPanel />

          {/* Desktop only elements */}
          {!isMobile && (
            <>
              <WatchlistPanel />
              <div className="hidden sm:block">
                <KeyboardShortcutsDialog />
              </div>
              <LanguageSwitcher />
              <ThemeToggle />
              <UserMenu />
            </>
          )}
        </div>
      </header>

      {/* Global Search Dialog */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
