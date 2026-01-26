import { RefreshCw, Bell, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface QuickActionsProps {
  className?: string;
}

export function QuickActions({ className }: QuickActionsProps) {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const actions = [
    {
      icon: RefreshCw,
      label: "Refresh",
      onClick: handleRefresh,
      isLoading: isRefreshing,
    },
    {
      icon: Bell,
      label: "Alert",
      href: "/alerts",
    },
    {
      icon: Download,
      label: "Export",
      onClick: () => {
        // Trigger CSV export
        console.log("Export triggered");
      },
    },
  ];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {actions.map((action) =>
        action.href ? (
          <Link key={action.label} to={action.href}>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 hover:border-primary/50 hover:bg-primary/5"
            >
              <action.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{action.label}</span>
            </Button>
          </Link>
        ) : (
          <Button
            key={action.label}
            variant="outline"
            size="sm"
            className="h-9 gap-2 hover:border-primary/50 hover:bg-primary/5"
            onClick={action.onClick}
            disabled={action.isLoading}
          >
            <action.icon
              className={cn("h-4 w-4", action.isLoading && "animate-spin")}
            />
            <span className="hidden sm:inline">{action.label}</span>
          </Button>
        )
      )}
    </div>
  );
}

// Floating Action Button for mobile
export function FloatingQuickAction({ className }: { className?: string }) {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => {
      setIsRefreshing(false);
      setExpanded(false);
    }, 1000);
  };

  return (
    <div className={cn("fixed bottom-20 right-4 z-40 lg:hidden", className)}>
      {/* Expanded actions */}
      {expanded && (
        <div className="absolute bottom-14 right-0 flex flex-col gap-2 animate-fade-in">
          <Button
            size="icon"
            variant="secondary"
            className="h-10 w-10 rounded-full shadow-lg"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
          <Link to="/alerts">
            <Button
              size="icon"
              variant="secondary"
              className="h-10 w-10 rounded-full shadow-lg"
              onClick={() => setExpanded(false)}
            >
              <Bell className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* Main FAB */}
      <Button
        size="icon"
        className={cn(
          "h-12 w-12 rounded-full shadow-lg transition-all duration-300",
          expanded && "rotate-45 bg-destructive hover:bg-destructive/90"
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <Plus className="h-5 w-5" />
      </Button>
    </div>
  );
}
