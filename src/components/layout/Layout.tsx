import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNavigation } from "./MobileNavigation";
import { MobileMoreDrawer } from "./MobileMoreDrawer";
import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { PullToRefresh } from "@/components/PullToRefresh";
import { useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [sidebarCollapsed] = useLocalStorage("sidebar-collapsed", false);
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  // Check theme on mount - default to dark
  useEffect(() => {
    const theme = document.documentElement.getAttribute('data-theme');
    setIsDark(theme !== 'bright'); // Default dark if not explicitly bright
  }, []);

  const handleThemeToggle = () => {
    const newTheme = isDark ? 'bright' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    setIsDark(!isDark);
  };

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries();
    await new Promise((resolve) => setTimeout(resolve, 500));
  }, [queryClient]);

  // Calculate sidebar width for main content offset
  const sidebarWidth = sidebarCollapsed ? "64px" : "260px";

  return (
    <div className="min-h-screen bg-background w-full max-w-[100vw] overflow-x-hidden">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay (legacy, kept for tablet) */}
      {sidebarOpen && !isMobile && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="fixed left-0 top-0 h-full w-[280px]"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar mobile onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div 
        className={cn(
          "w-full max-w-[100vw] overflow-x-hidden transition-all duration-300",
          isMobile && "pb-[calc(64px+env(safe-area-inset-bottom))]"
        )}
        style={{ 
          paddingLeft: !isMobile ? sidebarWidth : undefined 
        }}
      >
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        {isMobile ? (
          <PullToRefresh onRefresh={handleRefresh}>
            <main className="p-4 w-full max-w-full overflow-x-hidden">{children}</main>
          </PullToRefresh>
        ) : (
          <main className="p-4 lg:p-6 w-full max-w-full overflow-x-hidden">{children}</main>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <MobileNavigation onMoreClick={() => setMoreDrawerOpen(true)} />
      )}

      {/* Mobile More Drawer */}
      <MobileMoreDrawer 
        isOpen={moreDrawerOpen} 
        onClose={() => setMoreDrawerOpen(false)}
        onThemeToggle={handleThemeToggle}
        isDark={isDark}
      />
    </div>
  );
}
