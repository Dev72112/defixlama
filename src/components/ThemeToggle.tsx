import { Moon, Sun, Sparkles, MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

export type ThemeMode = "bright" | "dark" | "matrix";

const THEME_ICONS = {
  bright: Sun,
  dark: Moon,
  matrix: Sparkles,
};

const THEME_LABELS = {
  bright: "Light",
  dark: "Dark",
  matrix: "Matrix",
};

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem("xlayer-theme");
      if (stored === "dark" || stored === "bright" || stored === "matrix") return stored;
    } catch (e) {}
    return "matrix"; // Default to matrix mode for new users
  });

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    // Cycle: matrix -> dark -> bright -> matrix
    setThemeState((prev) => {
      if (prev === "matrix") return "dark";
      if (prev === "dark") return "bright";
      return "matrix";
    });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("xlayer-theme", theme);
      document.documentElement.classList.add("theme-transitioning");
      document.documentElement.setAttribute("data-theme", theme);
      const timeout = setTimeout(() => {
        document.documentElement.classList.remove("theme-transitioning");
      }, 500);
      return () => clearTimeout(timeout);
    } catch (e) {}
  }, [theme]);

  return { 
    theme, 
    setTheme, 
    toggleTheme, 
    isDark: theme === "dark" || theme === "matrix",
    isMatrix: theme === "matrix",
  };
}

interface ThemeToggleProps {
  className?: string;
  showDropdown?: boolean;
}

export function ThemeToggle({ className, showDropdown = true }: ThemeToggleProps) {
  const { t } = useTranslation();
  const { theme, setTheme, toggleTheme, isMatrix } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    setIsAnimating(true);
    toggleTheme();
    setTimeout(() => setIsAnimating(false), 500);
  };

  const CurrentIcon = THEME_ICONS[theme];

  if (!showDropdown) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("header.toggleTheme")}
        onClick={handleToggle}
        title={t("header.toggleTheme")}
        className={cn(
          "relative overflow-hidden hover:bg-primary/10 hover:text-primary transition-all duration-300",
          className
        )}
      >
        <div className="relative w-5 h-5">
          <CurrentIcon
            className={cn(
              "h-5 w-5 transition-all duration-300",
              isMatrix && "text-primary"
            )}
          />
        </div>
        
        {isAnimating && (
          <span
            className={cn(
              "absolute inset-0 rounded-md animate-theme-ripple",
              isMatrix ? "bg-primary/20" : "bg-primary/20"
            )}
          />
        )}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("header.toggleTheme")}
          title={THEME_LABELS[theme]}
          className={cn(
            "relative overflow-hidden hover:bg-primary/10 hover:text-primary transition-all duration-300",
            className
          )}
        >
          <div className="relative w-5 h-5">
            <CurrentIcon
              className={cn(
                "h-5 w-5 transition-all duration-300",
                isMatrix && "text-primary"
              )}
            />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {(Object.keys(THEME_ICONS) as ThemeMode[]).map((mode) => {
          const Icon = THEME_ICONS[mode];
          return (
            <DropdownMenuItem
              key={mode}
              onClick={() => setTheme(mode)}
              className={cn(
                "flex items-center gap-2 cursor-pointer",
                theme === mode && "bg-primary/10 text-primary"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{THEME_LABELS[mode]}</span>
              {mode === "matrix" && (
                <span className="ml-auto text-[10px] text-primary font-medium">NEW</span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Simple theme cycle button for mobile
interface ThemeCycleButtonProps {
  className?: string;
}

export function ThemeCycleButton({ className }: ThemeCycleButtonProps) {
  const { theme, toggleTheme, isMatrix } = useTheme();
  const CurrentIcon = THEME_ICONS[theme];

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn("flex-1 h-10", className)}
      onClick={toggleTheme}
    >
      <CurrentIcon className={cn("h-4 w-4 mr-2", isMatrix && "text-primary")} />
      {THEME_LABELS[theme]}
    </Button>
  );
}
