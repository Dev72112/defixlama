import { Link, useLocation } from "react-router-dom";
import { Home, BarChart3, Wallet, Menu, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";

interface MobileNavigationProps {
  onMoreClick: () => void;
}

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: TrendingUp, label: "Rank", path: "/token-ranking" },
  { icon: BarChart3, label: "DEXs", path: "/dexs" },
  { icon: Wallet, label: "Portfolio", path: "/portfolio" },
];

export function MobileNavigation({ onMoreClick }: MobileNavigationProps) {
  const location = useLocation();
  const { unreadCount } = useNotifications();
  
  return (
    <nav className="mobile-nav lg:hidden">
      <div className="flex items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "mobile-nav-item flex-1 relative group",
                isActive && "active"
              )}
            >
              {/* Active indicator dot */}
              {isActive && (
                <span className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary animate-pulse" />
              )}
              
              <item.icon className={cn(
                "h-5 w-5 transition-all duration-200 group-active:scale-90",
                isActive ? "text-primary" : "text-muted-foreground"
              )} />
              
              <span className={cn(
                "text-[10px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
              
              {/* Active underline indicator */}
              <span className={cn(
                "absolute bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-primary transition-all duration-300",
                isActive ? "w-4 opacity-100" : "w-0 opacity-0"
              )} />
            </Link>
          );
        })}
        
        {/* More button with notification badge */}
        <button
          onClick={onMoreClick}
          className="mobile-nav-item flex-1 relative group"
        >
          <div className="relative">
            <Menu className="h-5 w-5 text-muted-foreground transition-all duration-200 group-active:scale-90" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-1 flex items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">More</span>
        </button>
      </div>
    </nav>
  );
}
