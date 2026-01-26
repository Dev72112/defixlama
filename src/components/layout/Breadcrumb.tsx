import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

// Generate breadcrumbs from current path
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const pathSegments = pathname.split("/").filter(Boolean);
  
  const breadcrumbs: BreadcrumbItem[] = [];
  
  let currentPath = "";
  for (const segment of pathSegments) {
    currentPath += `/${segment}`;
    const label = segment
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    
    breadcrumbs.push({
      label,
      href: currentPath,
    });
  }
  
  return breadcrumbs;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const location = useLocation();
  const breadcrumbs = items || generateBreadcrumbs(location.pathname);
  
  if (breadcrumbs.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1.5 text-sm", className)}
    >
      {/* Home */}
      <Link
        to="/"
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>

      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        
        return (
          <div key={item.href || item.label} className="flex items-center gap-1.5">
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            {isLast || !item.href ? (
              <span className={cn(
                "truncate max-w-[200px]",
                isLast ? "text-foreground font-medium" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            ) : (
              <Link
                to={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[200px]"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
