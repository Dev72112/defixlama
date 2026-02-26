import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { PullToRefresh } from "@/components/PullToRefresh";
import { useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { ChevronUp } from "lucide-react";

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
  const [showBackToTop, setShowBackToTop] = useState(false);
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  useEffect(() => {
    try { localStorage.setItem("sidebar-collapsed", String(sidebarCollapsed)); } catch {}
  }, [sidebarCollapsed]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
        {isMobile ? (
          <PullToRefresh onRefresh={handleRefresh}>
            <main className="p-4 lg:p-6 w-full max-w-full overflow-x-hidden pb-24">{children}</main>
          </PullToRefresh>
        ) : (
          <main className="p-4 lg:p-6 w-full max-w-full overflow-x-hidden">{children}</main>
        )}
      </div>

      {/* Bottom Navigation - mobile only */}
      {isMobile && <BottomNav />}

      {/* Back to Top Button */}
      {showBackToTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 md:bottom-32 z-40 rounded-full h-12 w-12 p-0 animate-fade-in"
          aria-label="Back to top"
        >
          <ChevronUp className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
