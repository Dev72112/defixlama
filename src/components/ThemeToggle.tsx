import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

export function useTheme() {
  const [theme, setThemeState] = useState<"bright" | "dark">(() => {
    try {
      const stored = localStorage.getItem("xlayer-theme");
      if (stored === "dark" || stored === "bright") return stored;
    } catch (e) {}
    return "dark"; // Default to dark mode
  });

  const setTheme = useCallback((newTheme: "bright" | "dark") => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "bright" : "dark"));
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

  return { theme, setTheme, toggleTheme, isDark: theme === "dark" };
}

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { t } = useTranslation();
  const { theme, toggleTheme, isDark } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    setIsAnimating(true);
    toggleTheme();
    setTimeout(() => setIsAnimating(false), 500);
  };

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
        {/* Sun icon */}
        <Sun
          className={cn(
            "absolute inset-0 h-5 w-5 transition-all duration-500 ease-out",
            isDark
              ? "rotate-0 scale-100 opacity-100"
              : "rotate-90 scale-0 opacity-0"
          )}
        />
        {/* Moon icon */}
        <Moon
          className={cn(
            "absolute inset-0 h-5 w-5 transition-all duration-500 ease-out",
            isDark
              ? "-rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100"
          )}
        />
      </div>
      
      {/* Ripple effect on click */}
      {isAnimating && (
        <span
          className={cn(
            "absolute inset-0 rounded-md animate-theme-ripple",
            isDark ? "bg-warning/20" : "bg-primary/20"
          )}
        />
      )}
    </Button>
  );
}
