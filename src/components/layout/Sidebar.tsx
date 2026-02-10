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
  Waves,
  Landmark,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

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
  { labelKey: "nav.yields", href: "/yields", icon: TrendingUp },
  { labelKey: "nav.stablecoins", href: "/stablecoins", icon: Coins },
  { labelKey: "nav.tokens", href: "/tokens", icon: Wallet },
  { labelKey: "nav.portfolio", href: "/portfolio", icon: PieChart },
  { labelKey: "nav.alerts", href: "/alerts", icon: Bell },
];

const moreItems: NavItem[] = [
  { labelKey: "nav.chains", href: "/chains", icon: PieChart },
  { labelKey: "nav.fees", href: "/fees", icon: BarChart3 },
  { labelKey: "nav.activities", href: "/activities", icon: Activity },
  { labelKey: "nav.security", href: "/security", icon: Shield },
];

const advancedItems: NavItem[] = [
  { labelKey: "Whale Activity", href: "/whale-activity", icon: Waves, badge: "SOON" },
  { labelKey: "Market Structure", href: "/market-structure", icon: Landmark, badge: "SOON" },
];

interface SidebarProps {
  mobile?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ mobile = false, onClose, collapsed = false, onToggleCollapse }: SidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { isAdmin } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const isCollapsed = !mobile && collapsed;

  useEffect(() => {
    const isMoreActive = moreItems.some((item) => location.pathname === item.href);
    if (isMoreActive) setMoreOpen(true);
  }, [location.pathname]);

  const [initialPath] = useState(location.pathname);
  useEffect(() => {
    if (mobile && onClose && location.pathname !== initialPath) {
      onClose();
    }
  }, [location.pathname, mobile, onClose, initialPath]);

  const NavItemLink = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;

    const link = (
      <Link
        to={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
          isCollapsed && "justify-center px-2",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        {!isCollapsed && <span>{typeof item.labelKey === 'string' && item.labelKey.startsWith('nav.') ? t(item.labelKey) : item.labelKey}</span>}
        {!isCollapsed && item.badge && (
          <span className="ml-auto rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
            {item.badge}
          </span>
        )}
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {typeof item.labelKey === 'string' && item.labelKey.startsWith('nav.') ? t(item.labelKey) : item.labelKey}
          </TooltipContent>
        </Tooltip>
      );
    }

    return link;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar flex flex-col transition-all duration-300",
        mobile ? "w-[280px] animate-slide-in-left" : isCollapsed ? "w-16" : "w-[220px]"
      )}>
        {/* Logo */}
        <div className={cn(
          "flex h-14 items-center border-b border-sidebar-border",
          isCollapsed ? "justify-center px-2" : "justify-between px-4"
        )}>
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300 flex-shrink-0">
              <span className="text-sm font-bold text-primary-foreground">dX</span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">defiXlama</span>
                <span className="text-[10px] text-muted-foreground">DeFi Analytics</span>
              </div>
            )}
          </Link>
          {mobile && onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden hover:bg-destructive/10 hover:text-destructive transition-colors">
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3">
          <div className="space-y-0.5 px-2">
            {navItems.map((item) => (
              <NavItemLink key={item.href} item={item} />
            ))}

            {/* More section */}
            {isCollapsed ? (
              moreItems.map((item) => (
                <NavItemLink key={item.href} item={item} />
              ))
            ) : (
              <>
                <button
                  onClick={() => setMoreOpen(!moreOpen)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
                >
                  <PieChart className="h-4 w-4" />
                  <span>{t("nav.more")}</span>
                  <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform duration-200", moreOpen && "rotate-180")} />
                </button>

                {moreOpen && (
                  <div className="ml-4 space-y-0.5 border-l border-sidebar-border pl-3">
                    {moreItems.map((item) => {
                      const isActive = location.pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                            isActive ? "bg-primary/10 text-primary" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{t(item.labelKey)}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Advanced Analytics section */}
          {!isCollapsed && (
            <div className="mt-4 px-2">
              <p className="px-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                Advanced Analytics
              </p>
              {advancedItems.map((item) => (
                <NavItemLink key={item.href} item={item} />
              ))}
            </div>
          )}
          {isCollapsed && advancedItems.map((item) => (
            <div key={item.href} className="px-2">
              <NavItemLink item={item} />
            </div>
          ))}

          {/* Resources */}
          {!isCollapsed && (
            <div className="mt-4 px-2">
              <p className="px-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                {t("nav.resources")}
              </p>
              <a href="https://defillama.com/docs/api" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200">
                <ExternalLink className="h-4 w-4" /><span>{t("nav.defillamaApi")}</span>
              </a>
              <Link to="/docs" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200">
                <ExternalLink className="h-4 w-4" /><span>{t("nav.docs")}</span>
              </Link>
              <Link to="/donations" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200">
                <Wallet className="h-4 w-4" /><span>{t("nav.donations")}</span>
              </Link>
              <Link to="/builder-logs" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200">
                <ScrollText className="h-4 w-4" /><span>{t("nav.builderLogs")}</span>
              </Link>
              {isAdmin && (
                <Link to="/admin" className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  location.pathname === "/admin" ? "bg-primary/10 text-primary" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}>
                  <ShieldCheck className="h-4 w-4" /><span>Admin Panel</span>
                </Link>
              )}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-2">
          {!mobile && onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className={cn(
                "flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200",
                isCollapsed && "justify-center px-2"
              )}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span>Collapse</span></>}
            </button>
          )}
          {!isCollapsed && (
            <div className="px-3 py-2 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{t("common.poweredBy")}</span>
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                <span>{t("common.live")}</span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
