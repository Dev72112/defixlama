import { Link, useLocation } from "react-router-dom";
import { Home, BarChart3, Wallet, Menu, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

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
                "mobile-nav-item flex-1",
                isActive && "active"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-[10px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
        <button
          onClick={onMoreClick}
          className="mobile-nav-item flex-1"
        >
          <Menu className="h-5 w-5 text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground">More</span>
        </button>
      </div>
    </nav>
  );
}
