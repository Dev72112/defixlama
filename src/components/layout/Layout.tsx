import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="fixed left-0 top-0 h-full w-[220px]"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-[220px]">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
