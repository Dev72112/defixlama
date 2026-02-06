import { Moon, Sun, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Theme = "bright" | "dark" | "matrix";

const THEME_ORDER: Theme[] = ["bright", "dark", "matrix"];

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem("xlayer-theme");
      if (stored === "dark" || stored === "bright" || stored === "matrix") return stored;
    } catch (e) {}
    // Matrix is the default for new users
    return "matrix";
  });

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const currentIndex = THEME_ORDER.indexOf(prev);
      const nextIndex = (currentIndex + 1) % THEME_ORDER.length;
      return THEME_ORDER[nextIndex];
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
    isDark: theme === "dark", 
    isMatrix: theme === "matrix",
    isBright: theme === "bright"
  };
}

interface ThemeToggleProps {
  className?: string;
  showDropdown?: boolean;
}

export function ThemeToggle({ className, showDropdown = false }: ThemeToggleProps) {
  const { t } = useTranslation();
  const { theme, setTheme, toggleTheme, isDark, isMatrix, isBright } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    setIsAnimating(true);
    toggleTheme();
    setTimeout(() => setIsAnimating(false), 500);
  };

  const getThemeIcon = () => {
    if (isMatrix) return <Terminal className="h-5 w-5" />;
    if (isDark) return <Sun className="h-5 w-5" />;
    return <Moon className="h-5 w-5" />;
  };

  const getThemeLabel = (themeValue: Theme) => {
    switch (themeValue) {
      case "bright": return "Light";
      case "dark": return "Dark";
      case "matrix": return "Matrix";
    }
  };

  if (showDropdown) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("header.toggleTheme")}
            title={t("header.toggleTheme")}
            className={cn(
              "relative overflow-hidden hover:bg-primary/10 hover:text-primary transition-all duration-300",
              isMatrix && "hover:shadow-[0_0_15px_hsl(142_90%_50%/0.3)]",
              className
            )}
          >
            {getThemeIcon()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[140px]">
          <DropdownMenuItem 
            onClick={() => setTheme("bright")}
            className={cn(isBright && "bg-primary/10 text-primary")}
          >
            <Sun className="h-4 w-4 mr-2" />
            Light
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setTheme("dark")}
            className={cn(isDark && "bg-primary/10 text-primary")}
          >
            <Moon className="h-4 w-4 mr-2" />
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setTheme("matrix")}
            className={cn(isMatrix && "bg-primary/10 text-primary")}
          >
            <Terminal className="h-4 w-4 mr-2" />
            Matrix
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t("header.toggleTheme")}
      onClick={handleToggle}
      title={`${t("header.toggleTheme")} (${getThemeLabel(theme)})`}
      className={cn(
        "relative overflow-hidden hover:bg-primary/10 hover:text-primary transition-all duration-300",
        isMatrix && "hover:shadow-[0_0_15px_hsl(142_90%_50%/0.3)]",
        className
      )}
    >
      <div className="relative w-5 h-5">
        {/* Sun icon - shown in dark mode */}
        <Sun
          className={cn(
            "absolute inset-0 h-5 w-5 transition-all duration-500 ease-out",
            isDark
              ? "rotate-0 scale-100 opacity-100"
              : "rotate-90 scale-0 opacity-0"
          )}
        />
        {/* Moon icon - shown in bright mode */}
        <Moon
          className={cn(
            "absolute inset-0 h-5 w-5 transition-all duration-500 ease-out",
            isBright
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0"
          )}
        />
        {/* Terminal icon - shown in matrix mode */}
        <Terminal
          className={cn(
            "absolute inset-0 h-5 w-5 transition-all duration-500 ease-out",
            isMatrix
              ? "rotate-0 scale-100 opacity-100"
              : "rotate-90 scale-0 opacity-0"
          )}
        />
      </div>
      
      {/* Ripple effect on click */}
      {isAnimating && (
        <span
          className={cn(
            "absolute inset-0 rounded-md animate-theme-ripple",
            isMatrix ? "bg-[hsl(142_90%_50%/0.2)]" : isDark ? "bg-warning/20" : "bg-primary/20"
          )}
        />
      )}
    </Button>
  );
}
