import { Link } from "react-router-dom";
import { 
  X, 
  Layers, 
  PiggyBank, 
  Coins, 
  Shield, 
  FileText, 
  Heart, 
  Bell, 
  LogOut,
  User,
  Globe,
  Moon,
  Sun,
  ChevronRight,
  Activity,
  RefreshCw,
  Search,
  BarChart3,
  Wallet,
  ScrollText
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface MobileMoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onThemeToggle: () => void;
  isDark: boolean;
}

// Grouped menu structure
const menuGroups = [
  {
    title: "Analytics",
    items: [
      { icon: Layers, label: "Protocols", path: "/protocols" },
      { icon: Coins, label: "Stablecoins", path: "/stablecoins" },
      { icon: PiggyBank, label: "Yields", path: "/yields" },
      { icon: Activity, label: "Fees", path: "/fees" },
      { icon: Globe, label: "Chains", path: "/chains" },
      { icon: Shield, label: "Security", path: "/security" },
    ],
  },
  {
    title: "Personal",
    items: [
      { icon: Bell, label: "Alerts", path: "/alerts" },
      { icon: Wallet, label: "Tokens", path: "/tokens" },
    ],
  },
  {
    title: "Resources",
    items: [
      { icon: FileText, label: "Docs", path: "/docs" },
      { icon: Heart, label: "Donations", path: "/donations" },
      { icon: ScrollText, label: "Builder Logs", path: "/builder-logs" },
    ],
  },
];

export function MobileMoreDrawer({ isOpen, onClose, onThemeToggle, isDark }: MobileMoreDrawerProps) {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Filter menu items based on search
  const filteredGroups = searchQuery
    ? menuGroups.map(group => ({
        ...group,
        items: group.items.filter(item =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(group => group.items.length > 0)
    : menuGroups;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="mobile-drawer-backdrop"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="mobile-drawer max-h-[85vh] overflow-hidden flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold">More</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-border shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search menu..."
              className="pl-9 h-10 bg-muted/50"
            />
          </div>
        </div>
        
        {/* User Section */}
        {user && (
          <div className="px-4 py-3 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.email}</p>
                <p className="text-xs text-muted-foreground">Connected</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="px-4 py-3 border-b border-border shrink-0">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-10"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-10"
              onClick={onThemeToggle}
            >
              {isDark ? (
                <>
                  <Sun className="h-4 w-4 mr-2" />
                  Light
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 mr-2" />
                  Dark
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Scrollable Menu Items */}
        <div className="flex-1 overflow-y-auto py-2">
          {filteredGroups.map((group) => (
            <div key={group.title} className="mb-2">
              <p className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {group.title}
              </p>
              {group.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 active:bg-muted transition-colors"
                >
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="flex-1 text-sm font-medium">{item.label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          ))}

          {filteredGroups.length === 0 && searchQuery && (
            <div className="px-4 py-8 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No results for "{searchQuery}"</p>
            </div>
          )}
        </div>
        
        {/* Footer Actions */}
        <div className="border-t border-border py-2 shrink-0">
          {user ? (
            <button
              onClick={() => {
                signOut();
                onClose();
              }}
              className="flex items-center gap-3 px-4 py-3 w-full hover:bg-muted/50 active:bg-muted transition-colors text-destructive"
            >
              <LogOut className="h-5 w-5" />
              <span className="flex-1 text-sm font-medium text-left">Sign Out</span>
            </button>
          ) : (
            <Link
              to="/auth"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 active:bg-muted transition-colors"
            >
              <User className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium">Sign In</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          )}
        </div>
        
        {/* Bottom Spacing for Safe Area */}
        <div className="h-4 shrink-0" />
      </div>
    </>
  );
}
