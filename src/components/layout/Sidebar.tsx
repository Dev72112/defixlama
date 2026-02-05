import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  ScrollText,
  Activity,
  Bell,
  X,
  ShieldCheck,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  labelKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { labelKey: "nav.dashboard", href: "/", icon: LayoutDashboard },
  { labelKey: "nav.protocols", href: "/protocols", icon: Database },
  { labelKey: "nav.dexs", href: "/dexs", icon: ArrowLeftRight },
  { labelKey: "nav.yields", href: "/yields", icon: TrendingUp, badge: "APY" },
  { labelKey: "nav.stablecoins", href: "/stablecoins", icon: Coins },
  { labelKey: "nav.tokens", href: "/tokens", icon: Wallet },
  { labelKey: "nav.portfolio", href: "/portfolio", icon: PieChart, badge: "NEW" },
  { labelKey: "nav.alerts", href: "/alerts", icon: Bell },
];

const moreItems: NavItem[] = [
  { labelKey: "nav.chains", href: "/chains", icon: PieChart },
  { labelKey: "nav.fees", href: "/fees", icon: BarChart3 },
  { labelKey: "nav.activities", href: "/activities", icon: Activity },
  { labelKey: "nav.security", href: "/security", icon: Shield },
];

interface SidebarProps {
  mobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobile = false, onClose }: SidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { isAdmin } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  // Auto-expand more section if current route is in it
  useEffect(() => {
    const isMoreActive = moreItems.some((item) => location.pathname === item.href);
    if (isMoreActive) setMoreOpen(true);
  }, [location.pathname]);

  // Close mobile sidebar on route change (but not on initial mount)
  const [initialPath] = useState(location.pathname);
  useEffect(() => {
    if (mobile && onClose && location.pathname !== initialPath) {
      onClose();
    }
  }, [location.pathname, mobile, onClose, initialPath]);

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar flex flex-col transition-all duration-300",
      mobile ? "w-[280px] animate-slide-in-left" : "w-[220px]"
    )}>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
            <span className="text-lg font-bold text-primary-foreground">dX</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">defiXlama</span>
            <span className="text-xs text-muted-foreground">XLayer Analytics</span>
          </div>
        </Link>
        {mobile && onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden hover:bg-destructive/10 hover:text-destructive transition-colors">
            <X className="h-5 w-5" />
          </Button>
        )}
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
                <span>{t(item.labelKey)}</span>
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
            <span>{t("nav.more")}</span>
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
                    <span>{t(item.labelKey)}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* External Links */}
        <div className="mt-6 px-2">
          <p className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
            {t("nav.resources")}
          </p>
          
          <a
            href="https://defillama.com/docs/api"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
          >
            <ExternalLink className="h-4 w-4" />
            <span>{t("nav.defillamaApi")}</span>
          </a>
          <Link
            to="/docs"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
          >
            <ExternalLink className="h-4 w-4" />
            <span>{t("nav.docs")}</span>
          </Link>
          <Link
            to="/donations"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
          >
            <Wallet className="h-4 w-4" />
            <span>{t("nav.donations")}</span>
          </Link>
          <Link
            to="/builder-logs"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
          >
            <ScrollText className="h-4 w-4" />
            <span>{t("nav.builderLogs")}</span>
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                location.pathname === "/admin"
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Admin Panel</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>{t("common.poweredBy")}</span>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span>{t("common.live")}</span>
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
