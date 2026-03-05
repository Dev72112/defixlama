import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { PullToRefresh } from "@/components/PullToRefresh";
import { useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
import { useChain } from "@/contexts/ChainContext";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar-collapsed") === "true";
    } catch { return false; }
  });
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { selectedChain, isChainSwitching, isAllChains } = useChain();

  useEffect(() => {
    try { localStorage.setItem("sidebar-collapsed", String(sidebarCollapsed)); } catch {}
  }, [sidebarCollapsed]);

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries();
    await new Promise((resolve) => setTimeout(resolve, 500));
  }, [queryClient]);

  return (
    <div className="min-h-screen bg-background w-full max-w-[100vw] overflow-x-hidden">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
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
      <div className={cn(
        "w-full max-w-[100vw] overflow-x-hidden transition-all duration-300",
        sidebarCollapsed ? "lg:pl-16" : "lg:pl-[220px]"
      )}>
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Chain indicator + switching overlay */}
        {!isAllChains && (
          <div className="px-4 lg:px-6 pt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Showing data for: <span className="font-medium text-foreground">{selectedChain.name}</span>
              {isChainSwitching && <span className="text-primary ml-1">Loading...</span>}
            </div>
          </div>
        )}
        
        {isMobile ? (
          <PullToRefresh onRefresh={handleRefresh}>
            <main className={cn(
              "p-4 lg:p-6 w-full max-w-full overflow-x-hidden pb-24 transition-opacity duration-200",
              isChainSwitching && "opacity-50"
            )}>{children}</main>
          </PullToRefresh>
        ) : (
          <main className={cn(
            "p-4 lg:p-6 w-full max-w-full overflow-x-hidden transition-opacity duration-200",
            isChainSwitching && "opacity-50"
          )}>{children}</main>
        )}
      </div>

      {/* Bottom Navigation - mobile only */}
      {isMobile && <BottomNav />}
    </div>
  );
}
