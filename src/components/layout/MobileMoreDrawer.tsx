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
  Settings,
  LogOut,
  User,
  Globe,
  Moon,
  Sun,
  ChevronRight,
  Activity
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface MobileMoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onThemeToggle: () => void;
  isDark: boolean;
}

const menuItems = [
  { icon: Layers, label: "Protocols", path: "/protocols" },
  { icon: Coins, label: "Stablecoins", path: "/stablecoins" },
  { icon: PiggyBank, label: "Yields", path: "/yields" },
  { icon: Activity, label: "Fees", path: "/fees" },
  { icon: Globe, label: "Chains", path: "/chains" },
  { icon: Shield, label: "Security", path: "/security" },
  { icon: Bell, label: "Alerts", path: "/alerts" },
  { icon: FileText, label: "Docs", path: "/docs" },
  { icon: Heart, label: "Donations", path: "/donations" },
];

export function MobileMoreDrawer({ isOpen, onClose, onThemeToggle, isDark }: MobileMoreDrawerProps) {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="mobile-drawer-backdrop"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="mobile-drawer max-h-[80vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-4 border-b border-border">
          <h2 className="text-lg font-semibold">More</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* User Section */}
        {user && (
          <div className="px-4 py-3 border-b border-border">
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
        
        {/* Menu Items */}
        <div className="py-2">
          {menuItems.map((item) => (
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
        
        {/* Settings Section */}
        <div className="border-t border-border py-2">
          {/* Theme Toggle */}
          <button
            onClick={onThemeToggle}
            className="flex items-center gap-3 px-4 py-3 w-full hover:bg-muted/50 active:bg-muted transition-colors"
          >
            {isDark ? (
              <Sun className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Moon className="h-5 w-5 text-muted-foreground" />
            )}
            <span className="flex-1 text-sm font-medium text-left">
              {isDark ? "Light Mode" : "Dark Mode"}
            </span>
          </button>
          
          {/* Sign Out */}
          {user && (
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
          )}
          
          {/* Sign In */}
          {!user && (
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
        <div className="h-4" />
      </div>
    </>
  );
}
