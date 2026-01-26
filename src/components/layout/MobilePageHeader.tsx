import { ArrowLeft, Share2, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";

interface MobilePageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onShare?: () => void;
  onBookmark?: () => void;
  isBookmarked?: boolean;
  rightContent?: React.ReactNode;
  className?: string;
}

export function MobilePageHeader({
  title,
  subtitle,
  showBack = true,
  onShare,
  onBookmark,
  isBookmarked = false,
  rightContent,
  className,
}: MobilePageHeaderProps) {
  const navigate = useNavigate();
  const [isCompact, setIsCompact] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Collapse header when scrolling down past 100px
      if (currentScrollY > 100 && currentScrollY > lastScrollY.current) {
        setIsCompact(true);
      } else if (currentScrollY < lastScrollY.current - 10 || currentScrollY < 50) {
        setIsCompact(false);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      ref={headerRef}
      className={cn(
        "sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border transition-all duration-300 lg:hidden",
        isCompact ? "py-2" : "py-3",
        className
      )}
    >
      <div className="flex items-center gap-3 px-4">
        {/* Back button */}
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        {/* Title area */}
        <div className={cn(
          "flex-1 min-w-0 transition-all duration-300",
          isCompact && "text-center"
        )}>
          <h1 className={cn(
            "font-semibold text-foreground truncate transition-all duration-300",
            isCompact ? "text-base" : "text-lg"
          )}>
            {title}
          </h1>
          {subtitle && !isCompact && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 shrink-0">
          {onBookmark && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={onBookmark}
            >
              <Star
                className={cn(
                  "h-5 w-5 transition-colors",
                  isBookmarked ? "fill-primary text-primary" : "text-muted-foreground"
                )}
              />
            </Button>
          )}
          {onShare && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={onShare}
            >
              <Share2 className="h-5 w-5 text-muted-foreground" />
            </Button>
          )}
          {rightContent}
        </div>
      </div>
    </div>
  );
}
