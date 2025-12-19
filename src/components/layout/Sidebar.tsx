import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  TrendingUp,
  Coins,
  ArrowLeftRight,
  Droplets,
  PieChart,
  Settings,
  ExternalLink,
  ChevronDown,
  Database,
  Wallet,
  BarChart3,
  Shield,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Protocols", href: "/protocols", icon: Database },
  { label: "DEXs", href: "/dexs", icon: ArrowLeftRight },
  { label: "Yields", href: "/yields", icon: TrendingUp, badge: "APY" },
  { label: "Stablecoins", href: "/stablecoins", icon: Coins },
  { label: "Tokens", href: "/tokens", icon: Wallet },
];

const moreItems: NavItem[] = [
  { label: "Chains", href: "/chains", icon: PieChart },
  { label: "Fees", href: "/fees", icon: BarChart3 },
  { label: "Security", href: "/security", icon: Shield },
];

export function Sidebar() {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-[220px] border-r border-sidebar-border bg-sidebar flex flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70">
          <span className="text-lg font-bold text-primary-foreground">dX</span>
        </div>
        <div className="flex flex-col">
          <span className="text-base font-semibold text-foreground">defiXlama</span>
          <span className="text-xs text-muted-foreground">XLayer Analytics</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* More section */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
          >
            <PieChart className="h-4 w-4" />
            <span>More</span>
            <ChevronDown
              className={cn(
                "ml-auto h-4 w-4 transition-transform duration-200",
                moreOpen && "rotate-180"
              )}
            />
          </button>

          {moreOpen && (
            <div className="ml-4 space-y-1 border-l border-sidebar-border pl-3">
              {moreItems.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* External Links */}
        <div className="mt-6 px-2">
          <p className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
            Resources
          </p>
          <a
            href="https://www.okx.com/xlayer/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
          >
            <ExternalLink className="h-4 w-4" />
            <span>XLayer Docs</span>
          </a>
          <a
            href="https://defillama.com/docs/api"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
          >
            <ExternalLink className="h-4 w-4" />
            <span>DefiLlama API</span>
          </a>
          <a
            href="https://defillama.com/chain/xlayer"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
          >
            <ExternalLink className="h-4 w-4" />
            <span>XLayer on DefiLlama</span>
          </a>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Powered by DefiLlama</span>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span>Live</span>
            </div>
          </div>
          <a 
            href="https://xlama.lovable.app" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary/70 hover:text-primary transition-colors"
          >
            xlama.lovable.app
          </a>
        </div>
      </div>
    </aside>
  );
}
