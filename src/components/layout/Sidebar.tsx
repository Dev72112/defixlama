import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  TrendingUp,
  Coins,
  ArrowLeftRight,
  PieChart,
  ExternalLink,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Database,
  Wallet,
  BarChart3,
  Shield,
  ScrollText,
  Activity,
  Bell,
  X,
  ShieldCheck,
  Globe,
  DollarSign,
  Heart,
  FileText,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface NavItem {
  labelKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  shortcut?: string;
}

interface NavGroup {
  title: string;
  titleKey: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "Overview",
    titleKey: "nav.overview",
    items: [
      { labelKey: "nav.dashboard", href: "/", icon: LayoutDashboard, shortcut: "D" },
    ],
  },
  {
    title: "Markets",
    titleKey: "nav.markets",
    items: [
      { labelKey: "nav.protocols", href: "/protocols", icon: Database },
      { labelKey: "nav.dexs", href: "/dexs", icon: ArrowLeftRight },
      { labelKey: "nav.tokens", href: "/tokens", icon: Wallet },
      { labelKey: "nav.tokenRanking", href: "/token-ranking", icon: BarChart3, badge: "NEW" },
      { labelKey: "nav.stablecoins", href: "/stablecoins", icon: Coins },
    ],
  },
  {
    title: "Analytics",
    titleKey: "nav.analytics",
    items: [
      { labelKey: "nav.chains", href: "/chains", icon: Globe },
      { labelKey: "nav.fees", href: "/fees", icon: DollarSign },
      { labelKey: "nav.yields", href: "/yields", icon: TrendingUp, badge: "APY" },
      { labelKey: "nav.activities", href: "/activities", icon: Activity },
      { labelKey: "nav.security", href: "/security", icon: Shield },
    ],
  },
  {
    title: "Personal",
    titleKey: "nav.personal",
    items: [
      { labelKey: "nav.portfolio", href: "/portfolio", icon: PieChart },
      { labelKey: "nav.alerts", href: "/alerts", icon: Bell },
    ],
  },
  {
    title: "Resources",
    titleKey: "nav.resources",
    items: [
      { labelKey: "nav.docs", href: "/docs", icon: FileText },
      { labelKey: "nav.donations", href: "/donations", icon: Heart },
      { labelKey: "nav.builderLogs", href: "/builder-logs", icon: ScrollText },
    ],
  },
];

interface SidebarProps {
  mobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobile = false, onClose }: SidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { isAdmin } = useAuth();
  const [collapsed, setCollapsed] = useLocalStorage("sidebar-collapsed", false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["Overview", "Markets"]);

  // Auto-expand group containing active route
  useEffect(() => {
    for (const group of navGroups) {
      const isActive = group.items.some((item) => location.pathname === item.href);
      if (isActive && !expandedGroups.includes(group.title)) {
        setExpandedGroups((prev) => [...prev, group.title]);
      }
    }
  }, [location.pathname]);

  // Close mobile sidebar on route change
  const [initialPath] = useState(location.pathname);
  useEffect(() => {
    if (mobile && onClose && location.pathname !== initialPath) {
      onClose();
    }
  }, [location.pathname, mobile, onClose, initialPath]);

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) =>
      prev.includes(title)
        ? prev.filter((g) => g !== title)
        : [...prev, title]
    );
  };

  const sidebarWidth = mobile ? "w-[280px]" : collapsed ? "w-16" : "w-[260px]";

  const NavItemComponent = ({ item, isActive }: { item: NavItem; isActive: boolean }) => {
    const Icon = item.icon;
    const content = (
      <Link
        to={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 relative group",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        {/* Active indicator bar */}
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-primary" />
        )}
        
        <Icon className={cn("h-4 w-4 shrink-0", collapsed && !mobile && "mx-auto")} />
        
        {(!collapsed || mobile) && (
          <>
            <span className="flex-1 truncate">{t(item.labelKey)}</span>
            {item.badge && (
              <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                {item.badge}
              </span>
            )}
            {item.shortcut && (
              <kbd className="hidden lg:inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 text-[10px] text-muted-foreground">
                {item.shortcut}
              </kbd>
            )}
          </>
        )}
      </Link>
    );

    // Show tooltip when collapsed
    if (collapsed && !mobile) {
      return (
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            {t(item.labelKey)}
            {item.badge && (
              <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                {item.badge}
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar flex flex-col transition-all duration-300",
          sidebarWidth,
          mobile && "animate-slide-in-left"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center justify-between border-b border-sidebar-border",
          collapsed && !mobile ? "h-16 px-2" : "h-16 px-4"
        )}>
          <Link to="/" className={cn(
            "flex items-center gap-3 group",
            collapsed && !mobile && "justify-center w-full"
          )}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300 shrink-0">
              <span className="text-lg font-bold text-primary-foreground">dX</span>
            </div>
            {(!collapsed || mobile) && (
              <div className="flex flex-col">
                <span className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">defiXlama</span>
                <span className="text-xs text-muted-foreground">XLayer Analytics</span>
              </div>
            )}
          </Link>
          {mobile && onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden hover:bg-destructive/10 hover:text-destructive transition-colors">
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Collapse toggle (desktop only) */}
        {!mobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "absolute -right-3 top-20 z-50 h-6 w-6 rounded-full border border-border bg-background shadow-md hover:bg-muted transition-all",
              "hidden lg:flex"
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronLeft className="h-3 w-3" />
            )}
          </Button>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-4 px-2">
            {navGroups.map((group) => {
              const isExpanded = expandedGroups.includes(group.title) || collapsed;
              const hasActiveItem = group.items.some((item) => location.pathname === item.href);

              return (
                <div key={group.title}>
                  {/* Group header - hide when collapsed */}
                  {(!collapsed || mobile) && (
                    <button
                      onClick={() => toggleGroup(group.title)}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors",
                        hasActiveItem ? "text-primary" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className="flex-1 text-left">{t(group.titleKey)}</span>
                      <ChevronDown
                        className={cn(
                          "h-3 w-3 transition-transform duration-200",
                          isExpanded && "rotate-180"
                        )}
                      />
                    </button>
                  )}

                  {/* Group items */}
                  {isExpanded && (
                    <div className={cn("space-y-1", !collapsed && !mobile && "ml-1")}>
                      {group.items.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                          <NavItemComponent
                            key={item.href}
                            item={item}
                            isActive={isActive}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Admin link */}
            {isAdmin && (
              <div className="pt-2 border-t border-sidebar-border">
                <NavItemComponent
                  item={{ labelKey: "Admin Panel", href: "/admin", icon: ShieldCheck }}
                  isActive={location.pathname === "/admin"}
                />
              </div>
            )}
          </div>

          {/* External Links */}
          {(!collapsed || mobile) && (
            <div className="mt-4 px-2 pt-4 border-t border-sidebar-border">
              <a
                href="https://defillama.com/docs/api"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
              >
                <ExternalLink className="h-4 w-4" />
                <span>{t("nav.defillamaApi")}</span>
              </a>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className={cn(
          "border-t border-sidebar-border p-4",
          collapsed && !mobile && "p-2"
        )}>
          {(!collapsed || mobile) ? (
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
          ) : (
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <div className="flex justify-center">
                  <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                {t("common.live")} - xlama.lovable.app
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
