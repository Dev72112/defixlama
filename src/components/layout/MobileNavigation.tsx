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
                "mobile-nav-item flex-1 relative group haptic-tap",
                isActive && "active"
              )}
            >
              {/* Active glow effect */}
              {isActive && (
                <span className="absolute inset-0 bg-primary/5 rounded-xl -z-10" />
              )}
              
              {/* Active indicator dot */}
              {isActive && (
                <span className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary shadow-sm shadow-primary/50" />
              )}
              
              <div className={cn(
                "p-1.5 rounded-lg transition-all duration-200",
                isActive ? "bg-primary/10" : "group-active:bg-muted/50"
              )}>
                <item.icon className={cn(
                  "h-5 w-5 transition-all duration-200 group-active:scale-90",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} />
              </div>
              
              <span className={cn(
                "text-[10px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
              
              {/* Active underline indicator */}
              <span className={cn(
                "absolute bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-primary transition-all duration-300 shadow-sm shadow-primary/50",
                isActive ? "w-5 opacity-100" : "w-0 opacity-0"
              )} />
            </Link>
          );
        })}
        
        {/* More button with notification badge */}
        <button
          onClick={onMoreClick}
          className="mobile-nav-item flex-1 relative group haptic-tap"
        >
          <div className="relative p-1.5 rounded-lg group-active:bg-muted/50 transition-colors">
            <Menu className="h-5 w-5 text-muted-foreground transition-all duration-200 group-active:scale-90 group-hover:text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground shadow-sm shadow-primary/30 animate-pulse">
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
