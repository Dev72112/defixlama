import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Wallet,
  PieChart,
  Bell,
  MoreHorizontal,
  Database,
  ArrowLeftRight,
  TrendingUp,
  Coins,
  BarChart3,
  Activity,
  Shield,
  ScrollText,
  Heart,
  X,
  Waves,
  Landmark,
  Target,
  Code,
  CreditCard,
} from "lucide-react";
import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";

interface NavTab {
  labelKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const mainTabs: NavTab[] = [
  { labelKey: "nav.dashboard", href: "/", icon: LayoutDashboard },
  { labelKey: "nav.tokens", href: "/tokens", icon: Wallet },
  { labelKey: "nav.portfolio", href: "/portfolio", icon: PieChart },
  { labelKey: "nav.alerts", href: "/alerts", icon: Bell },
];

const moreTabs: NavTab[] = [
  { labelKey: "nav.protocols", href: "/protocols", icon: Database },
  { labelKey: "nav.dexs", href: "/dexs", icon: ArrowLeftRight },
  { labelKey: "nav.yields", href: "/yields", icon: TrendingUp },
  { labelKey: "nav.stablecoins", href: "/stablecoins", icon: Coins },
  { labelKey: "nav.chains", href: "/chains", icon: PieChart },
  { labelKey: "nav.fees", href: "/fees", icon: BarChart3 },
  { labelKey: "nav.activities", href: "/activities", icon: Activity },
  { labelKey: "nav.security", href: "/security", icon: Shield },
  { labelKey: "nav.donations", href: "/donations", icon: Heart },
  { labelKey: "nav.builderLogs", href: "/builder-logs", icon: ScrollText },
  // Premium PRO Features
  { labelKey: "Backtester", href: "/backtester", icon: Target, badge: "PRO" },
  { labelKey: "Portfolio Dashboard", href: "/portfolio-dashboard", icon: PieChart, badge: "PRO" },
  { labelKey: "Risk Dashboard", href: "/risk-dashboard", icon: Shield, badge: "PRO" },
  { labelKey: "Whale Activity", href: "/whale-activity", icon: Waves, badge: "PRO" },
  { labelKey: "Market Structure", href: "/market-structure", icon: Landmark, badge: "PRO" },
  { labelKey: "Yield Intelligence", href: "/yield-intelligence", icon: TrendingUp, badge: "PRO" },
  { labelKey: "API Access", href: "/api-access", icon: Code, badge: "PRO" },
  // Premium ENTERPRISE Features
  { labelKey: "Billing", href: "/billing", icon: CreditCard, badge: "PRO" },
];

export function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = moreTabs.some((tab) => location.pathname === tab.href);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-stretch justify-around">
          {mainTabs.map((tab) => {
            const isActive = location.pathname === tab.href;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                to={tab.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 px-1 min-h-[52px] min-w-[52px] flex-1 transition-colors duration-200",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "drop-shadow-[0_0_4px_hsl(var(--primary)/0.4)]")} />
                <span className="text-[10px] font-medium leading-tight">{t(tab.labelKey)}</span>
              </Link>
            );
          })}

          {/* More tab */}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 py-2 px-1 min-h-[52px] min-w-[52px] flex-1 transition-colors duration-200",
              isMoreActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <MoreHorizontal className={cn("h-5 w-5", isMoreActive && "drop-shadow-[0_0_4px_hsl(var(--primary)/0.4)]")} />
            <span className="text-[10px] font-medium leading-tight">{t("nav.more")}</span>
          </button>
        </div>
      </nav>

      {/* More Drawer */}
      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent>
          <DrawerHeader className="flex items-center justify-between">
            <DrawerTitle>{t("nav.more")}</DrawerTitle>
            <DrawerClose asChild>
              <button className="rounded-full p-1 hover:bg-muted transition-colors">
                <X className="h-5 w-5" />
              </button>
            </DrawerClose>
          </DrawerHeader>
          <div className="grid grid-cols-4 gap-2 px-4 pb-6">
            {moreTabs.map((tab) => {
              const isActive = location.pathname === tab.href;
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  to={tab.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl p-3 transition-colors duration-200 relative",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-[11px] font-medium text-center leading-tight">
                    {tab.labelKey.startsWith('nav.') ? t(tab.labelKey) : tab.labelKey}
                  </span>
                  {tab.badge && (
                    <span className="absolute top-1 right-1 text-[8px] font-bold text-primary bg-primary/15 px-1 rounded">
                      {tab.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
