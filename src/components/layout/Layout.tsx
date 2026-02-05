import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { PullToRefresh } from "@/components/PullToRefresh";
import { useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const handleRefresh = useCallback(async () => {
    // Invalidate all queries to refetch data
    await queryClient.invalidateQueries();
    // Small delay for visual feedback
    await new Promise((resolve) => setTimeout(resolve, 500));
  }, [queryClient]);

  return (
    <div className="min-h-screen bg-background w-full max-w-[100vw] overflow-x-hidden">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar />
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
      <div className="lg:pl-[220px] w-full max-w-[100vw] overflow-x-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        {isMobile ? (
          <PullToRefresh onRefresh={handleRefresh}>
            <main className="p-4 lg:p-6 w-full max-w-full overflow-x-hidden">{children}</main>
          </PullToRefresh>
        ) : (
          <main className="p-4 lg:p-6 w-full max-w-full overflow-x-hidden">{children}</main>
        )}
      </div>
    </div>
  );
}
